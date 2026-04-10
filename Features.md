# Features

A living document tracking every feature planned for **Plants vs Zombies: Card Battler**.
Status legend: `[ ]` Planned · `[~]` In Progress · `[x]` Implemented

---

## 1. Core Game Systems

### 1.1 Main Menu
- [~] Animated title screen — basic title, no animation yet
- [x] **Start Game** button
- [x] **Settings** button
- [~] **Leaderboard** button (visible after Endless unlock) — present but locked
- [ ] Background music
- [ ] Hover/click sound effects

### 1.2 Settings
- [~] Save Game (saves everything: deck, gold, round, unlocks, leaderboard) — skeleton in place
- [~] Load Game — skeleton in place
- [x] Dark Mode toggle
- [x] Light Mode toggle
- [~] Reset Game (with confirmation) — basic version live
- [~] Music On/Off toggle — UI only, no audio yet
- [~] Sounds On/Off toggle — UI only, no audio yet
- [ ] Volume sliders (music & sfx)

### 1.3 Difficulty Selection
- [x] Difficulty selection screen UI
- [~] **Tutorial Mode** — selectable; tooltip system in Phase 10
- [x] **Easy Mode** — Reduced enemies, buffed player, 10 starting gold (config done)
- [x] **Normal Mode** — Baseline (100 HP, 5 gold) (config done)
- [x] **Hard Mode** — 200% enemy HP, 150% damage, 50 player HP, 3 gold (config done)
- [x] **Insane Mode** — 350% enemy HP, 300% damage, 25 player HP, 1 gold (config done)
- [x] **Endless Mode** — Locked until Round 10 boss kill; appears under Insane (locked-state working)

### 1.4 Round Flow
- [x] Shop Mode → Countdown → Combat → Round End loop (skeleton)
- [ ] First-ever shop has no countdown
- [x] Animated 5-second countdown (small → zoom-in → fade)
- [x] Round counter UI
- [ ] Round-end summary (gold earned, kills, plants lost)

---

## 2. Shop Mode

### 2.1 Card Shop
- [ ] Three randomized cards displayed per shop visit
- [ ] Mix of Plants and Spells based on rarity weights
- [ ] Long-hold / long-tap to reveal card details
- [ ] Tap to purchase / add to deck
- [ ] **Refresh button** (1 gold) — rerolls the three cards
- [ ] Sell card option (returns rarity-based gold)
- [ ] Maximum 10 cards in active deck

### 2.2 Card Pack Shop
- [ ] **Mythic Chest** (20 gold) — big & shiny
- [ ] **Arcane Chest** (30 gold) — bigger, shinier, animated
- [ ] **Frenzy Chest** (50 gold) — ultimate animation
- [ ] Pack opening animation
- [ ] Pity tracker for Frenzy packs (every 5th = guaranteed Legendary)
- [ ] Frenzy guaranteed-Epic logic
- [ ] Pack-exclusive card pool isolation

### 2.3 Grid Placement
- [ ] 5×12 grid renderer
- [ ] Drag-and-drop card placement
- [ ] Tap-to-select then tap-to-place
- [ ] Highlight valid placement tiles
- [ ] Aether-Root pinned to far-left column
- [ ] Per-card targeting dropdown (First / Strongest / Weakest)
- [ ] Move/remove placed cards before countdown
- [ ] Confirm placement button → starts countdown

---

## 3. Combat System

### 3.1 Auto-Combat Engine
- [ ] Plant cast timer system (base 2.0s)
- [ ] Per-card attack patterns (forward / backward / side / diagonal)
- [ ] Multiple plants can focus-fire one zombie
- [ ] Targeting priority logic (First / Strongest / Weakest)
- [ ] Plant death removal
- [ ] Health bars for plants (green) + shield bars (blue)

### 3.2 Zombie System
- [ ] Wave spawner with scaling formulas
- [ ] Sub-wave logic (e.g., 5 zombies every 10s on later rounds)
- [ ] Round-by-round zombie roster (Rounds 1–10)
- [ ] Boss spawn after wave completion
- [ ] Frenzy buff for remaining zombies during boss phase
- [ ] Zombie attack animations
- [ ] Gold drop popup on zombie death

### 3.3 Aether-Root (Mother Plant)
- [ ] HP scales by difficulty
- [ ] Damage taken when zombies reach left edge
- [ ] Death = Game Over
- [ ] Health UI prominently displayed

### 3.4 Side-Panel Spells (Player Active)
- [ ] **Sap-Mend** — Heal 10 HP (15s cooldown)
- [ ] **Grove-Shield** — 25 HP shield (30s cooldown)
- [ ] **Thorn-Pulse** — Knockback 2 tiles (45s cooldown)
- [ ] **Photosynthetic Burst** — +5 gold, -5 HP (60s cooldown)
- [ ] **Verdant Rebirth** — Full heal + 50 shield (1/round)
- [ ] **Nature's Wrath** — Center-lane beam, 5s (90s cooldown)
- [ ] Visual cooldown indicators

---

## 4. Card Roster

### 4.1 Standard Plants
- [ ] **Seedling Scrubber** (Trash) — 5H/1D
- [ ] **Ironroot Sentry** (Common) — 15H/5D
- [ ] **Cinder-Fern** (Uncommon) — 25H/10D
- [ ] **Frost-Bite Willow** (Rare) — 50H/25D, slow effect
- [ ] **Void-Petal Bloom** (Epic) — 120H/60D, splash damage
- [ ] **Solar Archon** (Legendary) — 300H/150D, beam + heal aura

