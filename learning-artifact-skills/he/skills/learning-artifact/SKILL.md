---
name: learning-artifact
description: Build a high-quality, private learning Artifact (an interactive "workbook" page, Hebrew by default) for ANY complex subject and ANY source, not only data science or Udemy. Examples: an investment-banking or finance course, accounting, law, medicine, engineering, languages, a textbook chapter, university slides, a YouTube or Coursera course, a PDF, lecture notes, a certification syllabus. Use when the user asks for a study page, summary artifact, "ארטיפקט לימוד", an explainer of a course or topic, exam prep, or to upgrade an existing learning artifact with a linked glossary, executive summary, detailed table of contents, lecture notes or better navigation.
---

# Learning artifact builder (domain and platform agnostic)

Goal: one page that lets a learner who is tired and lost re-enter any point of a heavy topic: **what it is, how it works or is computed, what is good or bad, what to conclude**, with worked examples and pictures, without cognitive overload. The structure is the same for every domain; only the *content modules* change.

Default language of the page is Hebrew (RTL) with English professional vocabulary beside key terms. If the user asks for another language, follow it. Never guess pronouns.

## 0. Intake (ask only what you cannot infer)

Establish, from the request and the files at hand:
1. **Topic and scope** (whole course, one section, one chapter, an exam syllabus).
2. **Sources available** (see `references/sources.md`): folder of files, PDFs, slides, notebooks, spreadsheets, links, a logged-in learning platform in the user's browser, or only the topic name.
3. **Learner goal**: understand, pass an exam, interview prep, apply at work. It changes the emphasis (derivations vs checklists vs cases).
4. **Mode**: *Build* a new page, or *Layer* an upgrade onto an existing artifact (see section 5).

If no source material exists, build from your own knowledge **and say so on the page** (label "ידע כללי, לא מהקורס"), keep claims conservative, and verify numbers by recomputing them.

## 1. Source adapters

Read `references/sources.md`. Summary: every source type gets a *source tag* on the page (course file, transcript, textbook, general knowledge, my addition). Never present general knowledge as what the instructor said. Platform captions or transcripts are only read through the user's own logged-in session and only when they offered it; paraphrase, do not paste long passages (copyright).

## 2. Content modules (pick what the domain needs)

Read `references/domains.md` for module recipes per domain (quantitative/code, finance and investment banking, accounting, law, medicine, engineering, humanities/languages). Modules:

| Module | Use for |
|---|---|
| **Station** (one per lecture/chapter/topic, chronological) | always |
| **Code cell with real output** | programming or data topics; run it, never fake outputs |
| **Worked example with numbers** (step by step, every number recomputed) | finance, accounting, math, physics, any calculation |
| **Interactive calculator or slider** | formulas with parameters (DCF, WACC, bond price, dose, loan) |
| **Chart or diagram** (hover values, table alternative) | relationships, distributions, flows, org or deal structures, timelines |
| **Statement/table walkthrough** | financial statements, term sheets, tables of cases or ranges |
| **Case or scenario** | law, medicine, business, ethics |
| **Compare table** ("A vs B") | similar concepts that get confused |
| **Checklist / decision tree** | procedures, diagnostics, due diligence, compliance |
| **Common mistakes table** (symptom, cause, where explained) | every domain |

## 3. Page architecture (the invariant part)

- **Executive summary first** ("תמצית מנהלים"): 3 cards (what it helps with, how it is realized, what to watch), a **good / borderline / worrying** table with real numbers or criteria (what counts as healthy: margins, ratios, p-values, thresholds, legal tests, clinical ranges), and conclusions. Mark which thresholds come from the source and which are rules of thumb.
- **Stations in chronological order**, never mixed. Each: context card (where we are, what material, goal, chips of prerequisite concepts), a one-sentence takeaway ("בשורה אחת"), "מה נאמר בהרצאה" (paraphrased notes) when a transcript or text exists, the body, and a station summary (definitions, how to compute or apply, conclusion).
- **One home per concept**: a definition card (what / how computed or applied / what to conclude / **In English** plus vocabulary). Every later mention is a dotted link; hover shows the definition, click jumps, a searchable glossary drawer (Hebrew and English).
- **Detailed TOC drawer** with search (headings, definitions, examples, figures, calculators).
- **Never leave the reader lost**: back-stack with a fixed bottom strip "↩ חזרה אל: <heading>", history list of previous places, manual "📍 סמן" bookmark, current subsection line, progress bar, ✓ on visited stations. Every jump must push the stack.
- "Lite" toggle that hides side notes (and optionally code or derivations).
- A **verification table computed inside the page** (recompute key numbers from raw inputs) and an explicit list of what was *not* verified and what was *added by you*.

## 4. Build steps

