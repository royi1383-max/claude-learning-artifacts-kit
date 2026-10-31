#!/usr/bin/env python3
"""
Build a NotebookLM run bundle from ANY source material (any domain).

Inputs (mix freely):
  --file PATH       a .md / .txt / .pdf / .docx file (repeatable)
  --folder PATH     every .md / .txt / .pdf / .docx file inside (repeatable, recursive)
  --url URL         a web page, fetched and reduced to text (repeatable)
  --text "..."      pasted text (repeatable)
  --text-file PATH  a UTF-8 text file holding pasted material (repeatable)

Obsidian vault inputs (see README, "Using it with an Obsidian vault"):
  --vault PATH          root folder of your vault
  --vault-folder REL    every note under this vault-relative folder (recursive)
  --moc "Note title"    a map-of-content / hub note: its [[wikilinked]] notes are collected
                        (one level deep, up to --max-notes), and its headings become the
                        section order unless --sections is given
  --max-notes N         cap for --moc collection (default 25)

Required:
  --topic "Plain literal topic name"

Optional:
  --sections "A; B; C"   exact sub-topic order for the outputs. If omitted, NotebookLM
                         structures the topic itself from the sources.
  --language NAME       output language (default: English; any language NotebookLM offers)
  --origin "..."         short phrase naming where the sources came from
                         (default: "documents supplied by the user")
  --chunk-chars N        split any source longer than N characters (default 120000)

Output: data/runs/<timestamp>/ { sources/*.md, brief.md, manifest.json }
Then run:  <venv python> scripts/push_to_notebooklm.py data/runs/<timestamp>

All design decisions (formats, language rule, prompts) live in OUTPUT_SPEC.md; this
script only assembles them, so every topic gets the same output design.
"""
import argparse
import json
import re
import subprocess
import sys
import urllib.request
from datetime import datetime, timezone
from html.parser import HTMLParser
from pathlib import Path

SKILL_DIR = Path(__file__).resolve().parent.parent
SPEC_PATH = SKILL_DIR / "OUTPUT_SPEC.md"
TEXT_EXT = {".md", ".txt", ".markdown"}
ALL_EXT = TEXT_EXT | {".pdf", ".docx"}


def fenced_block_after(text, heading):
    idx = text.index(heading)
    m = re.search(r"```[a-z]*\n(.*?)\n```", text[idx:], re.S)
    if not m:
        raise RuntimeError(f"No fenced block found after heading: {heading!r}")
    return m.group(1)


def load_spec():
    text = SPEC_PATH.read_text(encoding="utf-8")
    settings = json.loads(fenced_block_after(text, "## Settings"))
    shared = fenced_block_after(text, "## Shared prompt")
    job_prompts = {label: fenced_block_after(text, f"## {label} prompt") for label in settings["jobs"]}
    return settings, shared, job_prompts


def safe_name(s, limit=80):
    s = re.sub(r"[\\/:*?\"<>|\r\n\t]+", " ", s).strip()
    s = re.sub(r"\s+", " ", s)
    return (s or "source")[:limit]


class _Strip(HTMLParser):
    def __init__(self):
        super().__init__()
        self.out, self.skip = [], 0

    def handle_starttag(self, tag, attrs):
        if tag in ("script", "style", "nav", "footer", "header", "noscript"):
            self.skip += 1
        if tag in ("p", "br", "li", "h1", "h2", "h3", "h4", "tr"):
            self.out.append("\n")

    def handle_endtag(self, tag):
        if tag in ("script", "style", "nav", "footer", "header", "noscript") and self.skip:
            self.skip -= 1

    def handle_data(self, data):
        if not self.skip and data.strip():
            self.out.append(data.strip() + " ")


def read_pdf(path):
    try:
        import fitz  # PyMuPDF
    except ImportError:
        sys.exit(f"PDF support needs PyMuPDF: pip install pymupdf  (file: {path})")
    doc = fitz.open(path)
    return "\n\n".join(f"[page {i + 1}]\n{p.get_text()}" for i, p in enumerate(doc))


def read_docx(path):
    try:
        import docx  # python-docx
    except ImportError:
        sys.exit(f"DOCX support needs python-docx: pip install python-docx  (file: {path})")
    return "\n".join(p.text for p in docx.Document(path).paragraphs)