### 4.2 Standard Spells
- [ ] **Barkskin Guard** — Shield = 50% Max HP
- [ ] **Aether Bloom** — -0.5s cast time for 10s
- [ ] **Wild Growth** — Permanent +20 HP
- [ ] **Nectar Rush** — +15 DMG for round
- [ ] **Magic Mushroom** — Evolve to next rarity tier
- [ ] **Solar Flare** — 50 dmg to all zombies in lane

### 4.3 Mythic Pack Exclusives
- [ ] **Bramble-Whip Vine** (Common) — Slow on hit
- [ ] **Glimmer-Spore** (Uncommon) — Reveal invisibles
- [ ] **Stone-Root Bulwark** (Rare) — Reflect 10%
- [ ] **Spore-Burst** (Spell, Common) — 3x3 cloud, 5 dmg
- [ ] **Nature's Bounty** (Spell) — +10 gold
- [ ] **Amber Grain** (Common Economy) — +1 gold per lane kill

### 4.4 Arcane Pack Exclusives
- [ ] **Storm-Caster Orchid** (Uncommon) — Chain lightning
- [ ] **Frost-Thistle** (Rare) — 5% stun chance
- [ ] **Elder Oak Aegis** (Epic) — Rear shield aura
- [ ] **Arcane Surge** (Spell, Rare) — Double damage 5s
- [ ] **Chrono-Bloom** (Spell) — Reset lane cooldowns 5s
- [ ] **Crystal Fern** (Rare Economy) — +5 gold + self-shield
- [ ] **Synthesis** (Spell) — Merge 3 same-name plants

### 4.5 Frenzy Pack Exclusives
- [ ] **Magma-Core Calla** (Rare) — Fire DOT trail
- [ ] **Void-Reaper Lily** (Epic) — Execute <15% HP
- [ ] **Dragon-Breath Snapdragon** (Legendary) — 3-lane cone
- [ ] **World-Tree Seed** (Spell, Legendary) — Full heal + 50 shield all plants
- [ ] **Mycelium Network** (Spell) — Link 3 plants, share HP, +20% dmg
- [ ] **Midas Mandrake** (Legendary Economy) — Gold = round number per kill

### 4.6 Economy Plants
- [ ] **Sunflower** (Uncommon) — 2 gold / 10s
- [ ] **Gilded Rose** (Epic) — Auto-evolve from 3 Sunflowers; 30 gold / 25s
- [ ] Auto-merge logic when 3 Sunflowers placed

---

## 5. Zombies & Bosses

### 5.1 Standard Zombies (Rounds 1–10)
- [ ] Round 1: Shambling Husk × 3
- [ ] Round 2: Rotted Squire × 6
- [ ] Round 3: Grave-Bound Wight × 10
- [ ] Round 4: Blighted Archer × 15
- [ ] Round 5: Plague-Knight × 21
- [ ] Round 6: Crypt Ghoul × 28
- [ ] Round 7: Fallen Paladin × 35
- [ ] Round 8: Bone-Grit Colossus × 42
- [ ] Round 9: Lich Apprentice × 46
- [ ] Round 10: Abyssal Revenant × 50
- [ ] HP formula: 10 + (Round × 10)
- [ ] DMG formula: 2 + (Round × 3)

### 5.2 Bosses
- [ ] **The Grave-Warden** (R1) — Heavy Thump
- [ ] **Rot-Hoof Centaur** (R2) — Trample (+20% speed)
- [ ] **Cursed Harvester** (R3) — Soul Reap (+5 HP per kill)
- [ ] **Iron-Bound Ogre** (R4) — Armor Plating (-3 dmg taken)
- [ ] **The Blight-Widow** (R5) — Venom Spit (slow attacks)
- [ ] **Frost-Lich Overseer** (R6) — Freezing Aura
- [ ] **Infernal Juggernaut** (R7) — Burn-Step DOT
- [ ] **Shadow-Stalker Wraith** (R8) — Phase Shift invuln
- [ ] **Necro-Dragon Fledgling** (R9) — Blight Breath (3-row hit)
- [ ] **The Arch-Lich Malakor** (R10) — Death's Call resurrection
- [ ] Boss HP = 3× round avg
- [ ] Boss DMG = 2× round avg
- [ ] Boss visual scaling 1.5×–2×
- [ ] Boss-phase music swap
- [ ] Frenzy buff to remaining zombies

---

## 6. Endless Mode

- [ ] Unlock trigger: defeat Arch-Lich Malakor
- [ ] Achievement popup on unlock
- [ ] Difficulty menu insertion (below Insane)
- [ ] Infinite round scaling
- [ ] Mixed wave composition (Easy + Insane zombies cycled)
- [ ] Round counter persistence
- [ ] Death → submit to leaderboard

## 7. Leaderboard

- [ ] Local leaderboard (localStorage)
- [ ] Top rounds reached
- [ ] Player name entry
- [ ] Difficulty filter
- [ ] Date stamp
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
- [ ] First shop visit
- [ ] First card purchase
- [ ] First grid placement
- [ ] First countdown
- [ ] First zombie kill
- [ ] First Aether-Root spell
- [ ] First card pack
- [ ] First boss
- [ ] First plant death

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
