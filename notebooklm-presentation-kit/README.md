# NotebookLM Presentation Kit

A portable bundle that turns ANY body of material (files, folders, PDFs, web pages, pasted text, notes from any field) into a NotebookLM / Gemini Notebook notebook that generates three study-ready outputs with one consistent design.

## The three outputs (defined in `OUTPUT_SPEC.md`)
1. **video_short** - a short Reel-style video.
2. **video_long** - a full Explainer video with dynamic backgrounds that change with the narration and on-screen chapter markers.
3. **slide_deck** - a Detailed deck that explains the topic end to end on its own: title slide, numbered agenda, a progress bar on every slide, one clear diagram plus short text per slide, "Definition" callouts, and a source label.

Language: English by default for both input and output. To use another language, set it in the `language` block of `OUTPUT_SPEC.md` or pass `--language <name>` to `build_run.py`.

## What is in the folder
| Folder | Role |
|---|---|
| `skills/notebooklm-presentation-studio` | **The generic skill.** Takes any material (`scripts/build_run.py`), builds the prompts from `OUTPUT_SPEC.md`, and pushes everything to NotebookLM (`scripts/push_to_notebooklm.py`). |
| `skills/notebooklm-skill-master` | **Required.** The authenticated Chrome (patchright) helper the push step uses. Without its Google login nothing runs. |
| `install.ps1` | Installer script, see below. |

## Install
```powershell
cd "NotebookLM Presentation Kit"
.\install.ps1          # copies the skills to %USERPROFILE%\.claude\skills and creates the .venv
cd $env:USERPROFILE\.claude\skills\notebooklm-skill-master
.\.venv\Scripts\python.exe scripts\run.py auth_manager.py setup   # one-time Google login
```
Optional input support: `pip install pymupdf` (PDF), `pip install python-docx` (DOCX), and the `defuddle` CLI (cleaner web pages). The Google login data is NOT included in the kit; log in again on every new machine.

### What `install.ps1` does
A PowerShell script that automates setup so you do not do it by hand. It:
1. Copies the two skill folders into `%USERPROFILE%\.claude\skills` (skips any that already exist, never overwrites).
2. Creates a Python virtual environment (`.venv`) inside `notebooklm-skill-master`.
3. Installs its requirements (`patchright`, `python-dotenv`) and Google Chrome for the automation.
4. Prints the one-time login command.

Use `-SkipVenv` to skip steps 2-3. It is not needed on a machine where the skills are already installed.

## Use
In a Claude Code conversation: "Run notebooklm-presentation-studio on <topic> with this material."
Or manually:
```powershell
cd $env:USERPROFILE\.claude\skills\notebooklm-presentation-studio
python scripts\build_run.py --topic "Plain literal topic name" --folder "C:\path\to\docs" --url https://example.com/article --sections "Why it matters; Mechanism; Examples"
& "$env:USERPROFILE\.claude\skills\notebooklm-skill-master\.venv\Scripts\python.exe" scripts\push_to_notebooklm.py data\runs\<run_id>
```
The push step opens Chrome, creates the notebook, pastes each source as "Copied text", and starts the three outputs. Generation then continues in the background on Google's side.

## Using it with an Obsidian vault
The same skill works on an Obsidian vault. Point it at the vault and pick the topic either by folder or by a hub (map-of-content) note:
```powershell
python scripts\build_run.py --topic "Plain literal topic name" --vault "C:\path\to\Vault" --vault-folder "Projects\Topic"
python scripts\build_run.py --topic "Plain literal topic name" --vault "C:\path\to\Vault" --moc "Topic MOC" --max-notes 20
```
- `--vault-folder` takes every note under that folder (recursive).
- `--moc` reads the hub note, collects the notes it `[[links]]` to (one level deep, up to `--max-notes`), and uses the hub's `##` headings as the section order unless you pass `--sections`.
- YAML frontmatter is stripped, `[[wikilinks]]` become plain text, and each note becomes one named source, so the deck's source labels show your note titles.
- Keep one coherent topic per run (roughly 6-25 notes works well); bigger vaults need a topic picker (search the vault first, then pass the chosen folder or hub).

## Rules that keep the quality
- Never edit prompts inside the scripts: change `OUTPUT_SPEC.md` only.
- One topic per run. Unrelated material gets its own run.
- NotebookLM's UI changes now and then. If a step fails, read `push_status.json` and the screenshot next to it, then fix that one selector.
- The "AI usage" quota refreshes about every 5 hours. Do not retry in a loop.
- Give every source a clear name so the deck's source labels mean something.
- Chrome may reopen in a tiny window, which breaks NotebookLM's layout; the push script now forces a 1500x950 window.

## Credits and licensing
- `skills/notebooklm-skill-master` is a third-party Claude Code skill (MIT License, (c) 2025 Please Prompto!, https://github.com/PleasePrompto/notebooklm-skill). It provides the authenticated browser helper. Its license file is included.
- `skills/notebooklm-presentation-studio` builds on it: it adds the input builder (`build_run.py`), the output design (`OUTPUT_SPEC.md`, `RULES.md`) and the NotebookLM push step.
- This kit automates a Google web interface. It can break when the interface changes, and it uses your own Google account and NotebookLM quota. Review Google's terms for automated access before relying on it.
