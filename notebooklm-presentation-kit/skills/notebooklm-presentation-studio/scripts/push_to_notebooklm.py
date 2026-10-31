#!/usr/bin/env python3
"""
Push one run bundle (built by build_brief.py) into a new NotebookLM notebook
and generate all three outputs from manifest.json's output_jobs — Video
Overview (Short), Video Overview (Explainer/long), and Slide deck
(Presenter slides) — see RULES.md "Output: always three, every run".

Ground truth this script encodes (validated live on notebooklm.google.com,
2026-08-22/23 — re-verify if Google changes the UI and this starts failing):
  - Notebook creation: home page "+ Create new" button.
  - Direct file upload has NO accessible <input type=file> reachable from
    automation (it lives behind a cross-origin picker) - DO NOT attempt it.
    "Copied text" paste (Add sources -> Copied text -> textarea -> Insert)
    is a normal in-page textarea and works reliably; each pasted note
    becomes its own citable source, like any other NotebookLM source.
  - Studio panel buttons are named exactly: "Audio Overview", "Slide deck",
    "Video Overview", "Mind Map", "Reports", "Flashcards", "Quiz",
    "Infographic", "Data table".
  - Video Overview's Customize dialog: "Format" cards "Explainer" (default)
    vs "Short", a free-text box under "What should the video focus on?"
    (placeholder "Describe your own"), and a Sources selector.
  - Slide deck's Customize dialog: "Format" cards "Detailed deck" (default,
    comprehensive/text-heavy) vs "Presenter slides" (visual, talking-points
    style - this is what RULES.md wants), a Length toggle (Short/Default),
    a language dropdown, a Sources selector, and a free-text box under
    "Describe the slide deck that you want to create" (placeholder starts
    "Add a high-level outline or guide the audience..."). The page has at
    least three <textarea> elements at once (Chat query box, Sources search
    box, this dialog's own box) with different placeholders - matching by
    placeholder or by `role="dialog"` both broke in practice.
    `fill_customize_focus_box` instead walks up from the unambiguous
    "Generate" button (page-wide unique, only exists while a dialog is
    open) to its nearest ancestor containing a textarea.
  - Only one Video Overview generates at a time per notebook - see
    VIDEO_SERIALIZE_WAIT_S and "Known open issue" in SKILL.md.

Risk mitigations (per user request to "solve the risks" of full automation):
  - Every step is wrapped; on failure the run's status file records which
    step failed + a screenshot, instead of crashing silently.
  - Exactly the three jobs in manifest.json's output_jobs are kicked off per
    run, once each - never a duplicate or a retry-storm against NotebookLM.
  - Reuses the notebooklm-skill-master skill's already-authenticated
    Chromium profile instead of creating a second Google login flow.
"""
import argparse
import json
import re
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

from patchright.sync_api import sync_playwright, TimeoutError as PWTimeout

SKILL_DIR = Path(__file__).resolve().parent.parent
NOTEBOOKLM_SKILL_DIR = SKILL_DIR.parent / "notebooklm-skill-master"

# Reuse the notebooklm-skill-master skill's own launch helper rather than
# reimplementing it: it carries a required cookie-reinjection workaround
# for a Playwright persistent-context bug (session cookies with expires=-1
# don't survive user_data_dir reloads on their own - see
# https://github.com/microsoft/playwright/issues/36139). Re-launching
# without it would silently land on a logged-out page.
sys.path.insert(0, str(NOTEBOOKLM_SKILL_DIR / "scripts"))
from browser_utils import BrowserFactory  # noqa: E402

NOTEBOOKLM_URL = "https://notebooklm.google.com"
NAV_TIMEOUT = 30_000
STEP_TIMEOUT = 15_000
GENERATE_POLL_INTERVAL_S = 20
GENERATE_MAX_WAIT_S = 30 * 60  # 30 minutes; final poll after all jobs are kicked off
# Video Overview appears to be gated by an ACCOUNT-WIDE daily quota, not a
# per-notebook or in-flight limit - confirmed live 2026-08-23: waiting 15
# real minutes for a first video to finish before starting a second did NOT
# free up a second generation, but the exact same notebook's Video Overview
# button worked cleanly again minutes after that (and immediately re-hit the
# same "reached your daily limit" banner on the very next real click). At
# normal cadence (2 videos every 2 weeks) this should essentially never bite
# - it only showed up because of unusually heavy same-day testing while
# building this pipeline. See SKILL.md "Known open issue" before adding any
# wait-and-retry logic back in; it doesn't help this failure mode.

