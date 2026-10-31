# Source adapters (platform and format agnostic)

Pick the adapters that match the material. Tag every fact with its origin on the page.

| Source | How to read it | Notes |
|---|---|---|
| **Local folder** (course files, notes) | Glob, then Read. Notebooks: cell by cell. Spreadsheets: skill `xlsx`/`convert-excel-to-md`. Word: `docx`. | Keep the original order of lectures/chapters; filenames often carry numbering. |
| **PDF / slides / textbook** | Skill `pdf` (text, tables), `pdf-viewer`. Slides: `pptx`. Scanned: OCR (`smart-ocr`). | Capture page or slide numbers as a source tag. |
| **Code or models** | Run them for real outputs (user's venv). Spreadsheet models: recompute with openpyxl or in JS. | Pin seeds/versions. Report bugs found. |
| **Learning platform with captions** (Udemy, Coursera, edX, YouTube, Khan, university LMS) | Only with the user's offer, through their own logged-in browser session (Claude in Chrome). Use the page's own caption/transcript endpoint or the "transcript" panel. | Paraphrase; mention captions may be automatic; no long quotes. For Udemy see `scripts/udemy_transcripts.md`. |
| **Public web** | WebSearch / defuddle for official syllabi, standards, regulations, glossaries. | Cite the source and date; prefer primary sources (regulators, standards bodies, the course page). |
| **No material** | Build from general knowledge. | Label "ידע כללי"; keep claims conservative; recompute every number. |

## Reading long text through a limited tool output
Some tools return only about 1000 characters per result. Read in slices (many slice calls batched in one request) and note that a few words at slice borders may be lost.

## Curriculum mapping
Local numbering may differ from the platform's (a constant offset is common). Verify with two known items before mapping lecture titles. Use the platform's public curriculum for the real lecture names and order when files carry only numbers.

## What to extract per unit (lecture/chapter)
Title and order; goal; definitions introduced; formulas; examples and their numbers; datasets, files, tools; mistakes or warnings the instructor stresses; exercises and their expected answers; vocabulary in English.

## NotebookLM (Gemini Notebook) adapter
- Open the notebook in a new tab of the user's Chrome (Claude in Chrome). The host may be `notebook.google.com` (rebranded "Gemini Notebook") as well as `notebooklm.google.com`. Read-only: do not add, rename or delete sources, do not touch Studio "Generate"/Audio/Video buttons, Share or settings.
- Source titles are truncated by CSS *and* in the DOM text (`…`). Get full titles from the source text itself: clicking a source row opens it in a ProseMirror view whose first line is the full title.
- Read every source programmatically: in one `javascript_tool` call, click each source row (leaf elements whose text starts with the shared title prefix), poll `.ProseMirror` innerText until it changes, and push it to `window.__S`. Then concatenate with `@@S<i>@@` markers into `window.__A`.
- The opened source view is an editor and gets focus: call `document.activeElement.blur()` and never type while it is open.
- Tool output is capped at about 1000 characters per result. Read `window.__A.slice(a,a+950)` in a `browser_batch` of ~20 calls; 60k characters took 4 batches. Bigger slices are truncated even inside a batch.
- Prefer reading the source text over the notebook chat: chat answers are model output and add history to the user's notebook. Use the chat only for structured extractions when the text is too long to read, and cross-check numbers against the text.
- Sources may be personal "vault" notes that summarise a book (secondary sources). Tag them as such, list linked notes that are referenced but missing from the notebook, and do not fill those gaps from memory without a "ידע כללי" tag.
- The notebook list order is alphabetical, not chronological. If there is no lecture order, say so and order stations by the sources' own "Related" links (framework, then mechanisms, then cases, then data).

## Copyright and terms
Use platform captions, slides and books only for the owner's own study. Paraphrase; short attributed quotes at most. Do not publish or share outputs that substantially reproduce paid course material; share the skill, not the course-derived pages.