def read_file(path: Path):
    ext = path.suffix.lower()
    if ext in TEXT_EXT:
        return path.read_text(encoding="utf-8", errors="ignore")
    if ext == ".pdf":
        return read_pdf(path)
    if ext == ".docx":
        return read_docx(path)
    raise ValueError(f"unsupported file type: {path}")


def fetch_url(url):
    # Prefer the defuddle CLI (clean article text) if installed; fall back to a plain HTML strip.
    try:
        r = subprocess.run(["defuddle", "parse", url, "--markdown"], capture_output=True, text=True, timeout=90)
        if r.returncode == 0 and len(r.stdout.strip()) > 200:
            return r.stdout
    except (FileNotFoundError, subprocess.TimeoutExpired):
        pass
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    html = urllib.request.urlopen(req, timeout=60).read().decode("utf-8", errors="ignore")
    p = _Strip()
    p.feed(html)
    return re.sub(r"\n\s*\n+", "\n\n", "".join(p.out)).strip()


def chunks(text, limit):
    if len(text) <= limit:
        return [text]
    parts, buf = [], ""
    for para in re.split(r"\n{2,}", text):
        if len(buf) + len(para) > limit and buf:
            parts.append(buf)
            buf = ""
        buf += para + "\n\n"
    if buf.strip():
        parts.append(buf)
    return parts


FM = re.compile(r"\A---\n.*?\n---\n", re.S)
WL = re.compile(r"\[\[([^\]|#]+)(?:#[^\]|]*)?(?:\|([^\]]*))?\]\]")


def clean_note(text):
    text = FM.sub("", text.replace("\r\n", "\n"), count=1)
    return WL.sub(lambda m: (m.group(2) or m.group(1)).strip(), text).strip()


