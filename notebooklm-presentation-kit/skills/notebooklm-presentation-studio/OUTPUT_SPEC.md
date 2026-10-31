# Output Spec - NotebookLM Presentation Studio

Single source of truth for HOW each output should look and sound. `build_run.py`
reads this file fresh on every run; edit here, never in the scripts. Decisions
below were tuned on real runs. Supersedes the prompt blocks in `RULES.md`
(RULES.md still defines topic scope).

Three outputs, every run: **video_short**, **video_long**, **slide_deck**.
No separate podcast: the long video covers the same ground (the viewer can watch
or just listen). To add Audio Overview later, add a job in Settings plus a prompt
block named "## audio prompt".

## Settings

```json
{
  "language": {
    "complex": "English",
    "simple": "English",
    "complex_if": {"min_sources": 12, "min_words": 7000}
  },
  "jobs": {
    "video_short": {"studio_button": "Video Overview", "format": "Short"},
    "video_long":  {"studio_button": "Video Overview", "format": "Explainer"},
    "slide_deck":  {"studio_button": "Slide deck", "format": "Detailed deck", "length": "Default"}
  }
}
```

Language rule: a topic counts as complex if it has at least `min_sources` sources OR
at least `min_words` words of source text; complex -> the `complex` language, otherwise the `simple` language. Both are English by default; set either to any language NotebookLM offers, or override per run with `--language`.
The thresholds are first guesses - tune them after seeing real outputs.
Slide format: "Detailed deck" chosen because the deck must explain end to end on
its own (nobody is presenting it); the prompt below keeps text balanced. Flip
`format` to "Presenter slides" if the result is too text-heavy.

## Shared prompt

```
Goal: after watching, I should genuinely understand this topic and the messages it carries. Assume I am smart but new to the subject.

Explain every non-trivial concept, term, acronym, framework and metric in plain language the first time it appears, with a one-line example. Never expect me to work out a meaning from context.

Use as many senses as the format allows - words, visuals, diagrams, examples, short stories - so each idea lands in more than one way. Keep visuals and words in balance: not walls of text, and not decoration that carries no information.

Order and orientation: present ideas in a clear logical order, chronological where the topic has a timeline, and keep the viewer oriented the whole way (numbered sections, a visible list of topics with the current one marked).

Sources: occasionally and unobtrusively mention where an idea comes from (the source's title as a small label or a brief aside), so I can dig deeper if I want. Never read file names mechanically and never clutter the screen with them.

Balance, avoid extremes: not oversimplified and not jargon-heavy; not too dense and not too sparse; not dry and not gimmicky. When unsure, choose clarity.

Close with the single sentence to remember, then one concrete way to notice or apply the idea this week.
```

## video_short prompt

```
Format: a short, concentrated REEL-style clip. Open with a hook in the first seconds, explain only the one core idea and the single term needed to grasp it, and stop. No deep dive and no section list. The goal is to give a clear indication of the topic and make me want to watch the full explainer. Exception to the shared rules: skip the topic list and the closing application step; end on a curiosity-raising line.
```

## video_long prompt

```
Format: the full explainer video. Explain the topic unambiguously from start to finish, walking through every sub-topic in the given order. For each idea give a concrete example or a related story, and show how the ideas connect, cause or contradict each other.

The visuals behind the narration must be dynamic: backgrounds that change with motion and effects that illustrate what is being said, especially for multi-step processes, cause-and-effect chains, timelines and opposing ideas (show the two sides visually, not just describe them). Show on-screen chapter markers so the viewer always knows which part of the topic is being covered.
```

## slide_deck prompt

```
Format: a complete deck that explains the whole topic end to end, readable on its own with no presenter.

1. Slide 1 is a title slide with the plain, literal topic name. Slide 2 is an agenda: a numbered list of every section in the exact order they appear.
2. From slide 3 on, every slide carries a persistent progress bar or sidebar listing all sections with the current one highlighted, plus "N of total". A reader landing on any slide must know exactly where they are.
3. Slide titles say plainly what the slide covers, using the terms from the sources. No invented metaphors or codenames.
4. Each slide balances one clear visual (diagram, comparison, labeled process, timeline) with a short explanatory text. Define any non-trivial term in a small "Definition" callout on the slide where it first appears.
5. Keep infographics readable: no more than about six elements per visual, and when it shows a process, a sequence or a timeline, make the order explicit with numbers or arrows so the reader never has to guess what comes first.
6. Structure the sections from the broad "why this matters" down to mechanism and then concrete examples, without jumping back out.
7. Add a small unobtrusive source label (the source's title) on slides that rely on a specific note.
```
