# Patch Notes

All notable changes to **Plants vs Zombies: Card Battler** are documented here.
Format: `Version — Date — Summary`

---

## v0.1.0 — 2026-04-10 — Phase 1: Core Engine

### Added
- **State machine** (`docs/js/game/state.js`) — `MENU → DIFFICULTY → SHOP → COUNTDOWN → COMBAT → ROUND_END → GAME_OVER` with `enter`/`exit`/`update`/`render` lifecycle hooks
- **Game loop** (`docs/js/game/loop.js`) — `requestAnimationFrame` driver with delta-time clamping
- **Save system** (`docs/js/game/save.js`) — localStorage persistence for `pvz:settings`, `pvz:run`, `pvz:meta` with safe parse/write fallbacks
- **5×12 grid** (`docs/js/game/grid.js`) — model + DOM renderer with Aether-Root anchor
- **Difficulty config** (`docs/js/game/difficulty.js`) — Tutorial/Easy/Normal/Hard/Insane/Endless stat sources
- **Screen manager** (`docs/js/ui/screens.js`) — section toggle by `data-screen`
- **Bootstrap** (`docs/js/main.js`) — wires DOM events, settings sync, HUD updates, run lifecycle
- **Real `index.html`** — replaces placeholder; contains all 8 screens (menu, difficulty, shop, countdown, combat, round_end, game_over, settings)
- **`docs/css/main.css`** — reset, dark + light theme variables, full layout for all Phase 1 screens, animated countdown, responsive breakpoint

### Changed
- Phase badge in header now reads "Phase 1 — Core Engine"
- `Phases.md` Phase 1 marked complete; current phase advanced to Phase 2

### Notes
- Combat is not yet implemented — the "End Round (debug)" button manually advances state
- Card data, shop logic, and combat engine arrive in Phases 4–7
- Use `window.__pvz` in browser dev console to inspect state/save

---

## v0.0.2 — 2026-04-10 — GitHub Pages Setup

### Added
- `/docs/index.html` placeholder landing page so GitHub Pages has something to serve
- Updated CLAUDE.md with new repo structure (game lives under `/docs`)
- Updated Phases.md Phase 1 to target `/docs` instead of `/src`

### Changed
- GitHub Pages now serves from `main` branch `/docs` folder
- Default branch is now `main`

---

## v0.0.1 — 2026-04-10 — Project Initialization

### Added
- Initial project skeleton on branch `claude/create-project-phases-HSVUB`
- **CLAUDE.md** — Master design document and Claude Code guidance
- **README.md** — Public-facing game overview with GitHub Pages link placeholder
- **Features.md** — Living checklist of all planned features
- **Phases.md** — Development roadmap broken into 12 phases
- **patchnotes.md** — This file

### Game Design Locked In
- 5×12 grid battlefield
- 6 rarity tiers (Trash → Legendary)
- 6 difficulty modes (Tutorial, Easy, Normal, Hard, Insane, Endless)
- 3 card pack tiers (Mythic, Arcane, Frenzy) with pity mechanics
- Aether-Root (Mother Plant) as the player health pool
- Idler combat with player-cast side-panel spells
- Round 1–10 zombie scaling formulas locked in
- 10 unique bosses defined (one per round)
- Pack-exclusive card rosters defined
- Economy plant system (Sunflower → Gilded Rose evolution)

### Notes
- No code yet — currently in **Phase 0: Planning**.
- Next milestone: **Phase 1 — Core Engine & Rendering**.

---

## Template for Future Releases

```
## vX.Y.Z — YYYY-MM-DD — Short Summary

### Added
- New feature

### Changed
- Modified behavior

### Fixed
- Bug fix

### Removed
- Deprecated/removed feature

### Balance
- Stat tuning
```
