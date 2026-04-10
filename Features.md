# Features

A living document tracking every feature planned for **Plants vs Zombies: Card Battler**.
Status legend: `[ ]` Planned · `[~]` In Progress · `[x]` Implemented

---

## 1. Core Game Systems

### 1.1 Main Menu
- [x] Animated title screen (gradient shimmer + bob)
- [x] **Start Game** button (pulsing animation)
- [x] **Resume Game** button (visible when save exists)
- [x] **Settings** button
- [x] **Leaderboard** button (gated by endless unlock)
- [ ] Background music (Phase 12)
- [x] Click sound effects (synthesized)
- [ ] Hover sound effects (preset exists, not yet wired)

### 1.2 Settings
- [x] Save Game (saves everything: deck, gold, round, unlocks, leaderboard)
- [x] Load Game (Resume Game on menu)
- [x] Dark Mode toggle
- [x] Light Mode toggle
- [x] Reset Game (with confirmation modal)
- [x] Music On/Off toggle (wired to AudioManager; tracks land Phase 12)
- [x] Sounds On/Off toggle (synthesized SFX active)
- [x] Volume sliders (music & sfx, live updates)
- [x] In-game pause / settings access
- [x] Quit Run button (only when in-run)

### 1.3 Difficulty Selection
- [x] Difficulty selection screen UI
- [~] **Tutorial Mode** — selectable; tooltip system in Phase 10
- [x] **Easy Mode** — Reduced enemies, buffed player, 10 starting gold (config done)
- [x] **Normal Mode** — Baseline (100 HP, 5 gold) (config done)
- [x] **Hard Mode** — 200% enemy HP, 150% damage, 50 player HP, 3 gold (config done)
- [x] **Insane Mode** — 350% enemy HP, 300% damage, 25 player HP, 1 gold (config done)
- [x] **Endless Mode** — Locked until Round 10 boss kill; appears under Insane (locked-state working)

### 1.4 Round Flow
- [x] Shop Mode → Countdown → Combat → Round End loop
- [x] Countdown only between shop→combat (never on shop entry)
- [x] Animated 5-second countdown (small → zoom-in → fade)
- [x] Round counter UI ("Round X / 10" or "Round X" for endless)
- [x] HP color coding (red/amber thresholds)
- [x] Round-end summary screen (gold earned, kills, plants lost, HP, total gold)
- [x] Game-over screen with run totals (kills, gold, plants, difficulty, round)
- [x] Round 10 victory stub (unlocks Endless)

---

## 2. Shop Mode

### 2.1 Card Shop
- [x] Three randomized cards displayed per shop visit
- [x] Mix of Plants and Spells based on rarity weights
- [x] Card details inline on each card (name, stats, description)
- [ ] Long-hold for expanded detail panel (Phase 12 polish)
- [x] Tap to purchase / add to deck
- [x] **Refresh button** (1 gold) — rerolls the three cards
- [x] Sell card option (returns rarity-based gold) with confirmation
- [x] Maximum 10 cards in active deck (enforced, error toast)
- [x] Free auto-reroll at start of each round

### 2.2 Card Pack Shop
- [x] **Mythic Chest** (20 gold) — green tinted
- [x] **Arcane Chest** (30 gold) — purple tinted
- [x] **Frenzy Chest** (50 gold) — gold shimmer animation
- [x] Pack opening animation (modal reveal with staggered fade-in)
- [x] Pity tracker for Frenzy packs (every 5th = guaranteed Legendary)
- [x] Frenzy guaranteed-Epic logic
- [x] Pack-exclusive card pool isolation
- [x] Aether-Root spells from packs go to separate inventory

### 2.3 Grid Placement
- [x] 5×12 grid renderer
- [ ] Drag-and-drop card placement (deferred — click-to-place covers both)
- [x] Tap-to-select then tap-to-place
- [x] Highlight valid placement tiles
- [x] Aether-Root pinned to far-left column
- [x] Per-card targeting buttons (First / Strongest / Weakest) via modal
- [x] Move/remove placed cards before countdown (via placed-card modal)
- [x] Confirm placement button → starts countdown (existing "Start Round" flow)
- [x] Auto-merge 3 Sunflowers → Gilded Rose

---

## 3. Combat System

### 3.1 Auto-Combat Engine
- [x] Plant cast timer system (base 2.0s, uses `card.castTime`)
- [~] Per-card attack patterns — forward + cone live; side/diagonal/backward fall back to forward in Phase 7
- [x] Multiple plants can focus-fire one zombie
- [x] Targeting priority logic (First / Strongest / Weakest)
- [x] Plant death removal (combat state + deck placement)
- [x] Health bars for plants (green/yellow threshold)
- [ ] Shield bars (blue) — deferred to Phase 8 with status effects