FRONTMATTER_RE = re.compile(r"^---\n.*?\n---\n", re.S)
WIKILINK_RE = re.compile(r"\[\[([^\]|]+)(?:\|[^\]]+)?\]\]")


def load_run(run_dir: Path):
    return json.loads((run_dir / "manifest.json").read_text(encoding="utf-8"))


def clean_note_text(raw: str, title: str) -> str:
    body = FRONTMATTER_RE.sub("", raw, count=1)
    body = WIKILINK_RE.sub(r"\1", body)
    return f"# {title}\n\n{body.strip()}"


def write_status(run_dir: Path, **fields):
    status_path = run_dir / "push_status.json"
    status = {}
    if status_path.exists():
        status = json.loads(status_path.read_text(encoding="utf-8"))
    status.update(fields)
    status["updated_at"] = datetime.now(timezone.utc).isoformat()
    status_path.write_text(json.dumps(status, indent=2, ensure_ascii=False), encoding="utf-8")


def fail(run_dir: Path, page, step: str, err: Exception):
    shot_path = run_dir / f"failure_{step}.png"
    try:
        page.screenshot(path=str(shot_path))
    except Exception:
        shot_path = None
    write_status(
        run_dir,
        status="failed",
        failed_step=step,
        error=str(err),
        screenshot=str(shot_path) if shot_path else None,
    )
    print(f"FAILED at step '{step}': {err}", file=sys.stderr)
    sys.exit(1)


# One-off interstitials Google shows on a fresh profile/session that block
# clicks underneath via a cdk-overlay-container until dismissed. Add to this
# list whenever a new one surfaces rather than special-casing it elsewhere -
# this is the generic mitigation for the exact failure mode that broke the
# first live run (2026-08-22): a "NotebookLM is now Gemini Notebook" splash
# with a "Let's go" button intercepted the Create-new click.
INTERSTITIAL_DISMISS_LABELS = ["Let's go", "Got it", "Dismiss", "No thanks", "Close"]


def dismiss_interstitials(page):
    for label in INTERSTITIAL_DISMISS_LABELS:
        button = page.get_by_role("button", name=label, exact=True)
        try:
            button.wait_for(state="visible", timeout=1500)
            button.click(timeout=2000)
            page.wait_for_timeout(300)
        except PWTimeout:
            continue
    # Generic fallback (2026-10-22): a new splash ("We're giving you more
    # flexibility...") had only an unlabeled X (Material icon, name "close"),
    # which none of the exact labels above match. Close any open overlay dialog
    # via its close button, else Escape, up to 3 times.
    for _ in range(3):
        overlay_close = page.locator(
            ".cdk-overlay-container button", has_text=re.compile(r"^\s*close\s*$", re.I)
        ).or_(page.locator(".cdk-overlay-container button[aria-label*='close' i]"))
        try:
            overlay_close.first.wait_for(state="visible", timeout=1500)
            overlay_close.first.click(timeout=2000)
            page.wait_for_timeout(400)
        except PWTimeout:
            break


def create_notebook(page):
    page.goto(NOTEBOOKLM_URL, wait_until="domcontentloaded", timeout=NAV_TIMEOUT)
    dismiss_interstitials(page)
    # 2026-10-22: product rebranded to "Gemini Notebook"; the home-page button is
    # now "+ New notebook" (was "+ Create new"). Accept both so either UI works.
    page.get_by_role(
        "button", name=re.compile(r"(Create new|New notebook)", re.I)
    ).first.click(timeout=STEP_TIMEOUT)
    page.wait_for_url(re.compile(r".*/notebook/(?!creating).+"), timeout=NAV_TIMEOUT)
    dismiss_interstitials(page)
    return page


def ensure_panel(page, tab_name: str):
    """NotebookLM collapses Sources/Chat/Studio into tabs on a narrow
    window (real Chrome can open at a small default size under
    automation) - click the tab if present; a no-op on the wide desktop
    3-column layout where it doesn't exist. This is what broke the second
    live run: 'Add sources' isn't in the DOM at all while the Chat tab is
    the active one."""
    tab = page.get_by_role("tab", name=tab_name, exact=True)
    try:
        tab.wait_for(state="visible", timeout=1500)
        tab.click(timeout=2000)
        page.wait_for_timeout(300)
    except PWTimeout:
        pass


