# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Plants vs Zombies: Card Battler** is a browser-based card game inspired by the classic Plants vs Zombies gameplay, reimagined as an idler-style card battler with deep deck-building, rarity systems, and randomized loot mechanics.

The game is built to run entirely in the browser (HTML5/JavaScript/CSS) and is intended to be hosted on GitHub Pages.

## Core Concept

Players defend the **Aether-Root** (the Mother Plant) against waves of fantasy-themed undead enemies by purchasing, placing, and upgrading plant and spell cards on a **5 x 12 grid**. After the shop phase, the round plays out automatically — turning the game into a strategic idler where preparation and placement are key.

The only active intervention during combat is casting side-panel spells on the Aether-Root itself.

## Game Flow

1. **Main Menu** — Start Game, Settings, Leaderboard
2. **Difficulty Selection** — Tutorial, Easy, Normal, Hard, Insane (Endless unlocks after Round 10 win)
3. **Shop Mode** — Infinite-time card purchasing & grid placement (no countdown the very first time)
4. **5-Second Countdown** — Animated zoom-in countdown 5 → 0
5. **Combat Phase** — Plants and zombies battle automatically; player casts Aether-Root spells reactively
6. **Round End** — Gold awarded, return to Shop Mode, repeat
7. **Victory / Defeat** — Round 10 boss kill = Endless unlock + Achievement; Aether-Root death = Game Over

## Difficulty Modes

| Mode | Enemy HP | Enemy DMG | Player HP | Starting Gold | Notes |
|---|---|---|---|---|---|
| **Tutorial** | Reduced | Reduced | 100 | 10 | Tooltips appear contextually |
| **Easy** | Reduced | Reduced | 150 | 10 | Player has buffed damage/health |
| **Normal** | 100% | 100% | 100 | 5 | Baseline experience |
| **Hard** | 200% | 150% | 50 | 3 | Spell timing critical |
| **Insane** | 350% | 300% | 25 | 1 | Aether-Root spells essential |
| **Endless** | Scales infinitely | Scales infinitely | 100 | 5 | Unlocked after Round 10 boss kill |

## Rarity System

| Rarity | Color | Border | Buy Cost | Sell Value | Drop % |
|---|---|---|---|---|---|
| Trash | Grey | Plain | 2-4 | 1-3 | 80% |
| Common | White | Plain | 3-5 | 2-4 | 50% |
| Uncommon | Green | Plain | 4-7 | 3-5 | 30% |
| Rare | Blue | Plain | 5-8 | 4-7 | 15% |
| Epic | Purple | Plain | 6-9 | 5-8 | 10% |
| Legendary | Gold | Animated gold/red shine | 15 | 6-10 | 5% |

## Card Pack System

| Pack | Cost | Cards | Drop Rates |
|---|---|---|---|
| **Mythic** | 20 Gold | 3-5 | Common 70% / Uncommon 25% / Rare 5% |
| **Arcane** | 30 Gold | 3-5 | Uncommon 65% / Rare 30% / Epic 5% |
| **Frenzy** | 50 Gold | 3-5 | Rare 60% / Epic 35% / Legendary 5% |

**Pity Mechanics:**
- Frenzy Packs guarantee at least one Epic card.
- Every 5th Frenzy Pack opened guarantees one Legendary plant.
- Pack-exclusive cards do **not** appear in the regular shop.

## Combat Rules

- **Grid:** 5 rows × 12 columns. Aether-Root sits on the far left.
- **Auto-Combat:** All plants attack on their own cast timers (base 2.0s).
- **Targeting Modes:** First / Strongest / Weakest (set in shop via card menu).
- **Attack Patterns:** Forward / Backward / Side-to-Side / Diagonal — defined per card.
- **Death:** Plants are removed when HP reaches 0. Zombies drop gold on death (floating popup).
- **Player Action:** Side-panel Aether-Root spells (heal, shield, board control) on cooldowns.

## Settings

- Save Game (saves everything: deck, gold, round, unlocks, leaderboard)
- Dark Mode / Light Mode
- Reset Game
- Music On/Off
- Sounds On/Off

## Tech Stack (Planned)

- **Frontend:** HTML5, CSS3, Vanilla JavaScript (or lightweight framework TBD)
- **Rendering:** Canvas or DOM-based grid
- **Persistence:** localStorage for save data
- **Hosting:** GitHub Pages (github.io)

## Repository Structure (Planned)

GitHub Pages serves the game from the `/docs` folder on the `main` branch. **All game source code lives under `/docs`** so the deployed site is always in sync with the repo.

```
/
├── CLAUDE.md           # This file — guidance for Claude Code
├── README.md           # Public-facing game info & play link
├── Features.md         # Living list of all features
├── Phases.md           # Development phases roadmap
├── patchnotes.md       # Version history
└── /docs               # GitHub Pages root (served at nors3ai.github.io/Plants-vs-Zombies)
    ├── index.html      # Game entry point
    ├── /css            # Stylesheets
    ├── /js             # Game source
    │   ├── /game       # Core game logic
    │   ├── /cards      # Card definitions
    │   └── /ui         # UI components
    └── /assets         # Sprites, audio, images
```

**Important:** Never put game runtime files outside `/docs` — they won't be served. Design docs (`*.md`) live at the repo root and are not deployed.

## Development Workflow

1. Read **Phases.md** to understand the current development phase.
2. Read **Features.md** to see what's planned vs. implemented.
3. Update **patchnotes.md** with every meaningful change.
4. Keep **CLAUDE.md** current as the source of truth for game design.

## Important Design Constraints

- The game is an **idler** during combat — only Aether-Root spells are player-controllable mid-round.
- Pack-exclusive cards must remain pack-exclusive (do not surface them in the regular shop).
- Trash (Grey) cards are excluded from card packs to preserve pack value.
- The 5x12 grid is fixed; no terrain variation in the initial release.