### 3.2 Zombie System
- [x] Wave spawner with scaling formulas (HP = 10 + round×10; DMG = 2 + round×3)
- [x] Sub-wave logic (time-spread spawning window)
- [x] Round-by-round zombie roster — 10 named types (Shambling Husk → Abyssal Revenant)
- [x] Boss spawn after wave completion (all 10 bosses)
- [x] Frenzy buff for remaining zombies during boss phase (+10% speed)
- [x] Boss visual scaling (1.5×–2×)
- [x] Boss banner UI with HP, name, ability
- [x] Zombie attack animations (CSS walk + attack keyframes)
- [x] Gold drop popup on zombie death
- [x] Zombie armor (Plague-Knight, Fallen Paladin, Bone-Grit Colossus, Abyssal Revenant)

### 3.3 Aether-Root (Mother Plant)
- [x] HP scales by difficulty
- [x] Damage taken when zombies reach left edge
- [x] Death = Game Over
- [x] Health UI prominently displayed (HUD with color thresholds)

### 3.4 Side-Panel Spells (Player Active)
- [x] **Sap-Mend** — Heal 10 HP (15s cooldown)
- [x] **Grove-Shield** — 25 HP shield (30s cooldown)
- [x] **Thorn-Pulse** — Knockback 2 tiles (45s cooldown)
- [x] **Photosynthetic Burst** — +5 gold, -5 HP (60s cooldown)
- [x] **Nature's Wrath** — 5s center-lane 50 dps beam (90s cooldown)
- [x] **Verdant Rebirth** — Full heal + 50 shield (1/round)
- [x] Visual cooldown overlay with seconds countdown
- [x] Aether-Root shield bar (blue) in side panel

---

## 4. Card Roster

### 4.1 Standard Plants
- [x] **Seedling Scrubber** (Trash) — 5H/1D
- [x] **Ironroot Sentry** (Common) — 15H/5D
- [x] **Cinder-Fern** (Uncommon) — 25H/10D
- [x] **Frost-Bite Willow** (Rare) — 50H/25D, slow effect
- [x] **Void-Petal Bloom** (Epic) — 120H/60D, splash damage
- [x] **Solar Archon** (Legendary) — 300H/150D, beam + heal aura

### 4.2 Standard Spells
- [x] **Barkskin Guard** — Shield = 50% Max HP
- [x] **Aether Bloom** — -0.5s cast time for 10s
- [x] **Wild Growth** — Permanent +20 HP
- [x] **Nectar Rush** — +15 DMG for round
- [x] **Magic Mushroom** — Evolve to next rarity tier
- [x] **Solar Flare** — 50 dmg to all zombies in lane

### 4.3 Mythic Pack Exclusives
- [x] **Bramble-Whip Vine** (Common) — Slow on hit
- [x] **Glimmer-Spore** (Uncommon) — Reveal invisibles
- [x] **Stone-Root Bulwark** (Rare) — Reflect 10%
- [x] **Spore-Burst** (Spell, Common) — 3x3 cloud, 5 dmg
- [x] **Nature's Bounty** (Spell) — +10 gold
- [x] **Amber Grain** (Common Economy) — +1 gold per lane kill

### 4.4 Arcane Pack Exclusives
- [x] **Storm-Caster Orchid** (Uncommon) — Chain lightning
- [x] **Frost-Thistle** (Rare) — 5% stun chance
- [x] **Elder Oak Aegis** (Epic) — Rear shield aura
- [x] **Arcane Surge** (Spell, Rare) — Double damage 5s
- [x] **Chrono-Bloom** (Spell) — Reset lane cooldowns 5s
- [x] **Crystal Fern** (Rare Economy) — +5 gold + self-shield
- [x] **Synthesis** (Spell) — Merge 3 same-name plants

### 4.5 Frenzy Pack Exclusives
- [x] **Magma-Core Calla** (Rare) — Fire DOT trail
- [x] **Void-Reaper Lily** (Epic) — Execute <15% HP
- [x] **Dragon-Breath Snapdragon** (Legendary) — 3-lane cone
- [x] **World-Tree Seed** (Spell, Legendary) — Full heal + 50 shield all plants
- [x] **Mycelium Network** (Spell) — Link 3 plants, share HP, +20% dmg
- [x] **Midas Mandrake** (Legendary Economy) — Gold = round number per kill

### 4.6 Economy Plants
- [x] **Sunflower** (Uncommon) — 2 gold / 10s
- [x] **Gilded Rose** (Epic) — Auto-evolve from 3 Sunflowers; 30 gold / 25s
- [ ] Auto-merge logic when 3 Sunflowers placed (Phase 6 placement work)

---

## 5. Zombies & Bosses

