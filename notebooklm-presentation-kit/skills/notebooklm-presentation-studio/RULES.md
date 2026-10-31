# Output Rules — NotebookLM Presentation Studio

Durable rules for every automated run. Read this before building `brief.md` for a
run, and paste the **Customize prompt** block into NotebookLM's Customize panel
for whichever output (Video Overview / Slides / Report) is being generated.

These rules exist so every output — regardless of topic — can be handed to
someone with **zero prior background** and someone who already knows the field,
and both walk away with something real. Depth is not sacrificed for
accessibility; both are achieved by *layering*, not by dumbing down.

**This is a topic-review pipeline (changed 2026-10-22; was one note + neighbors).**
Every run covers ONE coherent topic: a whole theme folder when it is small
(6-25 notes), or the densest linked core (up to 15 notes) when the folder is
bigger — never two folders merged. See "Scope" below.

## Customize prompt (paste verbatim, topic details are injected above it)

```
Audience: complete beginners with zero background in this topic, but the
depth should reward someone already familiar with it too. Assume nothing;
define every term the first time it's used, in plain language, before using
it again.

Structure the explanation like this:
1. Open with a hook: a surprising fact, a provocative question, or a concrete
   real-world scenario that makes the topic feel urgent or interesting —
   before any definitions.
2. State the single sentence someone should remember if they forget
   everything else (the core idea, in one line).
3. Build the concept from first principles, one layer at a time. Each new
   layer should connect explicitly back to the previous one ("this matters
   because...", "this is why...").
4. For every abstract claim, give at least one concrete, real-world example
   or case study — not a hypothetical, an example grounded in something
   that actually happened or a specific relatable scenario.
5. Explicitly name the connections between the sub-ideas or sources involved
   — don't present them as a list of unrelated facts. Show how idea A
   causes, enables, or contradicts idea B.
6. Address the most common misconception or point of confusion about this
   topic directly, and correct it.
7. Close with: the one-sentence takeaway repeated, plus one concrete way the
   viewer could apply or notice this idea in their own life or work this week.

Style:
- Plain, direct language. Short sentences over long ones. No unexplained
  jargon, acronyms, or name-dropped frameworks — if a technical term is
  necessary, define it in the same breath.
- Narrate slowly and deliberately, like explaining to someone hearing this
  idea for the very first time. Pause conceptually between layers rather
  than rushing from one to the next. Cover the whole topic's map, but give
  each sub-topic real depth instead of skimming every source - when time is
  short, drop the least central ideas rather than rushing through all of them.
- Visuals should carry real information, not decoration: prefer a diagram,
  comparison, timeline, or labeled illustration over a plain bullet list
  whenever the idea has structure (a process, a before/after, a spectrum, a
  hierarchy, a cause chain).
- Favor story and narrative framing over dry fact recitation — the brain
  retains stories far better than isolated facts.
- Keep it tight: every slide/beat should earn its place. Cut anything that
  doesn't serve the one-sentence takeaway.
```

## Slide deck addendum (appended to the base prompt above, Slide deck only)

