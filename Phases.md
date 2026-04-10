# Development Phases

This document is the **master roadmap** for **Plants vs Zombies: Card Battler**. Each phase is a self-contained milestone with clear deliverables. Work proceeds top-to-bottom; later phases depend on earlier ones.

> **Current Phase:** **Complete** — v1.0.0 released (all 12 phases shipped)

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

## Phase 5 — Shop Mode ✅

**Goal:** Player can spend gold on cards and packs.

- [x] Shop UI (3 randomized cards with rarity-colored borders)
- [x] Weighted random card generator using rarity drop %
- [x] Card detail rendered inline (full description on each card)
- [x] Tap-to-buy
- [x] Tap-to-sell from deck inventory (with confirmation modal)
- [x] Refresh button (1 gold) — disabled when broke
- [x] Card pack section (Mythic / Arcane / Frenzy chests)
- [x] Pack-opening animation (modal reveal with staggered card fade-in)
- [x] Pack drop logic with pity mechanics
- [x] Frenzy guaranteed-Epic enforcement
- [x] Every-5th-Frenzy guaranteed Legendary
- [x] Deck UI showing owned cards (max 10 active)
- [x] Free auto-reroll at start of each new round
- [x] Aether-Root spells from packs go to separate inventory
- [x] Pack pity counter shown on chest ("Pity in N")
- [x] Legendary cards have animated gold/red shine

**Exit Criteria:** Player can buy, sell, refresh, and open packs with correct probabilities. ✅

---

## Phase 6 — Grid Placement ✅

**Goal:** Player can place cards on the 5×12 grid before combat begins.

- [ ] Drag-and-drop placement (deferred — click-to-place covers mobile + desktop)
- [x] Tap-select then tap-place (touch-friendly)
- [x] Valid-tile highlighting when a card is selected
- [x] Aether-Root anchor (far-left, not part of the 60 tiles)
- [x] Per-card targeting buttons (First / Strongest / Weakest) via placed-card modal
- [x] Move/remove placed cards before countdown (via placed-card modal)
- [x] Confirm Placement → Start Game button (already wired to countdown)
- [x] Auto-merge logic for 3 Sunflowers → Gilded Rose
- [x] Escape key clears pending selection
- [x] Placed cards show as icons on their tiles with rarity-colored borders
- [x] Sunflower merge plays `go` SFX + shows success toast

**Exit Criteria:** Player can build a board, set targeting, and trigger the countdown. ✅

---

## Phase 7 — Combat Engine (Auto-Combat) ✅

**Goal:** Plants and zombies fight automatically once the round starts.

- [x] Plant cast timer system (base 2.0s, respects `card.castTime`)
- [x] Per-card attack pattern (forward implemented; cone uses 3-row target set; side falls back to forward for Phase 7; full patterns in Phase 8+)
- [x] Targeting priority resolution (First / Strongest / Weakest)
- [x] Zombie spawn system with per-round scaling and time-spread scheduling
- [x] Zombie movement along lanes (continuous column position, tile-interpolated)
- [x] Zombie melee on plants (blocked at tile-adjacency, periodic attacks)
- [x] Plant death (remove from grid + deck placement)
- [x] Zombie death (gold popup + gold gain)
- [x] Damage pipeline (plants → zombies and zombies → plants)
- [ ] Status effects (slow, freeze, burn, stun, shield) — deferred to Phase 8
- [x] Aether-Root damage when zombies reach col 0
- [x] Game over on Aether-Root death
- [x] Economy plants (Sunflower) generate gold on cast during combat
- [x] Plant HP bars + zombie HP bars
- [x] Floating gold text on zombie kill and Sunflower cast
- [x] Plant attack flash + zombie walk/attack animations
- [x] Round end on all zombies cleared; plant HP restored between rounds
- [x] Mid-round game-over preserves total kills/gold for the summary screen

**Exit Criteria:** A full round can play out automatically with kills, gold, and death states working. ✅

---

## Phase 8 — Rounds 1–10 Content ✅

**Goal:** Implement all 10 standard rounds and their unique bosses.

- [x] Standard zombie roster (Shambling Husk → Abyssal Revenant) — 10 named types with unique sprites and optional speedMul / armor modifiers
- [x] HP/DMG scaling formulas (`HP = 10 + round×10`, `DMG = 2 + round×3`)
- [x] Wave compositions per round (count progression [3, 6, …, 50])
- [x] All 10 boss encounters with stat-correct HP/DMG and signature abilities declared
- [x] Boss visual scaling (1.5×–2× via CSS custom property)
- [x] Frenzy buff to remaining zombies on boss spawn (+10% speed per spec)
- [ ] Boss music swap — deferred to Phase 12 (audio polish)
- [x] Round 10 victory trigger → Endless unlock + menu return (existing Phase 3 handler works with the new boss-based round completion)
- [x] Boss banner UI (red gradient banner with HP bar, name, ability, visible only while boss alive)
- [x] Plant abilities wired: `slow_on_hit` (Frost-Bite Willow, Bramble-Whip Vine), `splash` (Void-Petal Bloom), `cone_damage` (Dragon-Breath Snapdragon), `heal_adjacent` (Solar Archon)
- [x] Zombie armor (flat incoming damage reduction, minimum 1 dmg)
- [x] Slow status (halves zombie speed while active) with blue visual tint
- [x] Fully-implemented boss abilities: `heavyThump` (R1, 2× damage every 3rd attack), `trample` (R2, +20% speed via speedMul), `soulReap` (R3, boss heals on plant kill), `armor` (R4+, flat damage reduction)
- [~] Stubbed boss abilities: Venom Spit (R5), Freezing Aura (R6), Burn-Step (R7), Phase Shift (R8), Blight Breath (R9), Death's Call (R10) — declared in data but not yet wired into combat

