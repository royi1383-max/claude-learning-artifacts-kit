# English demo (smoke test and template)

Builds a tiny English learning page (compound interest) with `framework`.
Run: `python -I build.py` here (needs `assets/framework-en`, created by `scripts/make_english.py`).
Notes for a real build:
- `lib3.js` `buildJump()` has example group labels ("Section 37: Introduction"...). Edit the `groups` array and the `sec` index of each station for your topic.
- `toc3.js` and `buildJump` expect elements with ids `exec`, `p0`, `p2`, `p3` (opening, wrap-up); keep or edit the lists.
- Glossary entries use the fields he/en (term name), d/c/r (what / how computed / conclusion), ed (English gloss, hidden in the English edition), ev (related terms), al (aliases for auto-linking), home (station id).

- Do not declare your own `const D`: `tpl3.html` already defines `const D=__DATA__`; pass course data through `__DATA__`.
- `DSN` and `KIND` in `lib3.js` carry example labels; override them in your content file.
- In published artifacts convert `href="#id"` links to `data-to` handlers (see lessons.md).
- Known open issue: term chips in a station's context card sit near the top; the hover popover can cover them and block the click.

- Quality gate: run `selfTest()` in the browser console; it must return `failed: []`. Config hooks: `window.SECTION_LABELS`, `window.DSN_EXTRA` (see SKILL.md section 4b).
- Fixed in this version: popover placement (never over the term, stays open while hovered), viewer-safe `data-to` links, contents de-duplication, back-strip heading, generic jump-menu groups, transcript badge only on video stations.
