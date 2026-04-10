# Patch Notes

All notable changes to **Plants vs Zombies: Card Battler** are documented here.
Format: `Version — Date — Summary`

---

## v0.11.0 — 2026-04-10 — Phase 11: Endless Mode & Leaderboard

### Added
- **`docs/js/game/leaderboard.js`** — Local-storage leaderboard:
  - `addEntry({ name, difficulty, round, kills, gold, victory })` — inserts, sorts by round DESC (then date ASC), caps at 50 entries, returns 1-indexed rank
  - `getEntries({ difficulty })` — optional filter by difficulty, or `'all'`
  - `hasEntries()`, `clear()`, `getPersonalBest()`, `getLastName()`, `setLastName()`
- **VICTORY state** (new) — replaces the Phase 3 `handleRound10Victory` stub:
  - Animated title with shimmer + pulse glow
  - Unlock banner shown only the first time Endless is unlocked
  - Full run stats (difficulty / kills / gold / plants lost)
  - Name entry with pre-fill from last-used name
  - Submit → add to leaderboard → clear run → return to menu
- **LEADERBOARD state** (new) — sortable table screen:
  - Rank / Name / Difficulty / Round / Kills / Gold columns
  - Victory rows highlighted + marked with 🏆
  - Difficulty filter dropdown (all / tutorial / easy / normal / hard / insane / endless)
  - Empty state hint for new players
- **Game-over name entry** — same name-entry block on the game-over screen; submits a non-victory score. Pre-fills with last-used name.
- **Menu Leaderboard button** — now enabled when any entries exist OR endless is unlocked. Routes to the LEADERBOARD state.
- **Endless wave composition** — rounds 11+ mix 3 zombie type pools (Shambling Husk + Plague-Knight armored + Abyssal Revenant armored) per spec's "mix of Easy and Insane zombies". `makeZombieType` now accepts an optional `typeOverrideIdx`.
- **Endless boss cycling** — `bossDefForRound` uses `(round - 1) % 10` for endless rounds so bosses rotate through all 10 types.

### Changed
- `handleRound10Victory` → transitions to VICTORY state instead of flashing a toast and returning to menu
- Phase badge → "Phase 11 — Endless", version → v0.11.0
- `window.__pvz.Leaderboard` exposed for debug

### Verified (headless)
- 3 entries inserted — correctly sorted by round (Carol R12 → Alice R10 victory → Bob R6)
- Difficulty filter returns only matching entries
- `getPersonalBest` returns the top entry
- Endless R12 schedule produces 60 mixed-type zombies (Shambling Husk + Plague-Knight + Abyssal Revenant, HP=130 = 10+12×10) + 1 Rot-Hoof Centaur boss
- Leaderboard persists via `meta.leaderboard` and survives page reload

### Notes
- Leaderboard is local-only (browser localStorage). A global leaderboard is a stretch goal for Phase 13+.
- Cooldown reset on combat init means endless rounds always start with spells ready, matching the standard round behavior.
- Endless difficulty runs correctly through ROUND_END → SHOP loop indefinitely since the round-10 victory check only fires for `difficulty !== 'endless'`.

---

## v0.10.0 — 2026-04-10 — Phase 10: Tutorial Mode

### Added
- **`docs/js/ui/tutorial.js`** — Contextual popup system with 9 first-time triggers:
  - `first_shop` — fires on SHOP enter
  - `first_buy` — fires on first successful `buyShopSlot`
  - `first_place` — fires on first successful `placeAt`
  - `first_countdown` — fires on COUNTDOWN enter
  - `first_zombie_kill` — fires on first `killZombie`
  - `first_spell` — fires on first `castAetherSpell`
  - `first_pack` — fires on first successful `buyPack`
  - `first_boss` — fires on first boss spawn (hooks into existing onBossSpawn)
  - `first_plant_death` — fires on first `killPlant`
- **Popup UI** — slide-in card from the right, title + body + "Got it" button, auto-dismisses after 12s
- **Per-run tracking** — `run.tutorialSeen` map prevents repeat popups within a single Tutorial run; fresh runs get fresh popups
- **Tutorial-only** — popups are no-ops on Normal/Hard/Insane/Endless difficulties
- **`fireCallback(name, ...args)`** helper exported from combat.js so aetherSpells.js can fire `onSpellCast` events back to main.js
- **`setCombatViewAudio(audio)`** in combatView.js — lets main.js inject the audio manager so spell clicks play SFX (Phase 9 audit fix)

