# Lessons and pitfalls (from building the logistic, linear and cluster pages)

## Tooling
- **Shell heredocs with quotes** broke twice. For anything with nested quotes write the file with the Write tool, then run it. Python replacement scripts: put them in a file, not a heredoc.
- **Python normal strings turn `\n` into a real newline** when you generate JS with Python. Escape as `\\n` or use raw strings.
- **Truncating a file at a marker** (`c=c[:i]+new`) silently deletes everything after it, including `post.push` hooks appended at the end. After any splice, grep for the hooks you expect.
- JS bracket slips in generated strings (`[['a',x]:[]` missing a `]`): run `node --check` on every file after each patch.
- The browser pane cannot run JS on `file://`; serve with `python -m http.server`. Set `<meta charset="utf-8">` or titles show mojibake locally (the artifact wrapper adds it).
- `pkill` is not available in Git Bash; stop servers with PowerShell: `Get-CimInstance Win32_Process -Filter "Name like 'python%'" | Where CommandLine -match 'http.server PORT'`.
- A tool result shows only ~1000 characters of a long string. To read long text use `browser_batch` with many `slice(a,b)` calls (about 14 per batch).
- Posting data from an https page to `http://127.0.0.1` is blocked/hangs (Private Network Access prompt). Do not rely on it.