def collect_obsidian(a):
    """Return ([(title, text)], derived_sections) from an Obsidian vault."""
    root = Path(a.vault)
    if not root.is_dir():
        sys.exit(f"--vault is not a folder: {root}")
    index = {}
    for p in root.rglob("*.md"):
        if ".obsidian" in p.parts or ".trash" in p.parts:
            continue
        index.setdefault(p.stem, p)
    items, derived = [], []
    if a.vault_folder:
        base = root / a.vault_folder
        if not base.is_dir():
            sys.exit(f"--vault-folder not found: {base}")
        for p in sorted(base.rglob("*.md")):
            items.append((p.stem, clean_note(p.read_text(encoding="utf-8", errors="ignore"))))
    if a.moc:
        hub = index.get(a.moc)
        if not hub:
            sys.exit(f"MOC note not found in vault: {a.moc}")
        raw = hub.read_text(encoding="utf-8", errors="ignore")
        derived = [h.strip("# ").strip() for h in re.findall(r"^#{2,3} .+$", raw, re.M)]
        seen = set()
        for m in WL.finditer(FM.sub("", raw.replace("\r\n", "\n"), count=1)):
            name = m.group(1).strip()
            if name in seen or name == a.moc or name not in index:
                continue
            seen.add(name)
            items.append((name, clean_note(index[name].read_text(encoding="utf-8", errors="ignore"))))
            if len(items) >= a.max_notes:
                break
    return items, derived


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--topic", required=True)
    ap.add_argument("--file", action="append", default=[])
    ap.add_argument("--folder", action="append", default=[])
    ap.add_argument("--url", action="append", default=[])
    ap.add_argument("--text", action="append", default=[])
    ap.add_argument("--text-file", action="append", default=[])
    ap.add_argument("--sections", default="")
    ap.add_argument("--vault")
    ap.add_argument("--vault-folder")
    ap.add_argument("--moc")
    ap.add_argument("--max-notes", type=int, default=25)
    ap.add_argument("--language")
    ap.add_argument("--origin", default="documents supplied by the user")
    ap.add_argument("--chunk-chars", type=int, default=120000)
    a = ap.parse_args()

    items = []  # (name, text)
    for f in a.file:
        p = Path(f)
        items.append((safe_name(p.stem), read_file(p)))
    for d in a.folder:
        for p in sorted(Path(d).rglob("*")):
            if p.is_file() and p.suffix.lower() in ALL_EXT:
                items.append((safe_name(p.stem), read_file(p)))
    for u in a.url:
        from urllib.parse import urlparse, unquote
        up = urlparse(u)
        last = unquote(up.path.rstrip("/").split("/")[-1]).replace("_", " ").replace("-", " ")
        host = (up.netloc.split(".")[-2] if up.netloc.count(".") >= 1 else up.netloc).capitalize()
        items.append((safe_name(f"{last} ({host})" if last else up.netloc), f"Source URL: {u}\n\n" + fetch_url(u)))
    for i, t in enumerate(a.text, 1):
        items.append((f"Pasted text {i}", t))
    for f in a.text_file:
        p = Path(f)
        items.append((safe_name(p.stem), p.read_text(encoding="utf-8", errors="ignore")))
    derived_sections = []
    if a.vault:
        vit, derived_sections = collect_obsidian(a)
        items += vit
    items = [(n, t) for n, t in items if t.strip()]
    if not items:
        sys.exit("No usable sources given (use --file / --folder / --url / --text / --vault).")

    settings, shared_prompt, job_prompts = load_spec()
    run_id = datetime.now(timezone.utc).strftime("%Y%m%d-%H%M%S")
    run_dir = SKILL_DIR / "data" / "runs" / run_id
    src_dir = run_dir / "sources"
    src_dir.mkdir(parents=True, exist_ok=True)

    staged, words, seen = [], 0, {}
    for name, text in items:
        words += len(text.split())
        parts = chunks(text, a.chunk_chars)
        for k, part in enumerate(parts, 1):
            base = name if len(parts) == 1 else f"{name} (part {k} of {len(parts)})"
            seen[base] = seen.get(base, 0) + 1
            fname = f"{base}.md" if seen[base] == 1 else f"{base} ({seen[base]}).md"
            (src_dir / fname).write_text(f"# {base}\n\n{part}", encoding="utf-8")
            staged.append(fname)

    c = settings["language"]["complex_if"]
    language = a.language or (
        settings["language"]["complex"]
        if len(items) >= c["min_sources"] or words >= c["min_words"]
        else settings["language"]["simple"]
    )

    topic_line = f"Topic: {a.topic}\nSources: {len(staged)} documents ({a.origin}).\n"
    sections = [s.strip() for s in a.sections.split(";") if s.strip()] or derived_sections
    if sections:
        topic_line += (
            "\nSub-topics to structure the output around (use this exact breakdown as the section "
            "order - do not invent a different structure):\n"
            + "\n".join(f"  {i}. {s}" for i, s in enumerate(sections, 1)) + "\n"
        )
    language_line = f"\nLanguage: write and narrate everything in {language}.\n"

    jobs, brief_sections = [], []
    for label, cfg in settings["jobs"].items():
        prompt = "\n".join([topic_line, language_line, shared_prompt, "", job_prompts[label]])
        jobs.append({
            "label": label,
            "studio_button": cfg["studio_button"],
            "video_format": cfg["format"] if cfg["studio_button"] == "Video Overview" else None,
            "deck_format": cfg["format"] if cfg["studio_button"] == "Slide deck" else None,
            "length": cfg.get("length"),
            "language": language,
            "customize_prompt": prompt,
        })
        detail = f"{cfg['format']}, {language}" + (f", length {cfg['length']}" if cfg.get("length") else "")
        brief_sections.append(f"## {label} ({cfg['studio_button']}, {detail})\n```\n{prompt}\n```")

    (run_dir / "brief.md").write_text("\n".join([
        f"# Presentation brief - {run_id}", "",
        f"**Notebook title suggestion:** {a.topic[:100]}",
        f"**Language:** {language} ({len(staged)} sources, {words} words)",
        "**Output jobs:** " + ", ".join(j["label"] for j in jobs), "",
        "## Sources to upload (staged in ./sources/)", *(f"- {n}" for n in staged), "",
        "# Customize prompts (one per output job)", "", *brief_sections,
    ]), encoding="utf-8")

    manifest = {
        "run_id": run_id, "topic_label": a.topic, "mode": "external-sources", "language": language,
        "output_jobs": jobs, "sources": staged, "created_at": datetime.now(timezone.utc).isoformat(),
    }
    (run_dir / "manifest.json").write_text(json.dumps(manifest, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"run_dir={run_dir}")
    print(f"topic={a.topic.encode('ascii', 'replace').decode('ascii')} language={language} "
          f"jobs={[j['label'] for j in jobs]} sources={len(staged)} words={words}")


if __name__ == "__main__":
    main()
