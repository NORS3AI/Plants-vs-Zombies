# Development Phases

This document is the **master roadmap** for **Plants vs Zombies: Card Battler**. Each phase is a self-contained milestone with clear deliverables. Work proceeds top-to-bottom; later phases depend on earlier ones.

> **Current Phase:** **Phase 0 — Planning**

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

## Phase 1 — Project Skeleton & Core Engine

**Goal:** Stand up the browser project with a renderable game loop, served from `/docs` on `main`.

- [ ] Create `/docs/index.html` entry point (GitHub Pages root)
- [ ] Create `/docs/css/`, `/docs/js/`, `/docs/assets/` folder structure
- [ ] Create `/docs/js/game/`, `/docs/js/cards/`, `/docs/js/ui/` subfolders
- [ ] Set up CSS reset + theme variables (dark/light mode foundations) in `/docs/css/`
- [ ] Implement core game loop (`requestAnimationFrame`) in `/docs/js/game/`
- [ ] Implement state machine: `MENU → DIFFICULTY → SHOP → COUNTDOWN → COMBAT → ROUND_END`
- [ ] Render the 5×12 grid (placeholder tiles)
- [ ] Render the Aether-Root sprite (placeholder)
- [ ] Set up localStorage save/load skeleton
- [ ] Verify GitHub Pages serves `/docs` on `main` correctly

**Exit Criteria:** A blank game shell loads at `nors3ai.github.io/plants-vs-zombies`, transitions between states, and saves to localStorage.

---

## Phase 2 — Main Menu & Settings

**Goal:** Player can launch the game and configure preferences.

- [ ] Animated title screen
- [ ] Start Game button (animated)
- [ ] Settings panel UI
- [ ] Dark/Light mode toggle (CSS variable swap)
- [ ] Music On/Off toggle
- [ ] Sounds On/Off toggle
- [ ] Volume sliders
- [ ] Save Game / Load Game / Reset Game buttons
- [ ] Reset confirmation modal
- [ ] Persist settings to localStorage

**Exit Criteria:** Settings persist across page reloads. Theme switches live.

---

## Phase 3 — Difficulty Selection & Round Flow

**Goal:** Player can pick difficulty and walk through the round-flow skeleton.

- [ ] Difficulty selection screen (Tutorial / Easy / Normal / Hard / Insane)
- [ ] Endless option present but locked
- [ ] Difficulty stat config object (player HP, gold, scaling multipliers)
- [ ] Round counter UI
- [ ] Animated 5-second countdown (small → zoom → fade)
- [ ] First-shop-no-countdown logic
- [ ] Round-end summary screen
- [ ] Game-over screen on Aether-Root death

**Exit Criteria:** Player can pick difficulty, see countdown, and loop through empty rounds.

---

## Phase 4 — Card Data Model

**Goal:** Define the data layer for all cards before any combat is wired up.

- [ ] Card schema (id, name, rarity, type, cost, sell, stats, ability, attack pattern)
- [ ] Rarity config (colors, drop weights, cost ranges, sell ranges)
- [ ] Standard plant roster (6 cards: Trash → Legendary)
- [ ] Standard spell roster (6 spells)
- [ ] Mythic pack-exclusive roster
- [ ] Arcane pack-exclusive roster
- [ ] Frenzy pack-exclusive roster
- [ ] Economy plants (Sunflower, Gilded Rose, Amber Grain, Crystal Fern, Midas Mandrake)
- [ ] Aether-Root spell roster (6 spells)
- [ ] Card data validation tests

**Exit Criteria:** All cards exist as data and can be queried by id/rarity/pack.

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

**Exit Criteria:** Game is feature-complete, polished, and live at `nors3ai.github.io/plants-vs-zombies`.

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