## Udemy
- Public curriculum: `/api-2.0/courses/<id>/public-curriculum-items/?page_size=100&fields[lecture]=title,object_index&fields[chapter]=title,object_index` (works without login; paginate).
- Logged in (user's Chrome): `/api-2.0/courses/<id>/subscriber-curriculum-items/` is slow with large page sizes; use `page_size=100&page=N`. Captions: `/api-2.0/users/me/subscribed-courses/<id>/lectures/<lectureId>/?fields[lecture]=asset&fields[asset]=captions` then fetch the VTT `url`, strip cue numbers and timestamps.
- Local folder lecture numbers may equal Udemy index minus a constant (here 8). Check.
- Exercises usually have no captions (`nocap`).
- Close the Chrome tab you opened when done.

## Artifact tool
- To update an artifact from an earlier conversation: `read` it first (or have published it in this conversation), then publish with `url` and the **same file path**.
- A saved artifact file starts with a harness skeleton (`<!doctype html><html><head>...<body>`) and may end with `</body></html>`. Strip both before republishing a modified copy.
- Page `<title>`: 2 to 4 words, no "Name: explainer".

## Content / correctness
- Compute every number from data in JS (`f(D.x)`); then text and charts cannot disagree. Add a verification table that recomputes key values from raw data in the page.
- Check claims you are about to write against the data (e.g. "clean vertical cut": the value 6 appeared in both clusters, so the wording became "almost").
- Cluster label numbers are arbitrary: relabel by first appearance and say so.
- Library defaults change by version (sklearn `n_init`, statsmodels VIF `standardize`): pin parameters and state versions.
- Course notebooks contain real bugs (undefined variable, wrong dropped column, file name mismatch). Run them.
- A transcript can reveal that your earlier guess about a lecture was wrong. Read the source before writing the station.

## UX
- Users get lost in long Hebrew text: the back strip, history list and manual bookmark matter more than extra widgets.
- Put the executive summary and good/bad table first; keep code collapsible via "lite" mode.
- Tag everything not from the course. Tag unknowns explicitly.
- Keep definition cards single-sourced (one object feeds card, popover, glossary, summary).

## Bugs found by the user in the hosted page (test these every time)
- A native `<select>` jump menu does not fire `change` when the user picks the option that is already shown, and the shown option follows the scroll. Use a custom button + panel list instead (always fires, shows ✓ and current).
- A list built with `groups[i].push(...)` instead of `groups[i][1].push(...)` silently produced a menu without any stations. After building, assert the number of entries (stations + parts) in the page test.
- Toggles that change little look broken: EN mode must annotate every Hebrew mention (not only first-mention links), and "lite/no code" mode must show a visible banner saying what is hidden and how to undo (the state persists in localStorage, so the user may think code is missing).
- Always test the published page in the user's real Chrome (screenshot + clicks), not only the local copy.

## Artifact viewer and NotebookLM
- **`href="#id"` links do not work inside the published artifact**: the viewer handles hash links itself, so term links and in-page links did nothing there (they worked locally). After building, convert every `a[href^="#"]` to `data-to` + `role="link"` + `tabindex=0` and handle clicks and Enter on `a[data-to]` (`deHref()` in `lib3.js`). Buttons (jump menu, TOC) were never affected.
- A hover popover that does not fit below the term was placed at the top of the screen *over the term*, so the click hit the popover. Place it in the larger free band above or below and give it `max-height` + `overflow:auto`; let it stay open while the mouse is on it (hide on a 350ms timer, cancel on `mouseenter`).
- `#14`-style tags inside Hebrew show as `14#`: allow an optional `#` at the start of the bidi token regex.
- Signed numbers written after the digits in Hebrew strings (`64%−`, `68%+`, `75+`) read wrong; write `−64%`/`+68%` inside an LTR isolate, or rephrase ("יותר מ-75").
- Publish file: the Artifact harness adds doctype/head/body; build a second file that keeps only the head content (title, fonts, style) and the body content, and set `lang`/`dir` on `document.documentElement` from script.
- Generating build scripts through Bash heredocs broke again (escapes, quotes). Write `build.py` and fix scripts with the Write tool.
- Count the claims you make about the sources in code (for example the length of the contradictions list) instead of typing the number into the summary.

## English framework, first real build (Udemy IB course 965832, section 10 "Asset management", Oct 2026)
- A Udemy "section of 4 items" may be 3 lectures + 1 quiz. Quiz questions are readable (logged in) via `/api-2.0/quizzes/<quizId>/assessments/?version=1&page_size=50&fields[assessment]=id,assessment_type,prompt,correct_response,question_plain`; the curriculum gives the quiz id as a `q` row.
- `tpl3.html` already declares `const D=__DATA__;`. Do NOT declare your own `const D` in content (SyntaxError "Identifier 'D' has already been declared" kills the whole page). Put course data in a JSON file and inject it into `__DATA__` in the build.
- Do not use `class="cap"` for a caption paragraph: `.cap` is the code-cell caption style (monospace flex) and breaks layout. The local test missed it because no screenshot was taken of the top; screenshot the executive summary too.
- `toc3.js` lists a figure AND the `<h4>` title inside it, so every titled calculator appears twice in Contents. Filter `h3,h4` inside `figure` in `collect` (patched in this build's copy, not yet in the skill framework).
- `headingAt()` in `lib3.js` read the whole station `<h2>` (title span + `<small>` subtitle) so the back strip showed "Private equity fundsLecture 60 · strategy…". Use `h2 .en` when present (patched in this build's copy).
- `deHref()` is still not in the framework: add it to the boot (convert `a[href^="#"]` to `data-to`, handle click/Enter). After it, term links worked in the published viewer.
- [Fixed in the current framework: popover is placed outside the term and stays open while hovered] Term chips in the station context card sit near the top of the screen; the hover popover then opens *above/over* them and the click did not jump (popover hides on mouseout, so its Jump button cannot be reached). Term links in body text further down worked. Popover placement needs the fix described in the lessons.
- Avoid short glossary aliases ("exit", "carry", "hurdle", "passive", "GP", "allocation") because autoLink would link them inside calculator `<label>`s; check `document.querySelectorAll('label a').length===0`.
- `station()` shows "Based on the video transcript" for any station with LECN notes, even a quiz station; consider a per-station label.
- `examples/en_demo/README.md` still mentions `assets/framework-en` and `make_english.py`; the real folder is `assets/framework`.
- `DSN`/`KIND` hold data-science labels ("Countries (6)"…); override them in content (`DSN.dn='Video captions'`, `KIND.qz=[...]`).