def add_pasted_source(page, title: str, body: str):
    dismiss_interstitials(page)  # splash can appear shortly after notebook creation
    ensure_panel(page, "Sources")
    # 2026-10-22: button renamed "Add sources" -> "+ Sources" (a11y name "add Sources").
    # Intermittent (2026-10-22): the first click sometimes doesn't open the dialog
    # (a late splash / re-render swallows it). Retry opening up to 3 times and
    # match "Copied text" loosely (icon text can be part of the accessible name).
    copied = page.get_by_text(re.compile(r"copied text", re.I)).first
    for attempt in range(3):
        dismiss_interstitials(page)
        # Diagnosed 2026-10-22: in the automation browser NO click on "+ Sources" opens
        # the dialog (plain, mouse and dispatched clicks all fail), but loading the
        # same notebook URL with ?addSource=true opens it reliably - and that is
        # exactly what a real click does in a normal browser.
        base_url = page.url.split("?")[0]
        page.goto(base_url + "?addSource=true", wait_until="domcontentloaded", timeout=NAV_TIMEOUT)
        try:
            copied.wait_for(state="visible", timeout=6000)
            break
        except PWTimeout:
            if attempt == 2:
                raise
            page.wait_for_timeout(800)
    copied.click(timeout=STEP_TIMEOUT)
    box = page.get_by_placeholder("Paste text here")
    box.wait_for(state="visible", timeout=STEP_TIMEOUT)
    box.click()
    box.fill(clean_note_text(body, title))
    page.get_by_role("button", name="Insert", exact=True).click(timeout=STEP_TIMEOUT)
    # Wait for the dialog to close (source list updates) before the next paste.
    page.get_by_placeholder("Paste text here").wait_for(state="hidden", timeout=STEP_TIMEOUT)
    page.wait_for_timeout(800)


def rename_notebook(page, title: str):
    # Notebook title is an editable heading near top-left; click then select-all + type.
    # No-op (falls through to the except) once Gemini has already auto-titled the
    # notebook from its sources, which is an acceptable fallback either way.
    heading = page.get_by_text("Untitled notebook", exact=False).first
    try:
        heading.click(timeout=STEP_TIMEOUT)
        page.keyboard.press("Control+A")
        page.keyboard.type(title[:100])
        page.keyboard.press("Tab")
    except PWTimeout:
        pass  # non-fatal: auto-generated title is an acceptable fallback


# This page has at least three <textarea> elements at once: the Chat query
# box, the Sources panel's "Search the web" box, and (once a Studio button
# is clicked) the Customize dialog's own focus/description box. Excluding
# known ones by placeholder is whack-a-mole - it missed the Sources search
# box on the third live attempt (2026-08-23) after already missing the Chat
# box on the first.
#
# CORRECTED 2026-09-12: the previous approach ("walk UP from the Generate
# button to its nearest ancestor containing a textarea, use `.last` within
# that ancestor's subtree") looked structurally sound but broke live on the
# Slide deck dialog - the screenshot taken at failure time showed the real
# "Describe the slide deck..." textarea plainly visible and empty, meaning
# the ancestor-xpath either matched too broad a subtree (picking up an
# unrelated textarea elsewhere in DOM order) or the `.last` pick landed on
# the wrong node. Root cause not fully isolated (would need live DOM
# inspection to confirm), but the fix doesn't require knowing the exact
# mechanism: NotebookLM's Customize dialogs are modal overlays (this file
# already treats them as Angular CDK overlays - see the interstitial-dismiss
# comment above), and CDK overlays are appended at the END of <body>, after
# every other page textarea. So "the last VISIBLE textarea on the whole
# page" is a simpler and more robust selector than any ancestor-relative
# walk - it doesn't care where the Generate button sits structurally at all.
def select_format_card(page, card_label: str):
    """Click a named Format card in whichever Customize dialog is open
    (e.g. 'Short'/'Explainer' for Video Overview, 'Presenter slides'/
    'Detailed deck' for Slide deck). Page-wide is safe here: none of these
    exact labels appear anywhere else in the notebook UI. Best-effort: a
    missing card is a silent no-op rather than a failure, since a future UI
    change here should degrade to "used NotebookLM's default", not crash
    the whole run."""
    card = page.get_by_text(card_label, exact=True)
    try:
        card.wait_for(state="visible", timeout=3000)
        card.click(timeout=2000)
        page.wait_for_timeout(300)
    except PWTimeout:
        pass


