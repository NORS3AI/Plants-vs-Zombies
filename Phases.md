# Development Phases

This document is the **master roadmap** for **Plants vs Zombies: Card Battler**. Each phase is a self-contained milestone with clear deliverables. Work proceeds top-to-bottom; later phases depend on earlier ones.

> **Current Phase:** **Phase 5 — Shop Mode** (Phase 4 complete)

---

## Phase 0 — Planning ✅

**Goal:** Lock in design, structure, and roadmap before any code is written.

- [x] Create `CLAUDE.md` (master design doc)
- [x] Create `README.md` (public overview + GitHub Pages link)
- [x] Create `Features.md` (full feature checklist)
- [x] Create `patchnotes.md` (version history)
- [x] Create `Phases.md` (this file)
- [x] Lock in rarity system, difficulty scaling, and zombie/boss formulas
- [x] Define card rosters (standard + pack exclusives)
- [x] Define Aether-Root spells

**Exit Criteria:** All five planning docs exist and are reviewed.

---

## Phase 1 — Project Skeleton & Core Engine ✅

**Goal:** Stand up the browser project with a renderable game loop, served from `/docs` on `main`.

- [x] Create `/docs/index.html` entry point (GitHub Pages root)
- [x] Create `/docs/css/`, `/docs/js/`, `/docs/assets/` folder structure
- [x] Create `/docs/js/game/`, `/docs/js/cards/`, `/docs/js/ui/` subfolders
- [x] Set up CSS reset + theme variables (dark/light mode foundations) in `/docs/css/`
- [x] Implement core game loop (`requestAnimationFrame`) in `/docs/js/game/loop.js`
- [x] Implement state machine: `MENU → DIFFICULTY → SHOP → COUNTDOWN → COMBAT → ROUND_END`
- [x] Render the 5×12 grid (placeholder tiles)
- [x] Render the Aether-Root sprite (placeholder)
- [x] Set up localStorage save/load skeleton
- [x] Verify GitHub Pages serves `/docs` on `main` correctly

**Exit Criteria:** A blank game shell loads at `nors3ai.github.io/Plants-vs-Zombies`, transitions between states, and saves to localStorage. ✅

---

## Phase 2 — Main Menu & Settings ✅

**Goal:** Player can launch the game and configure preferences.

- [x] Animated title screen (gradient shimmer + bob)
- [x] Start Game button (pulsing animation)
- [x] Settings panel UI
- [x] Dark/Light mode toggle (CSS variable swap)
- [x] Music On/Off toggle (wired to AudioManager)
- [x] Sounds On/Off toggle (wired to AudioManager)
- [x] Volume sliders (music + SFX, live updates)
- [x] Save Game / Load Game (Resume) / Reset Game buttons
- [x] Reset confirmation modal (custom modal system)
- [x] Persist settings to localStorage
- [x] Resume Game button (visible when save exists)
- [x] In-game pause button → Settings (with Quit Run option)
- [x] AudioManager with Web Audio API synthesized SFX (click, hover, tick, go, back)

**Exit Criteria:** Settings persist across page reloads. Theme switches live. Audio toggles produce audible changes. ✅

---

## Phase 3 — Difficulty Selection & Round Flow ✅

**Goal:** Player can pick difficulty and walk through the round-flow skeleton.

- [x] Difficulty selection screen (Tutorial / Easy / Normal / Hard / Insane)
- [x] Endless option present but locked
- [x] Difficulty stat config object (player HP, gold, scaling multipliers)
- [x] Difficulty cards show enemy HP/DMG multiplier subtext
- [x] Round counter UI ("Round X / 10" or "Round X" for endless)
- [x] HP color coding (red below 25%, amber below 50%)
- [x] Animated 5-second countdown (small → zoom → fade)
- [x] First-shop-no-countdown logic (countdown only between shop→combat)
- [x] Round-end summary screen with real stats fields
- [x] Per-round stats tracking on `currentRun` (gold/kills/plants lost)
- [x] Run-total tracking (totalKills, totalGoldEarned, totalPlantsLost)
- [x] Game-over screen on Aether-Root death (with stats)
- [x] Debug damage button (Phase 7 will replace with real combat damage)
- [x] Round 10 victory stub (unlocks Endless, returns to menu)
- [x] New SFX: `damage` and `gameover`