### 5.1 Standard Zombies (Rounds 1–10)
- [x] Round 1: Shambling Husk × 3
- [x] Round 2: Rotted Squire × 6
- [x] Round 3: Grave-Bound Wight × 10
- [x] Round 4: Blighted Archer × 15
- [x] Round 5: Plague-Knight × 21 (armor 2)
- [x] Round 6: Crypt Ghoul × 28 (faster)
- [x] Round 7: Fallen Paladin × 35 (armor 3)
- [x] Round 8: Bone-Grit Colossus × 42 (armor 5, slow)
- [x] Round 9: Lich Apprentice × 46 (faster)
- [x] Round 10: Abyssal Revenant × 50 (armor 4)
- [x] HP formula: 10 + (Round × 10)
- [x] DMG formula: 2 + (Round × 3)

### 5.2 Bosses
- [x] **The Grave-Warden** (R1) — Heavy Thump (2× damage every 3rd attack)
- [x] **Rot-Hoof Centaur** (R2) — Trample (+20% speed baked in)
- [x] **Cursed Harvester** (R3) — Soul Reap (+5 HP per plant kill)
- [x] **Iron-Bound Ogre** (R4) — Armor Plating (-3 damage taken, floor 1)
- [~] **The Blight-Widow** (R5) — Venom Spit (declared, stub)
- [~] **Frost-Lich Overseer** (R6) — Freezing Aura (declared, stub)
- [~] **Infernal Juggernaut** (R7) — Burn-Step DOT (declared, stub)
- [~] **Shadow-Stalker Wraith** (R8) — Phase Shift invuln (declared, stub)
- [~] **Necro-Dragon Fledgling** (R9) — Blight Breath (declared, stub)
- [~] **The Arch-Lich Malakor** (R10) — Death's Call resurrection (declared, stub; killing still unlocks Endless)
- [x] Boss HP = 3× round avg (hardcoded per boss)
- [x] Boss DMG = 2× round avg (hardcoded per boss)
- [x] Boss visual scaling 1.5×–2×
- [ ] Boss-phase music swap (Phase 12)
- [x] Frenzy buff to remaining zombies (+10% speed on boss spawn)

---

## 6. Endless Mode

- [x] Unlock trigger: defeat Arch-Lich Malakor
- [x] Achievement banner on unlock (Victory screen)
- [x] Difficulty menu insertion (below Insane, already in config)
- [x] Infinite round scaling (count + HP/DMG formulas extend past round 10)
- [x] Mixed wave composition (Easy + Mid armored + Hard armored zombies per round)
- [ ] Round counter persistence
- [ ] Death → submit to leaderboard

## 7. Leaderboard

- [x] Local leaderboard (localStorage, max 50 entries)
- [x] Top rounds reached (primary sort)
- [x] Player name entry (game-over + victory screens, pre-filled from last name)
- [x] Difficulty filter (dropdown on the leaderboard screen)
- [x] Date stamp (stored; not currently rendered — space for future)
- [x] Victory marker (🏆 on entries that beat Round 10)
- [ ] Future: global leaderboard backend (TBD)

---

## 8. UI / UX

### 8.1 Visuals
- [ ] Card frame visuals per rarity
- [ ] Animated Legendary border (gold + red shine)
- [ ] Plant sprites
- [ ] Zombie sprites
- [ ] Boss sprites (1.5×–2× scale)
- [ ] Gold popup floating text
- [ ] Damage numbers
- [ ] Status effect icons (slow, burn, freeze, shield)
- [ ] Grid tile highlighting
- [ ] Card hover/long-press detail panel

### 8.2 Audio
- [ ] Background music (menu)
- [ ] Background music (combat)
- [ ] Boss music swap
- [ ] Card purchase SFX
- [ ] Pack opening SFX
- [ ] Plant attack SFX
- [ ] Zombie death SFX
- [ ] Spell cast SFX
- [ ] Countdown tick SFX
- [ ] Victory / defeat stings

### 8.3 Tutorial Popups
- [x] First shop visit
- [x] First card purchase
- [x] First grid placement
- [x] First countdown
- [x] First zombie kill
- [x] First Aether-Root spell
- [x] First card pack
- [x] First boss
- [x] First plant death
- [x] Auto-dismiss after 12s
- [x] Tutorial-only (no-op on other difficulties)

---

## 9. Persistence

- [x] localStorage save format (`pvz:settings`, `pvz:run`, `pvz:meta`)
- [x] Auto-save every round end (skeleton)
- [x] Manual save via Settings
- [ ] Save migration logic for future updates
- [x] Reset game wipes all keys

---

## 10. Future / Stretch

- [ ] Mobile-responsive layout
- [ ] Touch controls
- [ ] Cloud save sync
- [ ] Global leaderboard
- [ ] Daily challenges
- [ ] Cosmetic skins
- [ ] Card crafting
- [ ] PvP wave-trading
- [ ] Achievements panel
- [ ] Statistics page (lifetime kills, gold spent, etc.)