def select_language(page, language) -> bool:
    """Choose the output language in an open Customize dialog (added 2026-10-22).
    Options are shown in their own native names ("English", "Deutsch", "Francais", ...).
    Best-effort: returns False instead of raising so a UI change degrades to
    NotebookLM's default language rather than killing the run."""
    if not language:
        return False
    option_re = {
        "English": r"^English( \(.*\))?$",
    }.get(language, rf"^{re.escape(language)}$")
    openers = (
        page.get_by_role("combobox", name=re.compile("language", re.I)).first,
        page.locator("mat-select").first,
        page.get_by_text(re.compile(r"^English( \(.*\))?$")).first,
    )
    for opener in openers:
        try:
            opener.click(timeout=3000)
            page.get_by_role("option", name=re.compile(option_re, re.I)).first.click(timeout=4000)
            page.wait_for_timeout(300)
            return True
        except PWTimeout:
            page.keyboard.press("Escape")  # close a half-open list before trying the next opener
            continue
    return False


# The page always has exactly two persistent <textarea> elements regardless
# of any dialog: the Chat query box (aria-label="Query box") and the
# Sources panel's search box (aria-label="Discover sources based on the
# inputted query") - both exact strings confirmed live 2026-09-12. Every
# Customize dialog's own focus/description box has a THIRD, distinct
# aria-label of its own (e.g. "Describe the slide deck that you want to
# create" - also confirmed live). Excluding the two known labels is
# completely robust regardless of which dialog is open or what it's called,
# and sidesteps parent-scoping entirely.
_PERSISTENT_TEXTAREA_LABELS = {
    "Query box",
    "Discover sources based on the inputted query",
}


def _find_dialog_textarea(page):
    """Return the Locator for the currently-open Customize dialog's own
    textarea, or None if none is visible right now (e.g. NotebookLM's
    "Couldn't load topics" chip-only state, no free-text box rendered yet)."""
    tas = page.locator("textarea:visible")
    for i in range(tas.count()):
        el = tas.nth(i)
        label = el.get_attribute("aria-label") or ""
        if label not in _PERSISTENT_TEXTAREA_LABELS:
            return el
    return None


def fill_customize_focus_box(page, customize_text: str) -> bool:
    # HISTORY, 2026-09-12 (kept for the next person who has to debug this
    # again): two earlier approaches both failed against live ground truth
    # and are worth knowing not to repeat.
    #   1. "Last visible textarea on the whole page" - broke because
    #      Playwright's `:visible` only checks rendering (non-zero box, not
    #      display:none), not whether a modal backdrop is covering it. When
    #      no dialog textarea existed yet, this picked the persistent Chat
    #      query box instead, and the click then hung for 30s because
    #      `<mat-dialog-actions>` from the open `cdk-overlay-container`
    #      literally intercepts pointer events on it (visible in the actual
    #      Playwright error trace, which is what first revealed the real
    #      class names to investigate).
    #   2. "Scope to the dialog container, then search its textarea
    #      descendants" - looked right and was CONFIRMED correct via a raw
    #      JS ancestor-chain walk (the dialog's textarea's real parentElement
    #      chain does pass through `<mat-dialog-container id="mat-mdc-dialog-0">`)
    #      but Playwright/Patchright's locator chaining
    #      (`page.locator("mat-dialog-container").locator("textarea")`)
    #      still returned 0 matches in the same live session where the DOM
    #      truth said otherwise - an engine quirk (possibly patchright's
    #      stealth patches interacting with custom-element scoping), not a
    #      DOM problem. Don't re-attempt parent/ancestor scoping here without
    #      re-verifying it against a fresh diagnostic first.
    # This exclusion-based approach needs neither: it doesn't care where the
    # element sits in the tree, only which two labels to skip.
    box = _find_dialog_textarea(page)
    if box is None:
        # Video Overview's dialog sometimes fails to load its topic-suggestion
        # chips ("Couldn't load topics. Refresh or add your own." - seen live
        # 2026-09-12) and replaces the usual free-text box with a collapsed
        # "Customised topic" option that must be clicked to reveal a textarea
        # at all. Try that specific recovery before giving up.
        try:
            page.get_by_text("Customised topic", exact=False).first.click(timeout=3000)
            page.wait_for_timeout(500)
        except PWTimeout:
            pass
        box = _find_dialog_textarea(page)
    if box is None:
        return False
    try:
        box.wait_for(state="visible", timeout=5000)
    except PWTimeout:
        return False
    box.click()
    box.fill(customize_text)
    return True