Correction 2026-08-22 (round 1): the first real Slide deck felt undesigned
and didn't serve its actual purpose.
Correction 2026-08-23 (round 2, after actually inspecting that deck -
"The Inner Citadel"): confirmed concretely what was wrong. Every slide
invented its own decorative metaphor as a title ("The Inner Citadel: An
Operating System for Cognitive Sovereignty", "The Physics of the System") -
each one different, none numbered, no table of contents, no persistent
indication of which part of the topic a given slide belongs to. Result:
looks like a loose stack of pretty infographic panels, not a structured
explainer - exactly wrong for someone seeing the topic for the first time.
This is appended to the base Customize prompt for the Slide deck job only —
the base prompt's structure/style rules still apply too.

```
For this slide deck specifically:

1. Slide 1 is a title slide with the plain, literal topic name (not an
   invented metaphor or codename).
2. Slide 2 is a table of contents / agenda: a numbered list of every
   section the deck will cover, in the exact order they appear later. The
   reader should be able to look at slide 2 alone and know the whole shape
   of what's coming.
3. Every content slide after that carries two persistent, visible labels in
   a consistent position (e.g. top corner): its slide number (or "N of
   total"), and which numbered section from the table of contents it
   belongs to. A reader jumping to any single slide must immediately know
   where they are in the whole deck without reading the body content.
4. Slide titles must plainly describe what that slide actually covers, in
   the sources' own terms - not a poetic, branded, or invented name. If a
   concept has an established name (e.g. from the sources), use that
   name, not a metaphor invented for this deck.
5. Structure the sections themselves as a macro-to-micro zoom: the first
   section is the single broadest framing (the big-picture "why this
   matters" view), then each following section zooms one step deeper into
   mechanism, then into concrete details/examples - never jumping back out
   to macro after zooming in, and never skipping a numbered section.

Make it infographic-quality, not document-quality: every slide should be
dominated by one clear visual (a diagram, a zoom/nested-circles view, a
labeled process flow, a comparison) with only a few words of supporting
text - not paragraphs. A reader should be able to get the slide's point from
the visual alone in a few seconds, with the text as reinforcement, not the
primary carrier of meaning. Decoration for its own sake (ornamental
illustrations that don't encode information) is worse than no illustration.

The knowledge level must work for a total beginner and an advanced reader at
once: the numbered macro-to-micro structure itself is what makes this
possible - beginners can stop understanding at the macro/why-it-matters
section and still get real value and a map of what they skipped, while
advanced readers get rewarded for following all the way into the
micro/mechanism sections.
```

## Why these rules (source: presentation-design reference material)

Distilled from a presentation-design reference deck (itself a working example of the target output style):

- **99% strategy, 1% execution** — the structure and message matter far more
  than polish. Get the "what" and "why" right before worrying about visuals.
- **The 10% rule** — 30 minutes later, an audience remembers ~10% of what was
  said. That 10% must be *designed*, not left to chance — hence the mandatory
  one-sentence takeaway, stated up front and repeated at the close.
- **Three questions before building anything**: what's the goal, who's the
  audience, what's the one thing they should remember. Every run's brief
  answers these three explicitly before content is assembled.
- **Attention Accelerators** — a surprising statistic, a provocative
  question, a personal story/analogy, a case study, humor, or a relevant
  quote. Use at least one in the opening hook.
- **Data into drama** — real case studies beat product-spec-style fact lists.
  A "painful question" or "real-world threat" framing makes an abstract
  concept concrete and memorable.
- **The 7% rule** — words alone carry a small fraction of a message's
  impact; the rest rides on delivery and visuals. For a written/generated
  medium, that translates to: lean on structure, pacing, and genuinely
  informative visuals rather than adding more text.

## Format-specific notes

- **Video Overview (Short)**: the topic's big picture plus its 3 most
  central ideas only - everything else is left out on purpose. Front-load
  the hook in the first 15 seconds regardless.
- **Video Overview (Explainer/Long)**: the comprehensive cut of the same
  source set — walk through every sub-topic in the given order, with room to
  build each layer out and dwell on examples. Still one topic, never a survey
  of unrelated areas.
- **Slide deck**: use the **"Presenter slides"** format card (not "Detailed
  deck" — that one is comprehensive-text/document-style, the opposite of
  what's wanted here), Length "Default". See the Slide deck addendum above
  for the macro-to-micro/infographic-quality requirement.
- **Any format**: if the topic pulled in a neighboring source from a different
  domain, the output must spend real time on the connection itself — why
  they relate — not just cover each half back-to-back as unrelated.

## Scope: one coherent topic per run

Each run covers ONE coherent topic. Pass the sources for that topic only, and, if you know them, the exact sub-topic order with `--sections`. Unrelated material gets its own run. For very large sources, `build_run.py` splits them into parts so each pasted source stays a manageable size. State plainly in the brief what is and is not covered; do not claim to cover a whole field from a partial source set.

## Output: always three, every run

Every run generates all three of:
1. Video Overview, format **Short**
2. Video Overview, format **Explainer** (the "long" video)
3. Slide deck, format **Presenter slides** (see addendum above; note that OUTPUT_SPEC.md is the authority for the exact deck format and overrides older wording here)

from the same small source set — not one format chosen by size, and not a
tradeoff between them. They serve different moments (quick watch / full
watch / skim), the pipeline generates all three every time.

NotebookLM's Studio panel also offers Infographic, Audio Overview, Mind Map,
Reports, Flashcards, Quiz, and Data table (confirmed live, 2026-08-22) — if
the user wants one of those added too, add it to `push_to_notebooklm.py`'s
generation loop rather than replacing any of the three above.