### Phase 9 audit fix
- **Spell click SFX** — slot clicks now play `go` on success, `back` on denied. Previously `stopPropagation` was preventing the document-level click handler from firing audio.

### New callbacks threaded through
- `onZombieKilled(zombie)` — fires from `killZombie` for tutorial `first_zombie_kill`
- `onSpellCast(card, instance)` — fires from `castAetherSpell` via `fireCallback`
- Shop: `onFirstBuy`, `onFirstPack`
- Placement: `onFirstPlace`

### Changed
- Phase badge → "Phase 10 — Tutorial", version → v0.10.0
- `window.__pvz.Tutorial` exposed for debug (`__pvz.Tutorial.forceShow('first_boss')` bypasses the difficulty check)

### Notes
- Tutorial popups are NOT modal — combat keeps running while they're visible. This prevents the tutorial from being a DOS attack on the player during a boss fight.
- The welcome popup ("first_shop") fires even on the initial DIFFICULTY→SHOP transition, so new Tutorial players see it immediately.
- Popups are dismissed on state exits from SHOP to prevent stale popups appearing on other screens.

---

## v0.9.0 — 2026-04-10 — Phase 9: Aether-Root Spells

### Added
- **`docs/js/game/aetherSpells.js`** — Full spell effect dispatcher:
  - `castAetherSpell(run, instanceId)` — validates cooldown / usedThisRound, dispatches to the effect function, starts cooldown
  - `tickAetherCooldowns(run, dt)` — decrements cooldownRemaining each frame
  - `tickActiveBeams(state, dt)` — applies Nature's Wrath DoT to the center row
  - `resetAetherForRound(run)` — clears cooldowns and usedThisRound flags at combat init
- **6 spell effects wired:**
  - **Sap-Mend** — heal 10 HP (15s cd)
  - **Grove-Shield** — +25 HP shield (30s cd)
  - **Thorn-Pulse** — knockback all zombies 2 tiles, reset attack state (45s cd)
  - **Photosynthetic Burst** — +5 gold (credited to run + totals), -5 HP (bypasses shield) (60s cd)
  - **Nature's Wrath** — 5s continuous 50 dps beam down the center row (90s cd)
  - **Verdant Rebirth** — full Aether-Root heal + 50 HP shield (1/round)
- **Aether-Root shield system:**
  - New `run.aetherRootShield` field in DEFAULT_RUN
  - Shield absorbs damage first before HP in the zombie-breach pipeline
  - Shield cleared at each combat init to prevent cross-round stacking exploits
  - Blue shield bar in the side panel (visible only when shield > 0)
- **Spell side panel UI** (replaces Phase 7 "Coming in Phase 9" placeholder):
  - Button per owned spell with icon, name, and cooldown overlay
  - Click to cast; cooldown overlay dims the slot and shows seconds remaining or "1/rnd"
  - Cast success plays a green pulse animation; denied plays a red shake
  - Empty state shows "Open packs to find Aether-Root spells" hint
- **Floating text** now has spell-cast flashes (e.g. "+10 HP", "NATURE'S WRATH!")
- **CSS**: `.spell-slot`, `.spell-cooldown-overlay`, `.aether-shield-wrap`, cast success/denied animations

### Changed
- `tickCombat` now ticks aether cooldowns, active beams, and reaps zombies killed by beam DoT
- `initCombat` clears `run.aetherRootShield` and calls `resetAetherForRound(run)`
- `combatView.initCombatView` builds the spell panel from `run.aetherSpells`
- Phase badge → "Phase 9 — Aether Spells", version → v0.9.0

### Fixed (Phase 8 audit)
- **Boss breach bug:** When a boss reached the Aether-Root, `_state.bossActive` wasn't cleared, so the boss banner would show stale data. The breach path now clears `bossActive` inline.

### Verified
- Headless test: Sap-Mend (+10 HP), Grove-Shield (+25 shield), Thorn-Pulse (knockback), Verdant Rebirth (full heal + 50 shield, stacking with existing shield to 75). Second Verdant Rebirth cast correctly rejected (once per round). Second Sap-Mend cast correctly rejected (15s cooldown remaining).