def generate_output(page, job: dict, run_dir: Path, dry_run: bool = False) -> dict:
    dismiss_interstitials(page)
    ensure_panel(page, "Studio")

    button = page.get_by_role("button", name=job["studio_button"], exact=True)
    # 2026-10-22: after pasting sources the right panel can be left on a source
    # viewer ("Studio > Note") instead of the list of outputs. If the output
    # button isn't visible, click the "Studio" breadcrumb to get back to the list.
    # Wide layout: a "Studio >" breadcrumb. Compact layout (small window): a back
    # arrow (aria-label/name contains "back") above the open source. Try both.
    for _ in range(3):
        try:
            button.wait_for(state="visible", timeout=2000)
            break
        except PWTimeout:
            pass
        for back in (
            page.get_by_role("button", name=re.compile(r"^\s*(arrow_)?back\s*$", re.I)).first,
            page.locator("button[aria-label*='back' i]").first,
            page.get_by_text("Studio", exact=True).first,
        ):
            try:
                back.click(timeout=2500)
                page.wait_for_timeout(800)
                break
            except PWTimeout:
                continue
    button.wait_for(state="visible", timeout=STEP_TIMEOUT)
    button.click(timeout=STEP_TIMEOUT)
    page.wait_for_timeout(500)

    # A generation quota/cooldown (seen live 2026-08-23: "You have reached
    # your daily Video Overview limit" - in practice triggers after a single
    # Video Overview per notebook, so more likely a one-in-flight-at-a-time
    # limit than a literal calendar-day cap) visually disables that type's
    # Studio button WITHOUT a disabled/aria-disabled attribute Playwright's
    # is_disabled() catches on this site. Detect it structurally instead: if
    # clicking didn't make a real "Generate" button appear, nothing opened -
    # treat that as blocked and move on rather than burning the run.
    # 2026-10-22: the dialog's confirm button is now "Generate now" (next to
    # "Generate later"); it used to be "Generate". Match only those two exact
    # names so "Generate later" is never clicked.
    generate_button = page.get_by_role(
        "button", name=re.compile(r"^\s*Generate( now)?\s*$", re.I)
    ).first
    try:
        generate_button.wait_for(state="visible", timeout=4000)
    except PWTimeout:
        return {"status": "blocked_no_dialog"}

    format_card = job.get("video_format") or job.get("deck_format")
    if format_card:
        select_format_card(page, format_card)
        # Selecting a format card can trigger Angular to re-render the
        # dialog's content around the focus textarea; give it a beat before
        # the first fill attempt rather than racing it.
        page.wait_for_timeout(500)

    if job.get("length") and job.get("deck_format"):
        select_format_card(page, job["length"])  # "Short"/"Default" segmented control (slides only)
    language_applied = select_language(page, job.get("language"))

    applied = fill_customize_focus_box(page, job["customize_prompt"])
    if not applied:
        # One retry: covers the same re-render race, just slower than expected.
        page.wait_for_timeout(1500)
        applied = fill_customize_focus_box(page, job["customize_prompt"])

    if dry_run:
        # Never click Generate in dry-run mode - this exists specifically to
        # validate the Customize-dialog fill logic against a live notebook
        # without spending a real generation (or daily video quota) on it.
        try:
            page.screenshot(path=str(run_dir / f"dryrun_{job['label']}.png"))
        except Exception:
            pass
        page.keyboard.press("Escape")
        page.wait_for_timeout(300)
        return {"status": "dry_run", "customize_prompt_applied": applied, "language_applied": language_applied}

    if not applied:
        # CORRECTED 2026-09-12: do NOT click Generate on an uncustomized
        # dialog - the previous version did, which silently spent a real
        # generation (and notebook-wide daily video quota) on output that
        # ignores every RULES.md requirement (beginner framing, sub-topic
        # structure, etc.), with no error surfaced beyond a screenshot. Close
        # the dialog and report the failure instead so a human decides
        # whether to retry the fill or accept a manual/default generation -
        # never spend real quota on a silent default.
        try:
            page.screenshot(path=str(run_dir / f"customize_not_applied_{job['label']}.png"))
        except Exception:
            pass
        try:
            page.keyboard.press("Escape")
        except Exception:
            pass
        return {"status": "customize_failed"}

    generate_button.click(timeout=STEP_TIMEOUT)
    page.wait_for_timeout(1000)  # let the Generate click register before the next job's dialog opens
    return {"status": "generating", "customize_prompt_applied": True, "language_applied": language_applied}