**Exit Criteria:** Player can pick difficulty, see countdown, loop through rounds, take damage, and trigger game-over with full stats. ✅

---

## Phase 4 — Card Data Model ✅

**Goal:** Define the data layer for all cards before any combat is wired up.

- [x] Card schema (id, name, rarity, type, cost, sell, stats, ability, attack pattern)
- [x] Rarity config (colors, drop weights, cost ranges, sell ranges)
- [x] Pack config (Mythic/Arcane/Frenzy with pity rules)
- [x] Standard plant roster (6 cards: Trash → Legendary)
- [x] Standard spell roster (6 spells)
- [x] Mythic pack-exclusive roster (6 cards)
- [x] Arcane pack-exclusive roster (7 cards)
- [x] Frenzy pack-exclusive roster (6 cards)
- [x] Economy plants (Sunflower, Gilded Rose, Amber Grain, Crystal Fern, Midas Mandrake)
- [x] Aether-Root spell roster (6 spells)
- [x] Query API: getCard, getCardsByRarity, getCardsByCategory, getCardsByPack
- [x] Random helpers: rollShopCard(s), rollPackCards (with Frenzy pity)
- [x] Card data validation (validateCards / validateAndLog at boot)

**Exit Criteria:** All 39 cards exist as data and can be queried by id/rarity/pack. Validation passes cleanly. Sample shop rolls and pack rolls produce expected distributions. ✅

---

## Phase 5 — Shop Mode

**Goal:** Player can spend gold on cards and packs.

- [ ] Shop UI (3 randomized cards)
- [ ] Weighted random card generator using rarity drop %
- [ ] Card detail panel (long-hold/long-tap)
- [ ] Buy card button
- [ ] Sell card button (rarity-based gold return)
- [ ] Refresh button (1 gold)
- [ ] Card pack section (Mythic / Arcane / Frenzy chests)
- [ ] Pack-opening animation
- [ ] Pack drop logic with pity mechanics
- [ ] Frenzy guaranteed-Epic enforcement
- [ ] Every-5th-Frenzy guaranteed Legendary
- [ ] Deck UI showing owned cards (max 10 active)

**Exit Criteria:** Player can buy, sell, refresh, and open packs with correct probabilities.

---

## Phase 6 — Grid Placement

**Goal:** Player can place cards on the 5×12 grid before combat begins.

- [ ] Drag-and-drop placement
- [ ] Tap-select then tap-place (touch-friendly fallback)
- [ ] Valid-tile highlighting
- [ ] Aether-Root anchor (far-left column locked)
- [ ] Per-card targeting dropdown (First / Strongest / Weakest)
- [ ] Move/remove placed cards before countdown
- [ ] Confirm Placement → Start Game button
- [ ] Auto-merge logic for 3 Sunflowers → Gilded Rose

**Exit Criteria:** Player can build a board, set targeting, and trigger the countdown.

---

## Phase 7 — Combat Engine (Auto-Combat)

**Goal:** Plants and zombies fight automatically once the round starts.

- [ ] Plant cast timer system (base 2.0s)
- [ ] Per-card attack pattern (forward/backward/side/diagonal)
- [ ] Targeting priority resolution (First / Strongest / Weakest)
- [ ] Zombie spawn system with sub-wave timing
- [ ] Zombie movement along lanes
- [ ] Zombie melee on plants
- [ ] Plant death (remove from grid)
- [ ] Zombie death (gold popup, +gold)
- [ ] Damage / heal / shield application pipeline
- [ ] Status effects (slow, freeze, burn, stun, shield)
- [ ] Aether-Root damage when zombies reach far-left
- [ ] Game over on Aether-Root death

**Exit Criteria:** A full round can play out automatically with kills, gold, and death states working.

---

## Phase 8 — Rounds 1–10 Content

**Goal:** Implement all 10 standard rounds and their unique bosses.

