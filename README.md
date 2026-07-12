# Lapwing Trainer

A stenography learning app that teaches [Lapwing theory](https://lapwing.aerick.ca)
through structured progression — interactive lessons that follow the *Lapwing for
Beginners* guide, with stroke-level feedback on a live steno keyboard diagram.

Unlike drill tools that only show you the text you produced, this app sees the
**raw strokes** you make, so when you misstroke it can show you exactly which keys
were wrong, missing, or extra.

## How it works

- **The full Lapwing curriculum, generated from the official dictionary**:
  17 lessons in 5 units — layout → short vowels → long vowels → left-hand chords →
  right-hand chords → asterisk & fingerspelling → suffix keys → syllabic splitting →
  the KWR linker → longer words → prefix strokes → suffix strokes → compound words →
  starter briefs → more briefs → homophone/asterisk conflicts → numbers & punctuation.
  Every drill item is a real entry from `lapwing-base.json` (bundled in
  `vendor/lapwing/`, MIT, © Aerick), chosen by SUBTLEX-US word frequency so you
  drill the words you'll actually write.
- **Progression gating**: each lesson unlocks after passing the previous one with
  90% first-try accuracy. Accuracy before speed.
- **Fading hints**: new chords show the full keyboard diagram; after a few correct
  reps you get outline-only; mastered chords show just the word. Any miss brings
  the diagram back.
- **Stroke-level feedback**: on a misstroke the diagram shows correct keys (green),
  extra keys (red), and missed keys (yellow), plus the notation of what you stroked.

## Stroke input

Two sources, switchable in **Settings**:

1. **Keyboard as steno machine** (default, zero setup) — the app captures chords
   directly from your keyboard using Plover's qwerty layout (`Q`/`A` = `S-`,
   `W` = `T-`, `C` = `A`, …). Keys accumulate while held and the stroke registers
   when all are released, exactly like a real machine. Needs a keyboard with decent
   key rollover (most mechanical keyboards are fine).
2. **Plover via WebSocket** — real strokes from Plover using the
   `plover-websocket-server` plugin (default `ws://localhost:8086/websocket`).
   Use this with a steno machine or hobbyist board.

## Progress storage

Also switchable in **Settings**:

- **Browser storage** (default) — localStorage, zero setup.
- **SQLite** — persisted server-side in `data/progress.db` via the app's own API
  route (`better-sqlite3`). Survives cleared browser data; requires running with
  the Node server (dev or `node build`). Switching backends migrates your progress.

## Developing

```sh
npm install
npm run dev               # start dev server
npm test                  # unit tests (steno engine + every outline validated against lapwing-base)
npm run check             # svelte-check / typescript
npm run build             # production build (adapter-node)
node build                # run the production server
npm run build:curriculum  # regenerate src/lib/lessons/curriculum.json from the dictionary
```

## Project layout

- `src/lib/steno/keys.ts` — steno key model, RTF/CRE outline parsing/formatting
- `src/lib/steno/sources.ts` — keyboard chord capture + Plover WebSocket source
- `scripts/build-curriculum.mjs` — generates the curriculum from the dictionary:
  each lesson has a "chord vocabulary" (the chords taught so far), and a word
  qualifies only if its outline decomposes into taught chords, uses the lesson's
  new material, and ranks high enough in word frequency
- `src/lib/lessons/curriculum.json` — the generated course (committed; the app
  has no runtime dependency on the 3.4 MB dictionary)
- `vendor/lapwing/` — official Lapwing dictionaries from the
  `plover-lapwing-aio` package (MIT, © Aerick)
- `src/lib/progress/` — swappable progress stores (localStorage / SQLite) and the
  reactive progress service
- `src/lib/components/StenoKeyboard.svelte` — the live keyboard diagram
- `src/routes/lesson/[id]/` — the drill engine
- `src/routes/api/progress/` — SQLite persistence endpoint

## Notes on theory accuracy

Drills match your raw strokes against the item's canonical outline (not a full
dictionary lookup), so alternate valid outlines are not accepted — intentional
while learning theory, since Lapwing wants you writing things one consistent way.
Every drill item is validated by unit tests: the outline must parse as legal
steno AND translate to exactly that word in the official `lapwing-base.json`.
To tune lesson selection (word counts, frequency cutoffs, filters), edit
`scripts/build-curriculum.mjs` and re-run `npm run build:curriculum`.