def nothing_still_generating(page) -> bool:
    return page.get_by_text(re.compile("generating|creating", re.I)).count() == 0


def wait_until_idle(page, timeout_s: int) -> bool:
    """Block until no Studio card shows a generating/creating indicator, or
    the timeout elapses. Used both mid-run (to serialize two Video Overview
    jobs - see VIDEO_SERIALIZE_WAIT_S) and as the final poll after all jobs
    are kicked off."""
    deadline = time.time() + timeout_s
    while time.time() < deadline:
        page.wait_for_timeout(GENERATE_POLL_INTERVAL_S * 1000)
        if nothing_still_generating(page):
            return True
    return False


def poll_for_completion(page, run_dir: Path):
    if wait_until_idle(page, GENERATE_MAX_WAIT_S):
        write_status(run_dir, status="complete", notebook_url=page.url)
        return True
    write_status(run_dir, status="still_generating_at_timeout", notebook_url=page.url)
    return False


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("run_dir", help="Path to a run directory produced by build_brief.py")
    parser.add_argument(
        "--headless", action="store_true",
        help="Run without a visible browser window (for unattended/scheduled runs). "
             "Default is headed, since that's what's been live-verified against NotebookLM's UI.",
    )
    parser.add_argument(
        "--existing-notebook-url", default=None,
        help="Skip create_notebook + add_pasted_source entirely and navigate straight to this "
             "already-populated notebook URL instead. For safely re-testing the Customize-dialog "
             "logic against a real notebook without creating a duplicate or re-uploading sources.",
    )
    parser.add_argument(
        "--dry-run", action="store_true",
        help="Never click the final Generate button - just report whether each job's Customize "
             "prompt was applied, with a screenshot per job. For validating a fix without spending "
             "a real generation or the account's daily video quota.",
    )
    args = parser.parse_args()
    run_dir = Path(args.run_dir)

    manifest = load_run(run_dir)
    # Reset in case this run_dir is being retried after a previous failed
    # attempt - stale failed_step/error/screenshot fields must not survive
    # into a run that goes on to succeed.
    (run_dir / "push_status.json").write_text(
        json.dumps({"status": "starting"}, indent=2), encoding="utf-8"
    )

    with sync_playwright() as p:
        context = BrowserFactory.launch_persistent_context(p, headless=args.headless)
        page = context.pages[0] if context.pages else context.new_page()
        # Real Chrome can reopen at a tiny remembered size (seen 786x450), which switches
        # NotebookLM to its compact layout and hides the Studio buttons. Force a wide window.
        if not args.headless:
            try:
                cdp = context.new_cdp_session(page)
                win = cdp.send("Browser.getWindowForTarget")
                cdp.send("Browser.setWindowBounds", {"windowId": win["windowId"], "bounds": {
                    "left": 20, "top": 20, "width": 1500, "height": 950, "windowState": "normal"}})
            except Exception as e:  # cosmetic helper, never fatal
                print(f"window resize skipped: {e}")

        if args.existing_notebook_url:
            page.goto(args.existing_notebook_url, wait_until="domcontentloaded", timeout=NAV_TIMEOUT)
            dismiss_interstitials(page)
        else:
            try:
                create_notebook(page)
            except Exception as e:
                fail(run_dir, page, "create_notebook", e)
            # Save the URL immediately so a later failure can resume this notebook
            # with --existing-notebook-url instead of creating a duplicate.
            write_status(run_dir, notebook_url=page.url.split("?")[0])

            for name in manifest["sources"]:
                src_path = run_dir / "sources" / name
                title = Path(name).stem
                try:
                    add_pasted_source(page, title, src_path.read_text(encoding="utf-8"))
                except Exception as e:
                    fail(run_dir, page, f"add_source[{name}]", e)

            try:
                rename_notebook(page, manifest["topic_label"])
            except Exception as e:
                write_status(run_dir, rename_error=str(e))  # non-fatal

        results = {}
        for job in manifest["output_jobs"]:
            try:
                results[job["label"]] = generate_output(page, job, run_dir, dry_run=args.dry_run)
            except Exception as e:
                fail(run_dir, page, f"generate_output[{job['label']}]", e)

        if args.dry_run:
            write_status(run_dir, status="dry_run_complete", jobs=results, notebook_url=page.url)
            context.close()
            return

        write_status(run_dir, status="generating", jobs=results, notebook_url=page.url)
        poll_for_completion(page, run_dir)
        context.close()


if __name__ == "__main__":
    main()