- [ ] Standard zombie roster (Shambling Husk → Abyssal Revenant)
- [ ] HP/DMG scaling formulas
- [ ] Wave & sub-wave compositions per round
- [ ] All 10 boss encounters with unique abilities
- [ ] Boss visual scaling (1.5×–2×)
- [ ] Frenzy buff to remaining zombies on boss spawn
- [ ] Boss music swap
- [ ] Round 10 victory trigger → Endless unlock + achievement popup

**Exit Criteria:** Player can complete a full Normal-mode run from Round 1 to Round 10 and trigger the win state.

---

## Phase 9 — Aether-Root Spells (Player Active)

**Goal:** Side-panel spell system with cooldowns.

- [ ] Side-panel UI
- [ ] Spell slots populated from owned Aether-Root spells
- [ ] **Sap-Mend** (15s cd)
- [ ] **Grove-Shield** (30s cd)
- [ ] **Thorn-Pulse** (45s cd)
- [ ] **Photosynthetic Burst** (60s cd)
- [ ] **Verdant Rebirth** (1/round)
- [ ] **Nature's Wrath** (90s cd)
- [ ] Visual cooldown indicators
- [ ] Aether-Root spells only obtainable from card packs

**Exit Criteria:** Player can cast spells mid-combat with correct cooldowns and effects.

---

## Phase 10 — Tutorial Mode

**Goal:** Teach the player without an info dump.

- [ ] Contextual popup framework
- [ ] First-shop popup
- [ ] First-purchase popup
- [ ] First-placement popup
- [ ] First-countdown popup
- [ ] First-zombie-kill popup
- [ ] First-spell popup
- [ ] First-pack popup
- [ ] First-boss popup
- [ ] First-plant-death popup
- [ ] Tutorial completion marker (so popups don't repeat)

**Exit Criteria:** A new player completes Tutorial mode and learns all core mechanics.

---

## Phase 11 — Endless Mode & Leaderboard

**Goal:** Post-Round-10 endgame loop.

- [ ] Endless unlock trigger
- [ ] Endless menu entry below Insane
- [ ] Infinite wave scaling
- [ ] Mixed-difficulty wave composition
- [ ] Round counter persistence
- [ ] Local leaderboard (localStorage)
- [ ] Player name entry on death
- [ ] Leaderboard UI (sortable by round)
- [ ] Difficulty filter on leaderboard

**Exit Criteria:** Player can play infinite mode and submit scores.

---

## Phase 12 — Polish, Audio & Release

**Goal:** Make it feel like a real game.

- [ ] Final card art / sprites
- [ ] Plant attack animations
- [ ] Zombie walking + death animations
- [ ] Boss intro animations
- [ ] Background music tracks (menu / combat / boss)
- [ ] All SFX (cards, packs, attacks, deaths, spells, countdown)
- [ ] Particle effects (gold, damage numbers, status effects)
- [ ] Animated Legendary card border (gold + red shine)
- [ ] Mobile responsive layout pass
- [ ] Performance optimization (60fps target)
- [ ] Bug bash
- [ ] **v1.0.0 release** to GitHub Pages

**Exit Criteria:** Game is feature-complete, polished, and live at `nors3ai.github.io/Plants-vs-Zombies`.

---

## Post-1.0 Stretch Phases

- **Phase 13** — Achievements panel & lifetime stats
- **Phase 14** — Cloud save sync + global leaderboard
- **Phase 15** — Daily challenges
- **Phase 16** — Card crafting system
- **Phase 17** — Cosmetic skins
- **Phase 18** — PvP wave-trading mode

---

## Phase Dependencies

```
Phase 0 (Planning)
    ↓
Phase 1 (Skeleton)
    ↓
Phase 2 (Menu/Settings) ── Phase 3 (Difficulty/Flow)
                                   ↓
                          Phase 4 (Card Data)
                                   ↓
                          Phase 5 (Shop) ── Phase 6 (Placement)
                                                   ↓
                                          Phase 7 (Combat Engine)
                                                   ↓
                                          Phase 8 (Rounds 1–10)
                                                   ↓
                                          Phase 9 (Aether-Root Spells)
                                                   ↓
                                          Phase 10 (Tutorial)
                                                   ↓
                                          Phase 11 (Endless/Leaderboard)
                                                   ↓
                                          Phase 12 (Polish/Release)
```
