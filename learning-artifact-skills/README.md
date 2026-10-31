# Learning artifact skill and agent

Builds a private, interactive study page for any complex subject from any source. Two editions with the same method:

| Edition | Folder | Page language | Skill / agent names |
|---|---|---|---|
| English | `en/` | English, left-to-right | `learning-artifact-en` / `learning-artifact-builder-en` |
| Hebrew | `he/` | Hebrew, right-to-left (English terms beside key concepts) | `learning-artifact` / `learning-artifact-builder` |

The two editions do not overwrite each other; install either or both.

## Install
```powershell
.\install.ps1 -Edition en       # en | he | both     -Dest <.claude folder>   -Force
```
```bash
./install.sh en                 # en | he | both     optional 2nd arg: .claude folder
```
Restart Claude Code. Requirements: Claude Code, `node` (to syntax-check the generated JS), Python 3 (for build scripts). Publishing uses Claude's Artifact tool (private by default).

## Use
Ask in natural language, or call the agent:
- "Build a learning artifact from this folder of slides and notebooks." 
- "Upgrade this artifact with a linked glossary, executive summary and detailed contents." (layer mode)
- "Use the learning-artifact-builder-en agent to make a study page from this PDF."

Supported sources (see `references/sources.md` in the skill): local folders, PDFs and slides, notebooks (code is re-run for real outputs), spreadsheets, web pages, NotebookLM notebooks (read-only, via your logged-in Chrome with Claude in Chrome), course platforms through your own logged-in session, or only a topic (clearly labeled as general knowledge).

## What every page contains (the quality bar, same for every source)
Executive summary with a good / borderline / worrying table · chronological stations with context card, one-line takeaway and source tags · worked examples or real code outputs · single-home definition cards with auto-linked mentions · detailed contents drawer with search · back strip, history and bookmark · short mode · in-page verification table · lists of what was not verified and what was added · a `selfTest()` gate before publishing.

## What is inside each edition
```
skills/<skill>/SKILL.md           method and rules (start here)
skills/<skill>/references/        sources.md, domains.md (finance, law, medicine, ...), lessons.md (pitfalls)
skills/<skill>/assets/framework/  tpl3.html, lib3.js, toc3.js       page shell and helpers
skills/<skill>/assets/examples/   en_demo: tiny runnable template (python build.py)
skills/<skill>/assets/enh-layer/  enh.css, enh.js, build_layer.py, cfg_template.js   upgrade existing pages
skills/<skill>/scripts/           make_english.py (generate the English framework from the Hebrew one), udemy_transcripts.md
agents/<agent>.md                 the agent definition
```
Try the template: `cd skills/<skill>/assets/examples/en_demo && python build.py` then open `demo_en.html` and run `selfTest()` in the browser console (expect `failed: []`).

## Notes
- The Hebrew edition's framework produces a Hebrew UI; `en_demo` content is English and works as a smoke test there too.
- Reading course captions or notebooks requires your explicit offer of a logged-in browser session; see the terms-of-use note in `scripts/udemy_transcripts.md`.