### Notes
- Stubbed boss abilities (R5–R10 Venom Spit, Freezing Aura, Burn-Step, Phase Shift, Blight Breath, Death's Call) are still flavor-only.
- Beam DoT visual (Nature's Wrath laser effect) is deferred — Phase 12 polish will render a red laser line down the row.
- Cooldowns reset at every combat init rather than carrying across rounds, so each round starts with spells fully ready.

---

## v0.8.0 — 2026-04-10 — Phase 8: Rounds 1–10 Content

### Added
- **Full zombie roster** (`docs/js/game/zombies.js`):
  - 10 named standard types: Shambling Husk, Rotted Squire, Grave-Bound Wight, Blighted Archer, Plague-Knight, Crypt Ghoul, Fallen Paladin, Bone-Grit Colossus, Lich Apprentice, Abyssal Revenant
  - Each with unique sprite and optional speed multiplier / armor
  - `zombieTypeForRound(round)` looks up the specific type; endless mode cycles through them
- **Full boss roster** — 10 bosses one per round, stats matching spec (`HP = 3× avg, DMG = 2× avg`):
  - R1 The Grave-Warden (Heavy Thump) — 60H/10D, scale 1.5
  - R2 Rot-Hoof Centaur (Trample) — 90H/16D, scale 1.5, +20% speed
  - R3 Cursed Harvester (Soul Reap) — 120H/22D, scale 1.6
  - R4 Iron-Bound Ogre (Armor Plating) — 150H/28D, scale 1.8, armor 3
  - R5 The Blight-Widow (Venom Spit stub) — 180H/34D, scale 1.6
  - R6 Frost-Lich Overseer (Freezing Aura stub) — 210H/40D, scale 1.7
  - R7 Infernal Juggernaut (Burn-Step stub) — 240H/46D, scale 1.8
  - R8 Shadow-Stalker Wraith (Phase Shift stub) — 270H/52D, scale 1.7
  - R9 Necro-Dragon Fledgling (Blight Breath stub) — 300H/58D, scale 1.9
  - R10 **The Arch-Lich Malakor** (Death's Call stub) — 500H/80D, scale 2.0 — defeating triggers Endless unlock
- **Implemented boss abilities:**
  - `heavyThump` — Grave-Warden deals 2× damage on every 3rd attack
  - `trample` — Rot-Hoof Centaur gets +20% speed baked into spawn stats
  - `soulReap` — Cursed Harvester heals 5 HP whenever it kills a plant
  - `armor` — Iron-Bound Ogre (and armored standard zombies) reduce incoming damage by their armor value (minimum 1)
- **Stubbed boss abilities** (declared in data, show on boss banner, no gameplay effect yet): Venom Spit, Freezing Aura, Burn-Step, Phase Shift, Blight Breath, Death's Call. Will be specialized in a later pass.
- **Boss spawn hook** — when a boss spawns, all remaining standard zombies get a +10% speed Frenzy buff per spec; `_callbacks.onBossSpawn` fires.
- **Plant abilities wired into combat:**
  - `slow_on_hit` — Frost-Bite Willow, Bramble-Whip Vine halve zombie speed for 2s on hit
  - `splash` — Void-Petal Bloom deals the same damage to zombies in an adjacent 3×3 area
  - `cone_damage` — Dragon-Breath Snapdragon hits multiple rows in a cone forward
  - `heal_adjacent` — Solar Archon restores 5 HP to adjacent plants on each cast
- **Zombie armor** — flat incoming damage reduction respecting a 1-dmg floor (Plague-Knight, Fallen Paladin, Bone-Grit Colossus, Abyssal Revenant, Iron-Bound Ogre)
- **Boss banner UI** — red-gradient banner with boss name, ability text, and HP bar, visible only while the boss is alive. Fades in on spawn.
- **CSS** for boss scaling (larger sprite via `--boss-scale` custom property), slowed-zombie blue tint, red boss glow.

### Fixed (Phase 7 audit follow-ups)
- **Floating text key bug** — keys were array-index-based, so expiring a text forced recreation of all surviving texts' DOM elements every frame. Each floating text now gets a stable unique id at creation (`_floatingCounter`), and the renderer keys off `ft.id`.
- **Amber Grain `goldPerLaneKill` dead feature** — combat engine now grants bonus gold from any plant in the zombie's row that has `economy.goldPerLaneKill`. Amber Grain finally produces gold as designed.
- **Dead `healSurvivors` helper removed** — plants always start rounds at full HP via `initCombat` hydration from `card.health`. A proper between-round persistence helper will land when permanent HP buffs (Wild Growth, shields) are wired in Phase 8+.

### Verified
- Headless simulation: round 1 with Solar Archon + Frost-Bite Willow + Ironroot Sentry completes in 25s sim time. Boss (The Grave-Warden) spawns at ~21s, dies. 3 total kills, 14 gold earned (including boss bonus), 0 plants lost, 5 HP damage. End state: VICTORY.

### Notes
- Zombie/boss stats follow the design doc exactly.
- Stubbed boss abilities (R5–R10) show their ability name on the boss banner but don't yet have combat effects. A future content pass can specialize each.
- The boss banner is visible from combat screen only; hidden elsewhere.

---

## v0.7.0 — 2026-04-10 — Phase 7: Combat Engine

### Added
- **`docs/js/game/combat.js`** — Full tick-based combat engine:
  - Hydrates runtime plant state from `run.deck` placements
  - Generates a spawn schedule via `zombies.js`
  - Per-frame tick: spawns, plant casts, zombie movement, death handling, end checks
  - Plant targeting: `first` / `strongest` / `weakest` priorities
  - Attack patterns: forward (Phase 7), cone (3-row), side (falls back to forward for now)
  - Plant–zombie melee: zombies block when adjacent, plants take damage on interval
  - Aether-Root damage when a zombie reaches col 0
  - Game-over / round-complete callbacks
  - Economy plants (Sunflower) generate gold on cast during combat
  - `healSurvivors()` restores plants to full HP between rounds
- **`docs/js/game/zombies.js`** — Generic zombie type + spawn schedule:
  - `zombieCountForRound` uses the planned [3, 6, 10, 15, 21, 28, 35, 42, 46, 50] progression
  - `makeZombieType` applies difficulty multipliers (enemyHPMul / enemyDmgMul)
  - `generateSpawnSchedule` round-robin rows, time-spread, sorted by spawn time
  - Phase 8 will replace the generic "Shambling Husk" with round-specific named types and boss fights
- **`docs/js/ui/combatView.js`** — Per-frame combat renderer:
  - Builds static grid DOM once per COMBAT enter
  - Places plant icons with HP bar overlays
  - Creates/updates/removes zombie elements via a Map-based diff (no full re-render per frame)
  - Absolute-positioned zombie sprites with `translate(col * tilePx, row * tilePx)`
  - Floating gold text drifts upward and fades
  - Plant attack flash (CSS class toggle on cast)
  - Zombie walk animation (CSS keyframes) + attacking state visuals
- **COMBAT state handler** in `main.js` now runs the engine:
  - enter → `initCombat` + `initCombatView` with callbacks for HUD sync, damage SFX, round complete, game over
  - update → `tickCombat(dt)`
  - render → `renderCombatFrame(state)`
  - exit → `resetCombat` + `resetCombatView`
- **Damage SFX on Aether-Root hit**, **gameover SFX** on defeat
- **CSS**: combat overlay, zombie sprites with walk/attack keyframes, plant HP bars, floating text drift animation, responsive mobile tile sizing

### Removed
- Debug "End Round" and "Take 10 Damage" buttons from combat screen — combat now ends rounds naturally via zombie depletion or Aether-Root death
- `damageAetherRoot` helper in main.js — combat engine handles damage directly

### Changed
- `endRound` no longer accumulates totals into `totalKills`/`totalGoldEarned`/`totalPlantsLost` — combat engine writes directly to those fields during the round so mid-round game-overs show accurate totals
- Phase badge advances to "Phase 7 — Combat". Version bumped to v0.7.0

### Fixed (Phase 6 audit follow-ups)
- Dead imports `GRID_ROWS`/`GRID_COLS` removed from `placement.js`
- Dead export `onGlobalEscape` removed from `placement.js`

### Verified
- Headless simulation of round 1 with 3 plants (Ironroot, Cinder-Fern, Sunflower) completes in 45s sim time: 3 zombies spawn, 1 killed by plant fire, 1 plant killed by melee, Aether-Root takes 10 damage, Sunflower produces 8 gold across 4 casts. End state: VICTORY.

### Notes
- Phase 7 uses a single generic "Shambling Husk" zombie. Phase 8 adds all 10 round-specific types and bosses with unique abilities.
- Status effects (slow, freeze, burn, stun, shields) are stubs — Phase 8 wires the plant ability descriptors into the combat pipeline.
- Attack patterns for side / diagonal / backward currently fall back to forward. Phase 8 will specialize them when the bosses and splash plants arrive.
- The combat view uses a Map-based DOM diff so only changing elements re-render per frame (60fps target).

---

## v0.6.0 — 2026-04-10 — Phase 6: Grid Placement

### Added
- **`docs/js/ui/placement.js`** — Full placement module:
  - Module-scoped selection state (`_selection`)
  - Click deck card → select for placement (highlight)
  - Click same deck card / press Escape / leave shop → deselect
  - Click empty grid tile while selected → place card, clear selection
  - Click placed grid card → opens a modal with:
    - Full stats + description
    - Targeting buttons (🎯 First / 💪 Strongest / 🩸 Weakest) — only for damage-dealing plants
    - Remove button (returns card to deck inventory)
    - Close button
  - **Sunflower → Gilded Rose auto-merge** when a 3rd Sunflower is placed. Removes all 3 sunflower instances, creates a fresh Gilded Rose instance at the anchor tile, plays `go` SFX + success toast.
  - Sell-pill button added to each deck card (separate from the main click-to-select handler).
- **Grid rendering upgrades** (`docs/js/game/grid.js` via placement module):
  - Placed cards are painted as small icons on their tiles
  - Valid-placement tiles get a dashed gold outline when in selection mode
  - Tile click callback delegates to placement logic
- **`renderGridCardIcon(card)`** helper in `cardView.js` — compact icon for in-tile rendering.
- **Deck inventory** now shows **only unplaced cards**. Placed cards are visible on their grid tiles instead. An empty deck shows a friendly "all cards placed" hint.
- **Escape key handler** on the SHOP state clears placement selection without leaving the screen.
- **SHOP.exit** lifecycle hook clears placement selection when leaving the shop (prevents stale selection on re-entry).

### Fixed (Phase 5 audit follow-ups)
- **Bug 1:** `startNewRun` now deep-copies `DEFAULT_RUN` so all schema fields (shopRoll, shopRollRound, aetherSpells, packsOpened) are initialized on fresh runs. Previously only Phase 3 fields were set; Phase 5 fields existed only by defensive init.
- **Bug 2:** `buyPack` no longer pre-flight-blocks when deck is full. Aether-Root spells routed to their own inventory always get saved. Regular cards that would overflow are dropped with a warning toast so the player knows to sell first.
- **Dead code:** Removed unused `added` tracker variable in `buyPack`.

### Changed
- `renderCard` gains `isSelected`, `isPlaced`, `onSell` options.
- `shop.renderShop()` no longer renders the deck inventory (moved to `placement.renderPlacement()`).
- Phase badge advances to "Phase 6 — Placement". Version bumped to v0.6.0.

### Notes
- Sunflower merge picks the most recently placed Sunflower as the anchor (where the Gilded Rose appears). The other two Sunflower tiles become empty.
- Drag-and-drop placement was deferred — click-to-place covers both mobile and desktop cleanly.
- Targeting is only editable via the placed-card modal (per-card, post-placement). The spec suggested pre-placement targeting; this approach feels more natural and matches card-game patterns.

---

## v0.5.0 — 2026-04-10 — Phase 5: Shop Mode

### Added
- **Full shop UI** with three rarity-colored card slots, refresh button (1 gold), pack chests, and deck inventory.
- **`docs/js/ui/cardView.js`** — Reusable card renderer used by shop slots, deck inventory, and pack reveals. Renders rarity stripe, name, type, stats, description, and footer (cost or sell value).
- **`docs/js/ui/shop.js`** — Full shop logic module:
  - `rerollShop`, `refreshShop`, `ensureShopRollForRound` — shop roll lifecycle
  - `buyShopSlot` — gold check, deck-cap check, atomic buy
  - `sellDeckCard` — confirms via modal, refunds gold
  - `buyPack` — pity-aware pack opening, distributes regular cards to deck and Aether-Root spells to side panel inventory
  - `renderShop` — full UI repaint
- **Pack chests** with rarity-tinted backgrounds. Frenzy chest shimmers. Each chest shows current pity status ("Pity in N").
- **Pack reveal modal** — staggered fade-in of revealed cards with rarity-colored borders. Legendary cards glow gold.
- **Deck inventory** — compact card view, tap to sell with confirmation. Shows current count "X / 10".
- **Free auto-reroll** at the start of each new round (tracked via `shopRollRound`). The paid Refresh button still works mid-round.
- **Card-instance system** — Each owned card has a unique `instanceId` and a deterministic `sellValue` rolled at acquisition (no save-scumming).
- **Aether-Root spell side inventory** (`run.aetherSpells`) — Aether-Root spells from packs go here instead of the regular deck. Phase 9 wires the side panel.
- **`bodyHtml` + `wide` options on showModal** — supports the rich pack reveal layout.
- **CSS** — `.card.*` rarity tinting, `.pack-chest-*` chest variants, `.deck-inventory` grid, `.reveal-grid` modal layout, `.screen-scrollable` for the now-vertical shop screen.

### Fixed (Phase 4 audit follow-ups)
- **Validator scope:** Now also enforces a valid `pack` field for `economy` category cards (Crystal Fern, Amber Grain, Midas Mandrake) when they ship in packs.
- **Validator coverage:** "missing rarity in pack" warning now considers AETHER_ROOT_SPELLS as part of the pack pool, preventing false positives for packs that rely on side-panel spells for some rarity tier.

### Changed
- `currentRun` schema additions: `shopRoll`, `shopRollRound`, `aetherSpells`, `packsOpened` (already existed but now actually used).
- Shop screen is now `screen-scrollable` (allows vertical content beyond viewport).
- Phase badge advances to "Phase 5 — Shop Mode".
- Version label bumped to v0.5.0.

### Notes
- Pack reveal animation is currently a modal. Phase 12 may upgrade it to a full-screen chest-opening sequence.
- Deck cards are not yet placeable on the grid — that's Phase 6.
- Sunflower auto-merge into Gilded Rose is also Phase 6 (placement-time logic).

---

## v0.4.0 — 2026-04-10 — Phase 4: Card Data Model

### Added
- **39 cards** defined as data, ready for the Phase 5 shop to consume:
  - **14 standard cards**: 6 plants (Seedling Scrubber → Solar Archon), 6 spells (Barkskin Guard → Solar Flare), 2 standard economy plants (Sunflower, Gilded Rose)
  - **19 pack-exclusive cards**: 6 Mythic, 7 Arcane, 6 Frenzy — including pack-tier economy plants (Amber Grain, Crystal Fern, Midas Mandrake)
  - **6 Aether-Root spells**: Sap-Mend, Grove-Shield, Thorn-Pulse, Photosynthetic Burst, Nature's Wrath, Verdant Rebirth
- **`docs/js/cards/rarities.js`** — 6 rarity tiers with colors, drop weights, cost/sell ranges
- **`docs/js/cards/packs.js`** — 3 pack tiers with cost, card count, drop weights, pity rules
- **`docs/js/cards/standard.js`** — Standard shop pool (14 cards)
- **`docs/js/cards/packExclusives.js`** — All Mythic/Arcane/Frenzy cards (19 cards)
- **`docs/js/cards/aetherRoot.js`** — 6 player-active side-panel spells
- **`docs/js/cards/validate.js`** — Sanity-checks at boot (duplicate IDs, missing fields, invalid rarity/category, pack weight sums, missing legendaries for pity)
- **`docs/js/cards/index.js`** — Public API:
  - Query: `getCard(id)`, `getCardsByRarity(r)`, `getCardsByCategory(c)`, `getCardsByPack(p)`, `getShopEligibleCards()`, `getAetherRootSpells()`
  - Random: `rollShopCard()`, `rollShopCards(n)`, `rollPackCards(packId, pityState)`, `rollCost(card)`, `rollSell(card)`
  - Format: `formatCardStats(card)`, `formatCardLabel(card)`
  - Pity: Frenzy pack guarantees one Epic+; every 5th Frenzy guarantees a Legendary

### Validated
- 1000 sample shop rolls match configured rarity weights within ~1.5%
- Frenzy pack pity reliably drops a Legendary on the 5th open
- Every Frenzy pack contains at least one Epic+ card
- All 39 cards have unique IDs, valid rarities, and complete required fields

### Changed
- Phase badge advances to "Phase 4 — Card Data"
- Version label bumped to v0.4.0
- `window.__pvz` debug object now exposes the entire `Cards` namespace

### Notes
- Pack-exclusive cards have `cost: null` since they're never directly purchasable from the regular shop
- Aether-Root spells use `cooldown` (or `oncePerRound`) instead of cost since they're cast for free during combat
- Card abilities are stored as semi-structured descriptors (e.g., `{ type: 'slow_on_hit', percent: 0.5, duration: 2.0 }`) for the Phase 7 combat engine to interpret

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
