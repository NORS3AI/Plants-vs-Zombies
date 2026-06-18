# Patch Notes

All notable changes to **Plants vs Zombies: Card Battler** are documented here.
Format: `Version — Date — Summary`

---

## v1.1.9c — 2026-04-12 — Larger battlefield, drag-to-move, sell returns spells

### Added
- **Drag-to-move plants in combat** — press and hold a plant, drag it to any empty tile, release to drop. A green ghost follows the pointer, valid tiles light up, the source tile glows yellow. Short taps still open the plant details modal. Replaces the old click-to-select / click-to-move pattern.
- **Selling a buffed plant returns its spells** — when selling a plant that has buff spells on it, every tagged spell is returned as a fresh copy to the Spell Deck. A toast shows how many spells were returned. You no longer lose your spell investment when selling a buffed plant.

### Changed
- **Larger combat battlefield** — desktop tiles bumped 56→64 px, tablets 44→50 px, phones 40→44 px. The combat container has `overflow: hidden` and the grid wrapper caps its width so horizontal scroll never appears.

### v1.1.9b (same day)
- Drag-to-move implementation with pointer events + ghost element.

---

## v1.1.9a — 2026-04-12 — Replay Round, skip countdown, collapsible shop sections

### Added
- **Replay Round button** — after completing a round, a new "↻ Replay Round" button appears alongside "Next Round →". Tapping it rolls the round counter back by 1 and returns to the shop so the player can stay on the same round as long as they want.
- **Skip Countdown setting** — new checkbox in Settings. When on, pressing Start Round skips the 3-second countdown and jumps straight to combat.
- **Collapsible shop sections** — Shop, Card Packs, Aether-Root Spells, Plant Deck, and Spell Deck each have a ▾ toggle arrow in their header. Tap it to collapse/expand the section. Collapses with a CSS transition.
- **Refresh button hidden on Round 1** — since the starter shop is free and predetermined, the "↻ Refresh (1g)" button is hidden until Round 2.

### Changed
- **Defeat is game-over again** — the v1.1.9 retry-on-defeat was reverted. When the Aether-Root falls, the run ends as intended. Use the "Replay Round" button on successful rounds to farm and prepare instead.

---

## v1.1.9 — 2026-04-12 — Retry on defeat, round-1 starter, Void Lily attackAll

### Added
- **Retry on defeat** — when the Aether-Root falls, the player is sent back to the shop instead of the game-over screen. HP is restored to full, shield cleared, and the round number stays the same. Rearrange your deck, buy more cards, and try the same round again. No more permadeath on a bad round.
- **Round-1 starter shop** — on the very first shop visit, the shop offers exactly two free cards: **Ironroot Sentry** (cost 0) and **Wild Growth** (cost 0), with a toast telling the player to grab them. After round 1 completes (or on retry), the normal shop randomizer takes over. This prevents the "impossible round 1" problem on all difficulties.
- **Void Lily `attackAll`** — the Void Lily now hits **every valid zombie simultaneously** each 0.1 s cast via a new `attackAll` card flag. combat.js gains `findAllTargets(plant)` which returns the full candidate array instead of the best single target. Every ability (beam, splash, chain, cone, execute, slow, stun, fire trail) fires on each zombie per cast. One Void Lily truly solo-clears the board.

### v1.1.8a (same day)
- **Crimson Mandrake** (artifact) — 3 Bloody Mandrakes → `330 HP / 180 DMG / 2.2 s / 9 range`, gold per kill scales with round. Limit 1.
- **Mythril Dragon** (artifact) — 3 Runite Dragons → `200 HP / 200 DMG / 2.2 s / 9 range`, cone damage. Limit 1.
- **Fusion Log scrollable** — modal uses `max-height: 60vh` + `overflow-y: auto`.

---

## v1.1.8 — 2026-04-12 — Per-card legendary limits

### Changed
- **7 specific legendaries now capped at 3 copies each** via `deckLimit: 3`:
  - Bloody Mandrake, Runite Dragon, Dragon-Breath Snapdragon, Magma Calladara, Midas Mandrake, Solae, Void Lily.
  - Any copies beyond 3 of the same card are auto-sold for their gold value.