**Exit Criteria:** Player can complete a full Normal-mode run from Round 1 to Round 10 and trigger the win state. ✅

---

## Phase 9 — Aether-Root Spells (Player Active) ✅

**Goal:** Side-panel spell system with cooldowns.

- [x] Side-panel UI (button per owned spell with icon, name, cooldown overlay)
- [x] Spell slots populated from `run.aetherSpells` (Phase 5 pack drops)
- [x] **Sap-Mend** (15s cd) — heals Aether-Root 10 HP
- [x] **Grove-Shield** (30s cd) — +25 HP shield
- [x] **Thorn-Pulse** (45s cd) — knocks all zombies back 2 tiles and resets their attack state
- [x] **Photosynthetic Burst** (60s cd) — +5 gold, -5 HP (bypasses shield)
- [x] **Verdant Rebirth** (1/round) — full heal + 50 HP shield
- [x] **Nature's Wrath** (90s cd) — 5-second 50 dps beam down the center row
- [x] Visual cooldown indicators (dimmed overlay + seconds text)
- [x] Aether-Root spells only obtainable from card packs (Phase 5 routing preserved)
- [x] Aether-Root shield bar (blue) visible in side panel when shield > 0
- [x] Shield absorbs damage before HP in the zombie-breach pipeline
- [x] Spell cooldowns tick during combat
- [x] Cooldowns and `usedThisRound` flags reset at each round start
- [x] Aether-Root shield cleared at round start

**Exit Criteria:** Player can cast spells mid-combat with correct cooldowns and effects. ✅

---

## Phase 10 — Tutorial Mode ✅

**Goal:** Teach the player without an info dump.

- [x] Contextual popup framework (slide-in from right, non-blocking, auto-dismiss after 12s)
- [x] First-shop popup ("Welcome to the Shop")
- [x] First-purchase popup ("First Purchase")
- [x] First-placement popup ("Placement")
- [x] First-countdown popup ("Round Starting")
- [x] First-zombie-kill popup ("First Kill!")
- [x] First-spell popup ("Aether-Root Spell Cast")
- [x] First-pack popup ("Card Pack Opened")
- [x] First-boss popup ("BOSS!")
- [x] First-plant-death popup ("Plant Lost")
- [x] Tutorial completion marker per popup (stored in `run.tutorialSeen`, reset per run)
- [x] Only fires in Tutorial difficulty (no-op on Normal/Hard/Insane/Endless)
- [x] Click "Got it" or auto-dismiss after 12 seconds
- [x] Cleared on state transitions out of shop/combat to avoid stale popups

**Exit Criteria:** A new player completes Tutorial mode and learns all core mechanics. ✅

---

## Phase 11 — Endless Mode & Leaderboard ✅

**Goal:** Post-Round-10 endgame loop.

- [x] Endless unlock trigger (R10 Arch-Lich Malakor kill → VICTORY state)
- [x] Endless menu entry below Insane (already in difficulty config; gated by `meta.endlessUnlocked`)
- [x] Infinite wave scaling (count + HP/DMG extrapolate past round 10)
- [x] Mixed-difficulty wave composition — endless rounds mix 3 zombie type pools (easy, mid armored, hard armored)
- [x] Round counter persistence (already via Save)
- [x] Local leaderboard in `meta.leaderboard` (max 50 entries, sorted by highest round)
- [x] Player name entry on game-over AND on victory (last name remembered)
- [x] Leaderboard UI — sortable table with rank / name / difficulty / round / kills / gold
- [x] Difficulty filter dropdown on leaderboard
- [x] Victory screen (replaces the Phase 3 stub) with animated title, unlock banner, stats, name entry
- [x] Victory entries marked with 🏆 in the leaderboard table
- [x] Menu Leaderboard button enabled when any entries exist OR endless is unlocked
- [x] Boss cycles through BOSSES by `(round - 1) % 10` in endless

**Exit Criteria:** Player can play infinite mode and submit scores. ✅

---

## Phase 12 — Polish, Audio & Release ✅

**Goal:** Make it feel like a real game.

- [x] Emoji sprites for all cards / zombies / bosses (not final art, but consistent)
- [x] Plant attack projectile visuals — per-rarity colored dots travel from plant to target
- [x] Zombie walking animation (existing) + death fade-out animation
- [x] Boss intro screen-shake (0.5s horizontal wobble on boss spawn)
- [x] Animated Legendary card border (gold/red pulse + diagonal shimmer sweep)
- [x] Mobile responsive layout pass (100dvh, CSS var tile sizing, all breakpoints)
- [x] Pull-to-refresh disabled, touch targets ≥48px, no iOS auto-zoom
- [x] Performance: Map-based DOM diff for zombies/projectiles/floating text (60fps target)
- [x] Per-round buff cleanup (Nectar Rush, Aether Bloom, Arcane Surge no longer persist)
- [x] Auto-focus name inputs + Enter-to-submit on game-over/victory screens
- [x] Dev phase badge removed
- [x] Version bumped to **v1.0.0**
- [ ] Background music tracks (menu / combat / boss) — deferred (no audio files bundled; AudioManager API ready for drop-in)
- [x] SFX coverage: click, hover, tick, go, back, damage, gameover
- [x] Particle effects: gold popups, floating text, projectile dots, status tints
- [x] Card / zombie / floating text rendering diff avoids per-frame full re-renders
- [x] Bug bash across all 12 phases

**Exit Criteria:** Game is feature-complete, polished, and live at `nors3ai.github.io/Plants-vs-Zombies`. ✅

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
