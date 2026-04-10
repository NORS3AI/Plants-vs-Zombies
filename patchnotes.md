# Patch Notes

All notable changes to **Plants vs Zombies: Card Battler** are documented here.
Format: `Version — Date — Summary`

---

## v0.3.0 — 2026-04-10 — Phase 3: Round Flow & Game Over

### Added
- **Round summary screen** — gold earned, kills, plants lost, current HP, total gold. Wired to `currentRun.lastRoundStats`. The combat engine in Phase 7 will populate the values.
- **Game-over flow** — `damageAetherRoot()` decrements HP and transitions to `GAME_OVER` at 0. Game-over screen shows total kills, gold earned, plants lost, difficulty, and round reached.
- **Debug "Take 10 Damage" button** on the combat screen — lets you exercise the game-over flow before real combat lands.
- **HUD format upgrade** — round counter shows "Round X / 10" for standard modes and just "Round X" for Endless. HP shows "current / max".
- **HP color coding** — `.hud-hp-low` (red) below 25%, `.hud-hp-med` (amber) below 50%.
- **Difficulty card enrichment** — each card now shows enemy HP/DMG multipliers as subtext (e.g., "Enemy: 200% HP · 150% DMG" on Hard).
- **Round 10 victory stub** — clicking "Victory!" on the round-end summary unlocks Endless mode (saves to meta), shows toast, returns to menu. Phase 8 will add a proper victory screen.
- **New SFX** — `damage` (low sawtooth sweep, alarming) and `gameover` (descending lament).
- **Per-round stat accumulators** on `currentRun` — `lastRoundGoldEarned`, `lastRoundKills`, `lastRoundPlantsLost` ready for Phase 7 combat to populate.
- **Run-total tracking** — `totalKills`, `totalGoldEarned`, `totalPlantsLost` persisted across rounds.

### Changed
- `endRound()` is now a real function: snapshots per-round stats into `lastRoundStats`, accumulates run totals, increments round counter, transitions to ROUND_END.
- `GAME_OVER` no longer immediately clears `currentRun` — it's kept in memory so the game-over screen can read its stats. Cleared on back-to-menu.
- Phase badge advances to "Phase 3 — Round Flow".
- Version label bumped to v0.3.0.

### Fixed (Phase 2 audit follow-ups)
- **Bug 1:** Volume scaling was quadratic. The SFX bus AND each preset both multiplied by `sfxVolume`, so 50% slider gave ~6% sound. Presets now use fixed inner gains; the bus is the only volume scaler. Slider response is now linear.
- **Bug 2:** Volume slider couldn't reach 0. `Number(value) || 60` treated 0 as falsy and silently substituted 60. Replaced with explicit `value !== undefined ? Number(value) : 60`.
- **Bug 3:** Pause button overlapped the phase badge. Phase badge moved from `top-right` to `top-left`; pause button kept at top-right of game header.

---

## v0.2.0 — 2026-04-10 — Phase 2: Main Menu & Settings

### Added
- **AudioManager** (`docs/js/game/audio.js`) — Web Audio API wrapper with lazy init (autoplay-policy compliant). Synthesizes 5 SFX presets: `click`, `hover`, `tick`, `go`, `back`. Music stub ready for Phase 12 tracks.
- **Modal system** (`docs/js/ui/modal.js`) — Promise-based modal with backdrop blur, Escape/click-out dismissal, configurable buttons. Replaces native `window.confirm`.
- **Animated title screen** — Gradient shimmer (`titleShimmer`) + gentle vertical bob (`titleBob`).
- **Pulsing Start Game button** — Concentric ring pulse animation drawing the eye.
- **Volume sliders** — Music + SFX, live `input` event updates AudioManager and persists immediately.
- **Resume Game button** — Visible on menu when `Save.hasRun()` returns true; restores `currentRun` and jumps to SHOP.
- **In-game pause button** (⚙) — Top-right of shop/combat screens, opens Settings as a pause menu.
- **Quit Run button** — Visible only in Settings when a run is in progress; confirms before clearing the run.
- **Settings back button** — Returns to wherever Settings was opened from (uses `state.previous`), so opening Settings mid-run resumes back into the run.
- **Audio feedback** — All button clicks play `click` SFX, back actions play `back`, countdown ticks play `tick`, round-start plays `go`.

### Changed
- Reset Game now uses the new modal system instead of native `confirm()`.
- Phase badge in header advances to "Phase 2 — Menu & Settings".
- `applySettings` now also reads volume sliders and pushes settings into AudioManager.
- Version label bumped to v0.2.0.

### Fixed (Phase 1 audit follow-ups)
- All 6 audit issues fixed in v0.1.1: countdown timing, screen fade-in, endless lock leak, grid checker pattern, animation reset, hardcoded difficulty labels.

### Notes
- Music tracks themselves are still deferred to Phase 12; the music toggle/volume affect future playback.
- The pause button is visible but the round simulation isn't yet pausable (no combat sim exists). Treats Settings overlay as a logical pause.
- Audio context initializes on first user click (browser autoplay policy).

---

## v0.1.1 — 2026-04-10 — Phase 1 Audit Fixes

### Fixed
- **Bug 1:** Countdown is now exactly 5 seconds (5,4,3,2,1 → combat) instead of 6.
- **Bug 2:** Screen fade-in animation re-runs on every screen swap via `.is-active` class + reflow.
- **Bug 3:** Endless unlock state no longer leaks after game reset; difficulty cards rebuilt from `DIFFICULTIES` + meta on every enter.
- **Bug 5:** Grid checker pattern fixed — uses `(row+col)%2` parity classes (`.tile-a`/`.tile-b`) instead of `:nth-child(even)` which produced vertical stripes.
- **Bug 6:** Countdown animation reset now uses class swap (`.ticking`) instead of mutating inline `animation` property.
- **Issue 1:** Difficulty card labels now built from `DIFFICULTIES` in JS (single source of truth); removed hardcoded HP/Gold strings from `index.html`.
- **Bonus:** `startNewRun` now re-checks meta for endless unlock; previously it always rejected based on the static `locked` flag.

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