1. Gather sources, extract facts, compute numbers. Save structured data as JSON in the scratchpad. Never type computed numbers by hand; compute them in JS from the data so text and charts cannot drift.
2. Copy `assets/framework/` (shell, helpers, glossary, TOC, executive summary, station builder) and write the content files. The framework is code-agnostic: the `cell()` code component is optional; use worked-example and table components instead when there is no code.
3. Build one HTML, `node --check` every JS file. Serve over http and test in the browser pane: console, DOM counts, widgets, back-stack, one screenshot. Check a narrow width.
4. Publish with the Artifact tool, private. For updates reuse the same `file_path` and `url`.
5. Clean up: stop local servers, close browser tabs you opened.

Follow the Artifact tool's design rules (tokens on `:root`, dark mode, no external scripts except fonts, 16px gutters, 2 to 4 word title, `icon`).

## 4b. Same quality bar for every source type (definition of done)

Whatever the source (video course, slides, PDF, textbook, notebook, NotebookLM, notes, or none), the page is not done until all of these hold. If the source is too thin for a point, say so on the page and shrink the scope instead of padding.
1. Every station: context card, one-line takeaway, source tags at the finest grain the source allows (timestamp, slide, page, cell, section), a worked example or real output (or a clearly marked illustration), and a station summary.
2. Every term used in two or more stations has a definition card with what / how computed / what to conclude.
3. The executive summary has a good / borderline / worrying table whose every threshold is tagged "source" or "rule of thumb". Invented example numbers are labeled invented.
4. Every number shown comes from code or JS that recomputes it; the in-page verification table matches.
5. Errors, contradictions and gaps in the source are listed (table), with where they were found.
6. Scope statement: what was covered, what was skipped and why, how the source was read (automatic captions, OCR, paraphrase).
7. `selfTest()` (in `lib3.js`) returns `failed: []` in the local page; console has no errors; the jump menu lists every station.
8. The PUBLISHED page was clicked through in the user's real Chrome: jump menu and a station, a term link and the back strip, EN toggle, short mode with banner, contents drawer.
9. Per-source reading notes were added to `references/sources.md` if the adapter was new.

Config hooks in your content file: `window.SECTION_LABELS={1:'שם החלק'}` (jump-menu groups by each station's `sec`), `window.DSN_EXTRA={d0:'תווית'}` (dataset tag labels). Do not declare your own `const D`: `tpl3.html` defines `const D=__DATA__`.

## 5. Layer mode (upgrade an existing page)

`assets/enh-layer/`: `enh.css` and `enh.js` read `window.ENH` (`sections`, `G` glossary with `home` and `after` heading text, `need`, `tldr`, `lecn`, `exec`, `groups`) and inject the glossary, TOC, executive summary, lecture notes and back-navigation into HTML you did not write. Read the artifact, strip the harness skeleton and trailing `</body></html>` from the saved file, append the layer, build, test, publish to the same `url`. `cfg_template.js` is a starter config and `build_layer.py` assembles the page.

## 6. Bidi and Hebrew rules

- Wrap every Latin or numeric run inside Hebrew prose in an LTR isolate span (framework `bidiFix()` does it; run it on every dynamically created node too).
- Formulas in their own LTR block, never inline in a Hebrew sentence; real minus sign `−`; currency symbols and percentages inside the isolate.
- Mixed labels (Hebrew plus English in parentheses) inside LTR containers are split into two spans.
- Numeric table cells LTR and right-aligned; chart titles in HTML, not SVG.
- Auto-linking skips `code`, `pre`, headings, `svg`, buttons, and allows Hebrew one-letter prefixes (ה ב ל ו מ ש כ).

## 7. Honesty rules

- Label every claim's origin: source, transcript paraphrase, general knowledge, my addition.
- State what was verified, what was not, and every error found in the source material (typos, wrong formulas, outdated rules).
- Regulatory, legal, tax, medical or investment content: present as study material, date it, cite the framework or jurisdiction, and avoid personalized advice.
- Rules of thumb are labeled as such. Report usage limits and unfinished work plainly.

Read `references/lessons.md` before starting; it lists the pitfalls that cost time.

## 8. UX details that users noticed (keep them in every page)

- **Definition card**: Hebrew explanation first; one short English gloss line below (small, gray, no "In English" label); a captioned row "מונחים קרובים באנגלית:" of vocabulary tags with duplicates of the title and formula fragments filtered out. English lines are excluded from the bidi wrapper.
- **EN toggle in the bar**: annotates *every* Hebrew mention of a glossary term with its English term in an accent color, not only the first linked mention.
- **Jump menu**: custom button + panel (not a native `<select>`), shows ✓ visited and highlights the current part; every click navigates, including the current one.
- **Lite / no-code mode**: shows a banner explaining what is hidden and a cancel button; the state is stored in localStorage.
- **Back navigation**: bottom strip, history list, manual 📍 bookmark, every jump pushes the stack.
- **Final test = the published page in the user's real Chrome** (Claude in Chrome: open the artifact URL, click the jump menu, a station, EN, lite, TOC), and assert counts in the local test (menu entries = stations + parts).
