# Claude learning artifacts kit

Two ready-to-install toolkits for [Claude Code](https://claude.com/claude-code) that turn **any learning material** (a course, slides, PDFs, notebooks, notes, a NotebookLM notebook, or just a topic) into high-quality study outputs.

| Toolkit | What it produces | Folder |
|---|---|---|
| **Learning artifact skill + agent** | One private interactive study page (an Artifact): executive summary with a good / borderline / worrying table, chronological stations, worked examples with real outputs, linked glossary, calculators, contents drawer, "back to where I was" navigation, verification table | [`learning-artifact-skills/`](learning-artifact-skills) |
| **NotebookLM Presentation Kit** | A NotebookLM / Gemini Notebook notebook that generates a short video, an explainer video and a detailed slide deck from the same material | [`notebooklm-presentation-kit/`](notebooklm-presentation-kit) |

Works for any domain: finance and investment banking, accounting, law, medicine, engineering, data science, languages, certifications. Output language: English.

## Quick start

**1. Learning artifacts** (needs Claude Code; publishing uses Claude's Artifact feature)
```powershell
git clone https://github.com/royi1383-max/claude-learning-artifacts-kit
cd claude-learning-artifacts-kit\learning-artifact-skills
.\install.ps1                   # macOS/Linux: ./install.sh
```
Restart Claude Code and ask, for example:
> Build a learning artifact from the slides and notebook in `C:\courses\my-course\unit-3`.

or call the agent explicitly: *"Use the learning-artifact-builder-en agent on …"*.
Details, supported sources and quality rules: [`learning-artifact-skills/README.md`](learning-artifact-skills/README.md).

**2. NotebookLM presentations**
```powershell
cd notebooklm-presentation-kit
.\install.ps1
```
then follow [`notebooklm-presentation-kit/README.md`](notebooklm-presentation-kit/README.md) (one-time Google login on your own machine).

## Privacy, safety and fair use
- Nothing here contains credentials or personal data. The NotebookLM helper stores its login **locally** in a git-ignored `data/` folder; never commit it.
- The skills read your material **read-only**, and published artifacts are **private by default**.
- Use platform captions, slides and books only for your **own study**, respect each platform's terms and the authors' copyright, paraphrase instead of copying, and do not share outputs that reproduce paid course material.
- Finance, legal, tax and medical outputs are study material, not professional advice.
- The NotebookLM kit automates a Google web interface with your own account and quota; review Google's terms before relying on it.

## License
MIT (see [`LICENSE`](LICENSE)). `notebooklm-presentation-kit/skills/notebooklm-skill-master` is a third-party MIT-licensed component (© Please Prompto!), its license is included.