- **Global legendary cap removed** — the old "max 3 legendary total across all types" rule is replaced by per-card `deckLimit` values. Legendaries without a `deckLimit` are uncapped. This lets the player hold multiple different legendaries while still capping the 7 cards listed above.
- Lily Weeds remain fully exempt from all limits.

---

## v1.1.7 — 2026-04-12 — Artifact spell fusions, legendary cap, Void rarity

### Added
- **Mycelium Tower** (artifact spell) — 5 Mycelium Networks fuse into the Tower. **Permanently** grants all placed plants **+100% damage** and **+100 HP**. Only 1 allowed in the Spell Deck; extras auto-sell for 1000 gold.
- **World-Tree** (artifact spell) — 5 World-Tree Seeds fuse into the artifact version. Fully heals all plants and adds a **+500 Shield** to each. Only 1 allowed; extras auto-sell for 1000 gold.
- **Spell Deck merges** — `checkDeckMerges` now also scans `run.spellDeck` for spell evolution chains. When 5 copies of an evolving spell accumulate, they auto-fuse into the artifact version.
- **Spell Deck limits** — new `enforceSpellDeckLimits`: artifact spells with `deckLimit` are capped. Excess copies auto-sell.
- **Crimson Lily** (artifact) — 7 Blue Lilies → 5000 HP / 10000 DMG / 0.1s / omni 3-range / every ability. Limit 2 in deck.
- **Void Lily** (void rarity) — 2 Crimson Lilies → 100k HP / 1M DMG / 0.1s / omni 12-range / 100k gold per cast / every ability. Limit 1. Blue/purple shimmer with fading star particles.
- **Void rarity** — tier 7 above Artifact. Purple (#7c3aed) shimmer with `✦ ✧ ✦` star animation.

### Changed
- **Legendary cap: 3** — max 3 legendary plants in the Plant Deck. Extras auto-sold.
- **Artifact limits** use per-card `deckLimit` (default 1). Crimson Lily overrides to 2.
- `autoSellDuplicateArtifacts` replaced by `enforceRarityLimits` which handles legendary, artifact, and void caps in one pass. Lily Weeds always exempt.

### Full Lily chain
Lily Weed × 5 → Blue Lily × 7 → Crimson Lily × 2 → Void Lily

76 cards, validator clean.

---

## v1.1.6 — 2026-04-12 — Toast log panel, pack buy multiplier, settings scroll fix

### Added
- **Pack buy multiplier** — ×1 / ×5 / ×10 / All buttons above the Card Packs section. ×5 costs 5× the pack price and opens 5 packs in one burst (each rolled independently with pity tracking). ×10 does the same at 10×. "All" calculates `floor(gold / cost)` and opens that many, draining gold to the remainder. One combined reveal modal shows all cards.

### Changed
- **Toasts moved to a log panel** — messages now stack in a small scrollable panel pinned to the bottom-left instead of floating over the game grid. Toasts stay visible for 5 seconds, then fade out over 2 seconds. The panel auto-scrolls to the latest message and hides when empty. This stops toast messages from covering the grid and blocking plant moves during combat.
- **Lily Weed description simplified** — removed the fusion hint about Blue Lily and the 1% Frenzy drop rate from the card text. Discovery is part of the fun.
- **Default toast color is now blue** (info/updates). Red is reserved for errors only.

### Fixed
- **Settings page can now scroll to the Back button** — added `overflow-y: auto` and extra bottom padding to the settings screen so the Back button is always reachable on small phones.
- **Artifact gold button** now stacks directly above the regular gold button (`right: 20px, bottom: 78px`). Merge-log button pushed up to `bottom: 136px` to make room.

---

## v1.1.5 — 2026-04-12 — Sell by rarity, skip-sell setting, artifact limits, QoL

### Added
- **Disable Sell Popup** setting — new checkbox in Settings. When active, every sell tap (single card, bulk by rarity, Aether-Root spell) executes instantly without the "are you sure?" confirmation modal.
- **Sell by rarity** — the "Sell All" buttons on Plant Deck and Spell Deck are replaced with per-rarity sell pills (Trash, Common, Uncommon, Rare, Epic, Legendary). Tap one to sell all unplaced plants or spells of that rarity. Lily Weeds are always protected — they're never bulk-sold.
- **Artifact rarity auto-sell limit** — only 1 copy of each artifact-rarity plant is allowed in the Plant Deck. Any duplicate created by a merge is immediately auto-sold for its gold value. Every artifact card shows a red warning banner: "⚠ Artifact — limit 1. Duplicates are auto-sold."
- **Artifact gold dev button** (💎) — red-shimmering floating button stacked directly above the gold button. Grants +5000 gold per tap. Only visible when dev mode is on.
- **Toast messages now use blue text** instead of red for info/updates. Red is reserved for errors only.

### Changed
- **Default sort is now Rarity** (was Name). Sort order in both Plant Deck and Spell Deck: Rarity, DMG, Name, HP.
- **Toast timing: 10 seconds visible + 2 second fade-out** (12 s total before removal). Previously the math was slightly off (8+2).
- **Merge-log button** repositioned to `bottom: 136px` to make room for the artifact gold button in the stack.

### Fixed
- **Lily Weeds protected from all bulk operations** — sell-by-rarity explicitly skips `cardId === 'lily_weed'`. The player can have infinite Lily Weeds.
- **Artifact gold button visibility** — the button now properly shows/hides alongside the regular dev-gold button when dev mode is toggled.

---

## v1.1.4 — 2026-04-12 — Artifact rarity, Spell Deck sort, Sell All, Fusion Log rework

### Added
- **Artifact rarity** — a new tier above Legendary with a blood-red shimmer. Cards show a crimson pulsing glow and red diagonal shimmer sweep. Only obtainable via fusion.
- **Artifact Void Bloom** — 3 Void Blooms fuse into this (`300 HP / 250 DMG / 2.5 s / 9 range, 2-tile splash`). Full Void-Petal chain: Void-Petal Bloom × 3 → Void Bloom × 3 → Artifact Void Bloom.
- **Magma Calladara** — 3 Volcanic Callas → (`220 HP / 140 DMG / 2.2 s / 9 range, fire trail`).
- **Inferno from Hella** — 3 Magma Calladaras → Artifact (`350 HP / 310 DMG / 2.5 s / 9 range, fire trail + 2-tile splash`). Full chain: Magma-Core Calla × 3 → Volcanic Calla × 3 → Magma Calladara × 3 → Inferno from Hella.
- **Void Demon Lily** — 3 Void Lilies → Artifact (`290 HP / 190 DMG / 2.2 s / 9 range, execute`).
- **Spell Deck sort** — Name / Rarity buttons above the Spell Deck, same pill UX as the Plant Deck.
- **Sell All** buttons — one on the Plant Deck (sells all unplaced plants with confirmation) and one on the Spell Deck (sells all spells with confirmation). Auto-hides when the deck is empty.
- **Auto-sell excess spells** — if any non-Magic-Mushroom spell exceeds 5 copies in the Spell Deck, the extras auto-sell for their gold value on every render, keeping the deck clean.
- **Fusion Log rework** — now reads from `meta.attainedFusions` so it persists across ALL runs (not just the current one). Each entry shows a visual recipe: `🌱 Parent × N → 🌱 Result` with rarity-coloured borders and stats.

### Changed
- `recordAttainedFusion` now writes to BOTH `run.attainedFusions` (visibility check) and `meta.attainedFusions` (permanent history across runs).
- Card database: 72 cards, 0 errors, 0 warnings.

---

## v1.1.3 — 2026-04-12 — Epic Scrubber, economy evolution chain, Acorn tier scaling

### Added
- **Epic Scrubber** — 6 Scrubbers fuse into an **Epic Scrubber** (`125 HP / 60 DMG / 1.2 range / 1.7 s cast`). Full Seedling line is now: Seedling Scrubber × 3 → Blooming Scrubber × 3 → Scrubber × 6 → Epic Scrubber.
- **Pinecone** — 3 Thorns fuse into a **Pinecone** (`250 HP / 8 s cast / 150 g every 8 s`).
- **Acorn** — 3 Pinecones fuse into an **Acorn** (`300 HP / 5 s cast / 300 g every 5 s`). The full economy chain is: Sunflower × 3 → Gilded Rose × 3 → Thorn × 3 → Pinecone × 3 → Acorn.
- **Acorn tier scaling** — Magic Mushroom on Acorn DOES tier up (unlike other economy plants which duplicate). Each tier adds **+50 g per cast** and **+1 s cast time**. T2 = 350 g / 6 s, T3 = 400 g / 7 s, etc. The stats line in the placed-card modal shows effective gold per cast.
- **`tierEffect` card field** — new data-driven per-tier scaling for economy plants. Acorn uses `{ goldPerTier: 50, castTimePerTier: 1 }`. combat.js hydration reads it and adjusts `customGoldPerCast` and `castTimer`; `produceGold` reads `plant.customGoldPerCast` if set.

### Changed
- **Magic Mushroom on economy plants** — Gilded Rose, Thorn, Pinecone all duplicate (add a copy to the deck). Acorn is the exception: because it has a `tierEffect`, it tiers up with custom scaling instead.
- **Toast messages stagger** — when multiple toasts fire simultaneously (e.g. a cascade merge), each new toast offsets 48 px higher than the previous so they stack visually instead of overlapping. Applied to all four toast functions across placement.js, shop.js, combatView.js, and main.js.

---

## v1.1.2 — 2026-04-12 — Mycelium Network rework, Fusion Log button

### Added
- **Fusion Log button** (🧬) — a purple floating button in the lower-right corner (above the dev-gold button) that opens a scrollable modal listing every fusion the player has attained in this run. Each entry shows the fusion plant's name, rarity-coloured left border, recipe ("3 × Seedling Scrubber"), and stats (HP / DMG / cast). Fusions the player hasn't created yet are NOT shown — the list grows as you discover new merges. Button auto-hides when there are no fusions yet.
- **`run.attainedFusions`** — new persistent array that records the card ID of every fusion plant created (via grid merge or deck auto-merge). Both `mergeEvolution` and `checkDeckMerges` call `recordAttainedFusion` on success.

### Changed
- **Mycelium Network rework** — target changed from `plant_group` (which was unimplemented and showed "coming soon") to `board`. It now just works: tap any tile to cast, and every placed plant gets **+20% damage** and **+20 HP** for the round. No Synthesis UI needed.

---

## v1.1.1 — 2026-04-12 — Deck merge fix, economy duplication, QoL

### Fixed
- **Sunflower (and all plants) now merge correctly in the Plant Deck.** The old `checkDeckMerges` only counted *unplaced* copies — so 2 Sunflowers on the grid + 1 in the deck = 3 total, but only 1 counted, no merge. It now counts ALL copies (placed + unplaced). When a merge fires, placed copies are pulled off the grid (unplaced copies are consumed first to minimise disruption) and the evolved result lands in the deck unplaced so the player can place it wherever they want.

### Changed
- **Magic Mushroom on gold-producing plants duplicates them.** Previously only Sunflower triggered the duplication — now any plant with `card.economy` or `card.category === 'economy'` (Sunflower, Gilded Rose, Amber Grain, Crystal Fern, Midas Mandrake, Thorn, Golden Grain, Diamond Fern, Bloody Mandrake) gets a fresh unplaced copy in the deck instead of a tier-up. The original is untouched.
- **Dev gold button grants +50 per tap** (was +10) for faster testing.
- **Removed Type from the sort bar** — the Plant Deck sort buttons are now Name, Rarity, HP, DMG (four buttons instead of five).

---

## v1.1.0 — 2026-04-12 — Sort fix, shop scroll-to-top

### Fixed
- **Plant Deck sort buttons didn't work** — `wireDeckSortBar` captured the `run` object in a closure on its first render. When the run mutated or a new run started, the handler still referenced the stale object, so tapping a sort button either did nothing or silently sorted an old deck. The handler now reads a module-level `_currentRun` reference that's refreshed on every `renderPlacement` call — tapping Name / Rarity / HP / DMG / Type now re-sorts the Plant Deck instantly.
- **Shop started at the bottom after each round** — the shop screen kept its scroll position from the previous visit, so after combat the player landed deep in the page. `STATES.SHOP.enter()` now resets `shopScreen.scrollTop = 0` so you always start at the top, right at the 3 shop cards.

---

## v1.0.9 — 2026-04-12 — Every plant can now fuse + 9 new fusion targets

### Added
- **9 new fusion plants** — the last 9 pack-exclusive base plants that were missing evolution paths now merge:
  - Bramble-Whip Vine × 3 → **Thorned Vine** (50 HP / 18 DMG, stronger slow)
  - Glimmer-Spore × 3 → **Radiant Spore** (75 HP / 35 DMG, reveal invisible)
  - Stone-Root Bulwark × 3 → **Granite Bulwark** (200 HP, wall, 20% reflect)
  - Amber Grain × 3 → **Golden Grain** (50 HP, +3 gold per lane kill)
  - Storm-Caster Orchid × 3 → **Thunder Orchid** (80 HP / 35 DMG, 4-jump lightning)
  - Frost-Thistle × 3 → **Glacial Thistle** (150 HP / 70 DMG, 10% stun)
  - Elder Oak Aegis × 3 → **Ancient Oak** (300 HP / 30 DMG, 40 HP shield aura)
  - Crystal Fern × 3 → **Diamond Fern** (150 HP / 30 DMG, +15 gold + 15 HP self-shield / 12 s)
  - Magma-Core Calla × 3 → **Volcanic Calla** (140 HP / 70 DMG, hotter fire trail)

### Fixed
- **Storm-Caster Orchid wouldn't auto-merge** — it (and 8 other pack-exclusive plants) were missing `evolution` blocks entirely. Full audit confirmed every non-fusion plant in the database now carries an evolution path. Card count: 65, validator: 0 errors.

---

## v1.0.8 — 2026-04-12 — Deck sort, auto-merge in deck, Solae & fixes

### Added
- **Plant Deck sorting** — five sort buttons (Name, Rarity, HP, DMG, Type) sit above the Plant Deck. Tap any to re-sort instantly. Active sort is highlighted as a gold pill; persists for the session.
- **Auto-merge in the Plant Deck** — when 3 (or N) unplaced copies of the same plant accumulate in your deck, they auto-fuse into the evolved form without needing to be placed on the grid. Cascades in one tick (e.g. 9 Seedling Scrubbers → 3 Blooming Scrubbers → 1 Scrubber). Triggers on every shop buy, pack open, and grid removal.
- **Solae** — the first **4-way** fusion in the game: **4 Solar Breaches → Solae** (`500 HP / 600 DMG / 3.0 s cast`, beam + heal_adjacent 12). The entire Solar line is now Solar Archon × 3 → Solar Breach × 4 → Solae (requires 12 Solar Archons total).

### Fixed
- **Dev gold button stayed visible after disabling dev mode** — `.dev-gold-btn` had `display: flex` which outranked the UA `[hidden] { display: none }` rule. Added an explicit `.dev-gold-btn[hidden] { display: none !important }` override.

---

## v1.0.7 — 2026-04-11 — Lily Weed, Blue Lily & omni attack pattern

### Added
- **Lily Weed** — a tiny trash plant (`3 HP / 1 DMG / 2.0 s cast`, sells for 1 g). Every new run **starts with one Lily Weed for free** in the Plant Deck, regardless of difficulty. It's a stat slop solo, but five on the grid fuse into…
- **Blue Lily** — the Lily Weed fusion reward: `300 HP / 1000 DMG / 0.1 s cast`. **Attacks in all 8 directions** up to 2 tiles away (including diagonals, forward *and* backward). 0.1 s cast means 10 hits per second — deletes anything it catches.
- **Frenzy-pack easter egg drop** — extra Lily Weeds only come from **Frenzy Chests at a 1 % per-slot drop rate**. You get one free, you hunt the other four.
- **`omni` attack pattern** — new attack shape in `combat.js findTarget` using Chebyshev distance (`max(|dx|, |dy|) ≤ range`). Omni plants bypass the global 5-tile minimum range floor, so short-range omni attackers actually stay short.
- **`packDropChance` card field** — lets any pack-affiliated card roll independently *before* the normal rarity-weighted roll at its own probability. Special-drop cards are excluded from the normal rarity pool so they can only come through the pre-roll.

### Changed
- New runs now seed a free Lily Weed into `run.deck` inside `startNewRun()` so every difficulty gets the same starter.

---

## v1.0.6 — 2026-04-11 — Fusion System, Spell Deck split & balance pass

### Added
- **Fusion merge system** — every plant can now carry an `evolution` block. Place 3 identical plants on the grid and they atomically collapse into their evolved form. Chains cascade in a single placement, so dropping the 3rd Seedling Scrubber on a board already holding 2 Blooming Scrubbers collapses the whole line into a **Scrubber** in one tap.
- **15 new fusion plants** in a brand-new `category: 'fusion'`:
  - *Standard chains:* Seedling Scrubber → **Blooming Scrubber** → **Scrubber**, Ironroot Sentry → **Ironroot Archer** → **Ironroot Knight**, Frost-Bite Willow → **Frozen Willow** → **Pulsing Willow**, Cinder-Fern → **Smoldering Fern** → **Horned Fern**, Void-Petal Bloom → **Void Bloom**, Solar Archon → **Solar Breach**.
  - *Pack-exclusive chains:* Dragon-Breath Snapdragon → **Runite Dragon**, Void-Reaper Lily → **Void Lily**, Midas Mandrake → **Bloody Mandrake**.
  - *Economy chain:* Gilded Rose → **Thorn** (200 HP, generates **120 Gold every 10 s**).
  - Every fusion inherits its base plant's abilities — beams stay beams, splash stays splash, fire stays fire.
- **Dedicated Spell Deck** — plant-target spells now live in their own `run.spellDeck` inventory, completely separated from the Plant Deck. A new "Spell Deck (N)" section appears in the shop below the Plant Deck with the same click-to-select / Sell-pill affordances. Existing saves auto-migrate on load.
- **Aether-Root spell info buttons** — every spell slot in the side panel now has a small `ℹ` button that opens the full card details (description, cooldown, effect) without triggering the cast.
- **Red damage popups** — plant attacks now spawn a big red `-{damage}` floating number over every zombie they hit, mirroring the gold popup treatment so you can read exactly how hard each hit lands.
- **Clear Grid button** — a one-tap `↩ Clear Grid` pill in the Battlefield section returns every placed plant to the deck (keeping buffs and tiers intact) so you can rearrange freely. Auto-hides when the grid is empty.
- **Active Spells on cards** — the Plant Deck and Spell Deck cards now show a compact "Active Spells (N)" panel listing every stacked spell by name (grouped with `× N` when stacked), a purple `T{n}` tier pill when Magic Mushroom has leveled the plant up, and a small buff-icon strip on placed grid tiles so buffed plants are obvious at a glance — even when sitting in the deck inventory after removal.

### Balance
- **Solar Archon** nerfed: `300 HP / 150 DMG → 100 HP / 50 DMG`. The legendary was overshadowing every other plant in the endgame.
- **Void-Petal Bloom** nerfed: `120 HP / 60 DMG → 50 HP / 22 DMG`.
- **Dragon-Breath Snapdragon** nerfed: `300 HP / 150 DMG → 50 HP / 50 DMG`.
- **Void-Reaper Lily** nerfed: `120 HP / 60 DMG → 40 HP / 20 DMG`.
- **Midas Mandrake** nerfed: `300 HP / 50 DMG → 100 HP / 25 DMG`.
- **Nature's Wrath** cooldown: `90 s → 25 s` — the beam is meant to be a reactive tool, not a once-per-round nuke.
- **Thorn-Pulse** cooldown: `45 s → 15 s` — same reasoning; knockback should feel responsive.
- **Aether Bloom** is now a **permanent** `-1 s` cast-time buff (was `-0.5 s` for 10 s). Stacks cleanly: multiple casts drive cast time toward the `0.1 s` floor.
- **All attacking plants default to First targeting.** Void-Petal Bloom, Solar Archon, and Bramble Executioner used to default to Strongest/Weakest; they now start on First so new placements behave predictably. You can still override per-instance from the placed-card modal.

### Fixed
- **SFX died after round 1** — the AudioContext was entering `suspended` / `interrupted` state after idle combat and `ctx.currentTime` was freezing while suspended, so every `playSfx` scheduled events in the past. The context is now explicitly resumed on every user gesture (pointerdown / touchstart / keydown, capture phase), a `statechange` listener auto-kicks it back to running, and `playSfx` awaits the resume promise before scheduling.
- **Card text was selectable on long-press** — `.card` and every descendant now set `user-select: none` + `-webkit-touch-callout: none` to suppress the iOS callout menu and desktop text selection.
- **Aether-Root panel wasn't centered** — the side panel is now `align-items: center` so the header and every slot line up cleanly; width bumped `180 → 200 px`.
- **Rarity words replaced with Plant / Spell labels** on every card surface and the pack-reveal modal. Rarity still drives border color, drop rates, and pack distribution — this is purely a readable-label change.

---

## v1.0.5 — 2026-04-11 — Mid-combat moves, Magic Mushroom tiers & patch notes viewer

### Added
- **Tap plants during combat** — a tap on any placed plant mid-round opens a live details modal with current HP bar, shield, active spells, tier, and effective damage / cast time.
- **Move plants during a round** — the combat plant modal has a new **Move** button. Pick any empty non-staging tile and the plant relocates instantly. The whole grid lights up green-pulsing to show valid destinations.
- **Patch notes viewer** — tap the version label on the main menu to open a scrollable modal with every release note.
- **Bigger + longer gold popups** — Sunflower `+g` and zombie-kill `+g` now render with a punchier bold font, golden glow, and linger a full second longer so you can actually read them during a busy round.
- **Magic Mushroom → Tier Up** — no more random evolve. Casting on a Sunflower spawns a fresh unplaced Sunflower in your deck. Casting on any other plant bumps its tier: each tier grants `+10 HP` and `+5 DMG`, stacking all the way to **T99**. A purple `T{n}` badge appears on the grid tile and in the details modal.
- **Clear-all-buffs button** on the placed-card modal. Wipes every stacked spell from the instance without losing tier or position.
- **Remove-but-keep-buffs** — removing a plant from the grid now preserves its buffs and tier so you can re-place it later with nothing lost.

### Changed
- **Countdown: 5 → 3 seconds** — less waiting between shop and combat.
- **Start Round button** gets a fiery layered animation: pulsing gold/red glow, shimmer outline, and a gentle bob. Impossible to miss.
- **Aether-Root spells are fully separated from the plant deck.** They live in a dedicated "Aether-Root Spells" shop section with rarity borders and a sell button. Duplicates opened from a pack auto-sell for the rolled gold value.
- **Dev-mode gold button auto-refreshes the shop** so pack chests become available the instant you hit their cost.
- **Buff badge + tile glow** — placed plants with active buffs get a blue pulsing `✨` badge and a blue inset ring on their tile. Instant visual confirmation that a spell landed.
- **Effective stats in the placed-card modal** — the stats line now shows the actual combat HP / DMG / cast time after tier and every stacked buff, not the base card values.

### Fixed
- **Card text can no longer be selected by long-press** — `.card` and every descendant use `user-select: none` and `-webkit-touch-callout: none` so mobile and desktop long-holds don't trigger selection or the iOS callout menu.
- Stray `aether_root` cards that somehow ended up in `run.deck` on older saves are migrated to `run.aetherSpells` (or auto-sold as duplicates) on resume.

---

## v1.0.4 — 2026-04-11 — 5×9 grid + staging zone

- **Grid shrunk from 5×12 to 5×9.** Combat is tighter and more readable on mobile.
- **New yellow-checkered staging column (col 9).** Zombies spawn off-screen right, march through the staging column first, and are **untargetable** by every plant attack path (`findTarget`, beam pierce, chain lightning, splash AoE, cone damage). This gives enemies a few seconds of safe passage to form up before combat begins.
- Plants **cannot** be placed in the staging column.
- One-shot save migration: any plant saved at col ≥ 8 is demoted back to the deck so no plants end up invisible off-grid.

---

## v1.0.3 — 2026-04-11 — Sticky HUD, card details & UX polish

- **Sticky HUD sidebar** — Round / Gold / HP / Mode now live in a fixed left rail so your run stats follow you as you scroll instead of being buried at the top of the page.
- **Card details modal** — every card in the shop now has a details button that flips it to a full description, cost, sell value, abilities, and targeting.
- **Dev-gold button moved** out of the top-right corner (where it overlapped content on mobile) and into the bottom-right floating action area.
- **Aether-Root label** reflowed to two stacked lines so it fits the narrow rail on phones.
- **Pull-to-refresh disabled** on mobile — `overscroll-behavior: none` so accidental swipes during combat don't reload the page.
- **Cast spells on plants** — plant-buff spells can now be cast on placed plants by tapping the spell in the deck and then tapping the plant. The buff is stored on the instance and re-applied every round.

---

## v1.0.2 — 2026-04-11 — Dev mode, uncapped deck, Chrono-Bloom fix

- **Dev mode** (enter code `1337` in Settings) unlocks a floating gold button and bypasses starting-gold limits for testing.
- **Deck size is now uncapped.** The 10-card cap only applies to how many can be **placed** on the grid simultaneously — opening a chest is "super exciting, never a negative".
- **Chrono-Bloom now actually does something.** Lane spells are correctly wired: Chrono-Bloom slashes cast time for every plant in the target row, Solar Flare queues lane damage for combat start, Spore-Burst arms tile-radius AoE.
- **Solar Archon** beam ability is now wired: pivots to the target's row and pierces all zombies behind it with the same damage.

---

## v1.0.1 — 2026-04-11 — Mobile polish, fast-forward, boss nerf

- **Comprehensive mobile layout overhaul** — responsive breakpoints, touch-friendly button sizes, scrollable screens, `touch-action: manipulation` to kill the 300 ms tap delay.
- **Fast-forward button** (1× / 2× / 3×) during idle combat for impatient players.
- **Boss Frenzy buff removed** — bosses no longer grant +10% attack speed to remaining zombies on spawn. Rounds were too punishing.
- **Early-game rebalance** — commons can now actually handle rounds 1–3 on their own (minimum engagement range of 5 tiles, castTimer seeded at 0.4 s, HP / DMG retuned).

---

## v1.0.0 — 2026-04-10 — Phase 12: Polish, Audio & Release 🎉

The v1.0.0 release! Phases 0–12 complete. Plants vs Zombies: Card Battler is feature-complete and live at **[nors3ai.github.io/Plants-vs-Zombies](https://nors3ai.github.io/Plants-vs-Zombies/)**.

### Added
- **Projectile visuals** — Every plant attack now fires a colored dot from the plant to its target. Color matches the plant's rarity; Legendary plants get oversized glowing projectiles.
- **Zombie death fade-out** — Dead zombies grayscale + blur + fade over 260ms before their DOM element is removed, so kills feel weighty.
- **Boss spawn screen-shake** — When a boss enters, the combat grid shakes for 500ms (CSS `bossShake` keyframes).
- **Enhanced Legendary shine** — Legendary cards now have a diagonal shimmer sweep (`::after` pseudo-element with a moving gradient) layered on top of the existing pulse. Gold + red glow intensifies.
- **Auto-focus + Enter-to-submit** on game-over and victory name entry inputs. No more fumbling with the keyboard.
- **Per-round buff cleanup** — Nectar Rush, Aether Bloom, and Arcane Surge are now marked `permanent: false` and stripped from deck instances at round end via `Combat.clearTransientBuffs()`. Barkskin shields and Wild Growth stay permanent as specced.
- **`Combat.clearTransientBuffs(run)`** — new export called from `endRound()` in main.js to purge expired buffs.
- **Projectile tick pipeline** — `state.projectiles[]`, `spawnProjectile()`, `tickProjectiles()`, `nextProjectileId()`. Combat view renders via `renderProjectiles` with Map-based DOM diff.
- **Boss-spawn shake counter** — `state.bossJustSpawned` ticks down from 0.6s; combat view toggles `.boss-shake` class on the grid while positive.

### Changed
- **Phase badge hidden** (kept in DOM as `v1.0.0` placeholder for future version pinning)
- **Version label → v1.0.0** on the main menu
- **Console boot log** now reads "v1.0.0 boot complete"

### Fixed (Phase 11 audit)
- **Per-round buffs persisted forever** — Nectar Rush's "+15 DMG for the round" now actually expires at round end. Same for Aether Bloom and Arcane Surge.
- **Name input didn't auto-focus** — both the game-over `#player-name-input` and victory `#victory-name-input` get `.focus({ preventScroll: true })` after a short delay so the screen's fade-in doesn't steal focus.
- **Enter key now submits** the name entry on both game-over and victory screens.

### Deferred (for a Phase 13+ content pass)
- Background music tracks (AudioManager API is ready; no audio files bundled)
- Final sprite art / animations (currently emoji placeholders)
- R5–R10 boss unique abilities still stubbed (banner text only, no gameplay effect)
- Sound effects for spell casts, zombie deaths, attack hits

### Verified
- JS parses across all 22 modules
- CSS braces balanced (462/462)
- Headless combat sim confirms rounds 1-10 complete with projectile spawning, boss spawns, per-round buff cleanup on round end

### Thanks
All 12 phases shipped from design doc to release. Built iteratively with audit-after-every-phase discipline. The repo has the full history.

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
