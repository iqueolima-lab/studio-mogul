# Estúdio Mogul 🎬

A film and TV studio simulator. You found a studio in 1960 with US$ 20 million, greenlight movies and series, hire cast and crew, chase market trends, survive industry crises and, from 2008 on, launch your own streaming platform.

The game is in Portuguese (Brazil) and English; switch languages from the start menu or the in-game menu.

Built with **React 19 + TypeScript + Vite**. Everything runs in the browser and saves to the browser's IndexedDB database; there's no backend.

## Requirements

- Node.js **20.19+** (or 22+)
- npm

## Running

```bash
npm install       # install dependencies
npm run dev       # start the dev server (http://localhost:5173)
```

## Scripts

| Command             | What it does                                         |
| ------------------- | ---------------------------------------------------- |
| `npm run dev`       | Dev server with hot reload                           |
| `npm run build`     | Typecheck, then production build into `dist/`        |
| `npm run preview`   | Serve the production build locally                   |
| `npm run typecheck` | TypeScript check only                                |
| `npm test`          | Run the simulation tests (Vitest)                    |

The build uses relative paths (`base: './'`), so you can host `dist/` from any static server or subfolder.

## How to play

1. **Found a studio:** pick a name and a difficulty:
   - *Produtor de Primeira Viagem*: baseline rates.
   - *Fudido, Pé-Rapado & Ambicioso*: harder.
   - *Magnata de Chinelo*: easier.
2. **Greenlight a project** (Projects → “+ Aprovar projeto”). Choose format, genre, theme, budget, marketing, production type, crew, director and lead actor. The synergy radar rates your creative combination before you commit.
3. **Advance time** with “Pular semana”. The default is manual; the game menu has a *Challenge* mode that advances one week every 15 seconds.
4. **Watch the systems:**
   - Pipeline phases and crew fatigue
   - Market trends (refreshed monthly)
   - Genre fatigue and audience trust
   - Franchise hype
   - Quarterly talent market
   - Inbox alerts, including post-mortems for flops
5. **Grow:**
   - Unlock regional markets.
   - Hire better professionals as your reputation rises.
   - Renew series for new seasons.
   - License series to broadcasters.
   - From 2008 on, launch the StreamVault+ platform (US$ 750M).

## Saving

Progress saves automatically to **IndexedDB** (database `studio-mogul`, object store `saves`):

| Slot | Contents |
| --- | --- |
| `autosave` | Latest state. Rapid changes are grouped into one write (~0.8 s); pending changes are flushed when the tab is hidden or closed |
| `backup-1` … `backup-3` | A checkpoint every in-game quarter (13 weeks); newest first |

- Each save is a versioned envelope: `format`, `schemaVersion`, `gameVersion`, `savedAt`, a `summary` for the start menu, and the `state`. Breaking format changes bump `schemaVersion` and add a step to `MIGRATIONS` in [saveFile.ts](src/game/save/saveFile.ts).
- Writes run one at a time, in order. The autosave and any backup rotation are written in a single transaction, so a failed write never leaves a half-updated save.
- If the autosave is unreadable, loading falls back to the newest readable backup.
- On first launch, a save in the old `localStorage` key `studio_mogul_save_v1` (from earlier builds or the original HTML file) is copied into IndexedDB. The old key is removed only after the copy succeeds.
- If IndexedDB is unavailable, for example blocked in some private windows, the game runs with in-memory storage and warns that progress won't survive closing the page.
- Settings (language, simulation mode, sound) stay in `localStorage`.

To inspect saves: DevTools → Application → IndexedDB → `studio-mogul`.

## Project structure

```
src/
├── main.tsx, App.tsx      # Entry point and app shell (navigation, modals)
├── game/                  # Game logic: plain TypeScript, no React
│   ├── types.ts           # State, project, talent and event types
│   ├── constants.ts       # Genres, themes, markets, phases, awards, options
│   ├── state.ts           # New game creation + save migration (normalizeState)
│   ├── store.ts           # Central store: mutate → autosave → re-render, auto-advance timer
│   ├── save/
│   │   ├── storage.ts     # SaveStorage interface: IndexedDB + in-memory fallback
│   │   ├── saveFile.ts    # Versioned save envelope, migrations, validation
│   │   ├── saveManager.ts # Autosave slot, rotating backups, ordered writes, legacy import
│   │   └── save.test.ts   # Storage tests (fake-indexeddb)
│   ├── simulation.ts      # advanceWeek(): the weekly tick, in order
│   ├── greenlight.ts      # Cost calculation and project creation
│   ├── release.ts         # Release, weekly box office, series renewal
│   ├── talent.ts          # Procedural professionals and hiring market
│   ├── industry.ts        # Market fatigue, crew fatigue, industry events
│   ├── franchise.ts       # Franchise hype, broadcasters and licensing
│   ├── inbox.ts           # Notifications and flop post-mortem reports
│   ├── events.ts          # Press/PR events
│   ├── operations.ts      # Markets and streaming platform actions
│   ├── synergy.ts         # Creative synergy radar (advisory)
│   ├── content.ts         # Navigation, editorial notes, tutorial, difficulty copy
│   ├── labels.ts          # Display labels derived from stored keys
│   └── simulation.test.ts # Tests: multi-year runs, costs, save migration
├── components/            # HUD, navigation, modals, shared UI pieces
├── screens/               # One component per tab
├── i18n/                  # Language store, tr(pt, en) helper, money formatting
├── audio/                 # Procedural Web Audio sound effects (clicks, week advance)
└── styles/global.css      # Visual theme (carried over from the original)
```

### Architecture notes

- **Game logic is separate from the UI.** Everything in `src/game/` is plain TypeScript that changes the `GameState` object directly. React components only read state and call actions through the `store` (`store.mutate(fn)` or `store.act(fn)`), which saves and triggers a re-render.
- **Translations** use `tr('português', 'English')` in place, both in components and in generated text (logs, alerts).
- **The simulation can be tested without a browser.** `advanceWeek(state, hooks)` takes a small `SimHooks` object for showing events, so tests can play through years of in-game time.

## History

This project began as a single HTML file, `studio_mogul.html`, which is still in the repository for reference. That file was version 1.0 plus about ten patch scripts (1.9 → 2.2), each overriding the functions before it. The React version merges those layers into one ordered codebase and keeps the gameplay of version 2.2.

It also fixes some bugs from the original:

- **Market genre bonus:** never applied, because markets used English genre names and projects used Portuguese ones.
- **Production-type surcharge:** charged twice when a project was greenlit.
- **Franchise hype (2.2):** crashed when a project was released, because it read `window.state`, which didn't exist.
- **Inbox overflow:** sent the *newest* alerts to the trash instead of the oldest.
- **Secondary genre:** never saved on the project.

## License

See [LICENSE](LICENSE).
