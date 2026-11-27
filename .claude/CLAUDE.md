# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Vite dev server (http://localhost:5173)
npm run build        # tsc --noEmit, then vite build → dist/
npm run typecheck    # TypeScript only
npm test             # vitest run (all tests)
npx vitest run src/game/save/save.test.ts      # one test file
npx vitest run -t "migra saves antigos"        # tests whose name matches
```

There is no linter configured. `npm run build` is the full check (typecheck + bundle). TypeScript is v7 and the config is strict, including `noUnusedLocals` and `noUnusedParameters`.

## What this is

Estúdio Mogul is a browser-only film/TV studio simulator built with React 19, TypeScript and Vite. There's no backend. It was ported from `studio_mogul.html`, a single file kept in the repo for reference only; never edit it. That file was a base game plus ~10 patch scripts (1.9 → 2.2) that monkey-patched each other's functions. The port merges them into one ordered flow and keeps **2.2 gameplay**. Code comments often cite the original patch version (e.g. "1.9 —", "2.1 —") to say where a rule came from.

## Architecture

**`src/game/` is plain TypeScript with no React.** All game rules live here as functions that **mutate a `GameState` in place** (`addExpense(s, x)`, `releaseProject(s, p)`, …). Player actions return `ActionResult { ok, message? }` instead of calling `alert`.

**`store.ts` is the only bridge between logic and UI.** It is a hand-written singleton store read through `useSyncExternalStore`:
- `store.mutate(fn)`: runs `fn(state)`, clamps rep to 5–100, schedules an autosave, re-renders.
- `store.act(fn)`: same, but turns a failed `ActionResult.message` into a toast.
- Components call `useGame()` or `useGameState()` and re-render on every mutation, since the state is mutable and there's no memoisation. The auto-advance progress bar has its own subscription (`useWeekProgress`) so the 500 ms timer doesn't re-render the whole app.
- UI-only state (pending event, open greenlight modal, toasts, mode) lives on the store, never in `GameState`, so it is never saved.

**The weekly tick is `advanceWeek(s, hooks)` in `simulation.ts`.** Its steps run in a fixed order that matches the original wrapper chain: streaming churn → pipeline phases → week++ → monthly market refresh → releases and box office → PR event → year rollover → yearly unlocks and seasonal events → franchise hype → industry fatigue and events → inbox notices → quarterly talent market → flop post-mortems. Logic shows events only through `SimHooks.showEvent(event)`, where an event is title, description and choices, each choice with an `apply(s)` closure. That keeps the simulation testable headless: tests pass hooks that auto-pick the first choice.

**Release pipeline (`release.ts`).** `releaseProject` applies, in order: genre-repeat penalty (2.1), market fatigue and word of mouth (1.9), franchise link, the base market multiplier, the seasonal window, `releaseHype` (2.2), trust and fatigue updates, then the repeat penalty on `weeklyBase`. Changing the order changes balance.

**Greenlight (`greenlight.ts`).** `computeTotal(s, form)` is the single cost formula; the modal shows it and `confirmGreenlight` charges exactly that amount. A test enforces this. Keep the two in sync.

**i18n.** There are no translation files. Every string is written in place as `tr('português', 'English')`, or `trPair([pt, en])` for data tables in `constants.ts`/`content.ts`. `tr` reads a module-level language, so game logic also uses it when generating logs and notices; those are stored as already-translated text. Components call `useLang()` so they re-render when the language changes. Saved game data uses Portuguese keys and labels (genre names, `Risk` = `'baixo'|'moderado'|'alto'`, crew metric labels); `labels.ts` translates them for display. Don't change stored values to English.

**Persistence (`src/game/save/`).**
- `SaveStorage` interface → `IndexedDbStorage` (DB `studio-mogul`, store `saves`), with `MemoryStorage` as fallback.
- `SaveManager` handles the `autosave` slot plus `backup-1..3`, rotated every 13 in-game weeks. Writes are queued in order, and the autosave and backup rotation go through one `putMany` transaction. Load falls back to the backups when the autosave is unreadable.
- `saveFile.ts` defines the versioned envelope (`schemaVersion`) and `MIGRATIONS`, run step by step. Version 1 means a raw state with no envelope (old localStorage/HTML saves). `normalizeState` in `state.ts` runs on every load and defensively fills defaults and fixes legacy fields.
- **When adding a field to `GameState`/`ExtState`:** add a default in `createNewState`/`defaultExt` and make `normalizeState` tolerate its absence. For breaking changes, bump `SCHEMA_VERSION` and add a migration step.
- On startup, the legacy localStorage key `studio_mogul_save_v1` is imported into IndexedDB once. Settings (language, sim mode, sfx) stay in localStorage.

**Time and calendar.** A year is 52 weeks of 4-week "months" (weeks 49–52 are "Especial"). Campaign year 1 = 1960 (`historicalYear`), and streaming unlocks in 2008. There are two tick counters on purpose, for save compatibility: `tickNow` = (year-1)*52+week, used by 2.x systems, and `gameTick` = year*52+week, used by the 1.9 industry systems. Don't mix them.

**UI.** `App.tsx` switches tabs grouped as in `content.ts` (`NAV_GROUPS`); `screens/` has one component per tab. The CSS in `styles/global.css` was copied verbatim from the original and relies on the cascade, so later theme blocks override earlier ones. The final look is the light/gold "1.6" theme. Keep the ids/classes it targets: `#hud`, `#nav`, `#subnav`, `.screen.active`, `.card`, `.phase`, `.data-chip`, etc.

## Conventions

- Code comments and test names are in Portuguese; keep that style.
- Talent is procedural and fictional only (`talent.ts`); real people and real IP were deliberately removed in the original's 2.0.2, so don't reintroduce them.
- Intentional fixes relative to the HTML (listed in the README) must not be "restored": market genres use the Portuguese names, the format surcharge is charged once, the inbox keeps the newest 20, and the secondary genre is saved.
