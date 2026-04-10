/**
 * Combat Engine
 *
 * Ephemeral combat state + tick loop. Reads plant placements from
 * run.deck (those with gridRow/gridCol set), hydrates a runtime state
 * with HP / cast timers / buffs, then simulates tick-by-tick until
 * the round ends or the Aether-Root falls.
 *
 * Combat state is NOT persisted — only the run totals (gold, kills,
 * plants lost) feed back into currentRun on round end.
 *
 * Phase 7 scope:
 *  - Forward attack pattern (other patterns fall through to 'forward')
 *  - Basic targeting: first / strongest / weakest
 *  - Plant HP tracking + death removal
 *  - Zombie movement + melee blocking
 *  - Aether-Root damage on lane breach
 *  - Gold awarded per kill
 *  - Economy plants (Sunflower / Gilded Rose) generate gold on cast
 *  - Game over / round end transitions
 *
 * Phase 8 adds: boss zombies, named round-specific zombies, abilities.
 * Phase 9 adds: Aether-Root spell side panel.
 */

import { getCard } from '../cards/index.js';
import { getDifficulty } from './difficulty.js';
import { generateSpawnSchedule } from './zombies.js';

export const GRID_COLS = 12;
export const GRID_ROWS = 5;

// ---------- Module state ----------
let _state = null;
let _run = null;
let _callbacks = null;

/** Read-only accessor for the current combat state (used by combatView). */
export function getCombatState() {
  return _state;
}

/**
 * Initialize combat for the current round.
 * Builds runtime plants from run.deck's placed entries,
 * generates a spawn schedule, resets counters.
 */
export function initCombat(run, callbacks = {}) {
  _run = run;
  _callbacks = callbacks;

  const diff = getDifficulty(run.difficulty) ?? {};

  // Hydrate placed plants
  const plants = [];
  for (const instance of run.deck) {
    if (instance.gridRow == null || instance.gridCol == null) continue;
    const card = getCard(instance.cardId);
    if (!card) continue;
    plants.push({
      instanceId: instance.instanceId,
      cardId: card.id,
      card, // direct reference for faster access
      row: instance.gridRow,
      col: instance.gridCol,
      hp: card.health,
      maxHp: card.health,
      castTimer: card.castTime, // full initial delay
      targeting: instance.targeting ?? card.targetingDefault ?? 'first',
      // Economy plants use castTimer for production instead of attacks
      isEconomy: card.category === 'economy' || !!card.economy,
      // Attack flash timer (for render feedback)
      attackFlash: 0,
    });
  }

  _state = {
    time: 0,
    plants,
    zombies: [],
    spawnSchedule: generateSpawnSchedule(run.round, diff),
    spawnIndex: 0,
    floatingTexts: [], // { text, row, col, age, maxAge, color }
    goldEarned: 0,
    kills: 0,
    plantsLost: 0,
    phase: 'spawning', // 'spawning' | 'clearing' | 'done'
    endReason: null, // 'victory' | 'defeat'
  };

  return _state;
}

/** Wipe runtime state (called on COMBAT exit). */
export function resetCombat() {
  _state = null;
  _run = null;
  _callbacks = null;
}

// ============================================================
// TICK — main per-frame simulation step
// ============================================================

export function tickCombat(dt) {
  if (!_state || !_run) return;
  if (_state.phase === 'done') return;

  _state.time += dt;

  // 1. Spawn pending zombies
  spawnDue();

  // 2. Tick plants (cast timers → attack / produce gold)
  tickPlants(dt);

  // 3. Tick zombies (move / attack plants / damage Aether-Root)
  tickZombies(dt);

  // 4. Expire floating texts
  tickFloatingTexts(dt);

  // 5. Check end conditions
  checkEndConditions();
}

// ---------- Spawning ----------

function spawnDue() {
  while (
    _state.spawnIndex < _state.spawnSchedule.length &&
    _state.spawnSchedule[_state.spawnIndex].time <= _state.time
  ) {
    const entry = _state.spawnSchedule[_state.spawnIndex++];
    _state.zombies.push({
      id: `zombie_${_state.time.toFixed(2)}_${_state.spawnIndex}`,
      typeId: entry.type.id,
      name: entry.type.name,
      sprite: entry.type.sprite,
      row: entry.row,
      col: GRID_COLS, // spawn at right edge (col 12)
      hp: entry.type.maxHp,
      maxHp: entry.type.maxHp,
      dmg: entry.type.dmg,
      speed: entry.type.speed,
      attackInterval: entry.type.attackInterval,
      attackTimer: 0,
      gold: entry.type.gold,
      state: 'walking', // 'walking' | 'attacking'
      blockedBy: null, // instanceId of plant blocking it
    });
  }
}

// ---------- Plant behavior ----------

function tickPlants(dt) {
  for (const plant of _state.plants) {
    if (plant.hp <= 0) continue;
    if (plant.attackFlash > 0) plant.attackFlash = Math.max(0, plant.attackFlash - dt);

    if (plant.castTimer > 0) {
      plant.castTimer -= dt;
      continue;
    }

    // Ready to cast
    if (plant.isEconomy) {
      produceGold(plant);
    } else if (plant.card.damage > 0) {
      const target = findTarget(plant);
      if (target) {
        target.hp -= plant.card.damage;
        plant.attackFlash = 0.2;
        if (target.hp <= 0) {
          killZombie(target);
        }
      } else {
        // No target in range — partial cooldown recovery so we can
        // re-check soon without spamming the loop.
        plant.castTimer = 0.1;
        continue;
      }
    }

    // Reset cast timer to the plant's base cast time
    plant.castTimer = plant.card.castTime > 0 ? plant.card.castTime : 1.0;
  }
}

/** Economy plant produces gold to the run. */
function produceGold(plant) {
  const amount = plant.card.economy?.goldPerCast ?? 0;
  if (amount <= 0) return;
  _run.gold += amount;
  _state.goldEarned += amount;
  // Also attribute to round / run totals so the summary and game-over
  // screens reflect ALL gold earned this round, not just kill gold.
  _run.lastRoundGoldEarned = (_run.lastRoundGoldEarned ?? 0) + amount;
  _run.totalGoldEarned = (_run.totalGoldEarned ?? 0) + amount;
  _state.floatingTexts.push({
    text: `+${amount}g`,
    row: plant.row,
    col: plant.col,
    age: 0,
    maxAge: 1.2,
    color: 'gold',
  });
  _callbacks?.onGoldChange?.();
}

/**
 * Find a target for a damage-dealing plant.
 * Honors the plant's targeting priority (first/strongest/weakest)
 * and attack pattern. Phase 7 treats all patterns as "forward" —
 * Phase 8/9 will specialize side/diagonal/cone.
 */
function findTarget(plant) {
  const card = plant.card;
  const range = card.range ?? 1;
  const pattern = card.attackPattern ?? 'forward';

  // Candidate rows this plant attacks
  const rows = new Set();
  if (pattern === 'side') {
    rows.add(plant.row);
    if (plant.row > 0) rows.add(plant.row - 1);
    if (plant.row < GRID_ROWS - 1) rows.add(plant.row + 1);
  } else if (pattern === 'cone') {
    // Cone is 3 rows wide centered on the plant's row
    rows.add(plant.row);
    if (plant.row > 0) rows.add(plant.row - 1);
    if (plant.row < GRID_ROWS - 1) rows.add(plant.row + 1);
  } else {
    // forward / backward / diagonal all default to same row for Phase 7
    rows.add(plant.row);
  }

  const candidates = _state.zombies.filter((z) => {
    if (z.hp <= 0) return false;
    if (!rows.has(z.row)) return false;
    // Zombie column must be within range, on the correct side.
    const dx = z.col - plant.col;
    if (pattern === 'backward') return dx < 0 && -dx <= range;
    // Default: forward. Zombies enter from the right (col 12) and move
    // toward col 0. A plant at col 3 attacks zombies with col >= 3.
    return dx >= 0 && dx <= range;
  });

  if (candidates.length === 0) return null;

  // Apply targeting priority
  const priority = plant.targeting;
  if (priority === 'strongest') {
    return candidates.reduce((a, b) => (b.hp > a.hp ? b : a));
  }
  if (priority === 'weakest') {
    return candidates.reduce((a, b) => (b.hp < a.hp ? b : a));
  }
  // 'first' = closest to the Aether-Root = lowest column
  return candidates.reduce((a, b) => (b.col < a.col ? b : a));
}

// ---------- Zombie behavior ----------

function tickZombies(dt) {
  // Iterate a copy because we may splice during iteration
  const zombies = _state.zombies;
  for (let i = zombies.length - 1; i >= 0; i--) {
    const z = zombies[i];
    if (z.hp <= 0) {
      zombies.splice(i, 1);
      continue;
    }

    // Check if blocked by a plant at the next tile
    const blocker = findBlockingPlant(z);

    if (blocker) {
      z.state = 'attacking';
      z.blockedBy = blocker.instanceId;
      z.attackTimer -= dt;
      if (z.attackTimer <= 0) {
        blocker.hp -= z.dmg;
        z.attackTimer = z.attackInterval;
        if (blocker.hp <= 0) {
          killPlant(blocker);
        }
      }
    } else {
      z.state = 'walking';
      z.blockedBy = null;
      z.attackTimer = 0;
      z.col -= z.speed * dt;

      // Reached the Aether-Root
      if (z.col <= 0) {
        _run.aetherRootHP = Math.max(0, _run.aetherRootHP - z.dmg);
        _callbacks?.onAetherHit?.();
        zombies.splice(i, 1);
      }
    }
  }
}

/**
 * A plant blocks a zombie if they share a row and the plant's column
 * is within 0.9 tiles directly ahead of the zombie (close enough to
 * count as adjacent).
 */
function findBlockingPlant(zombie) {
  for (const plant of _state.plants) {
    if (plant.hp <= 0) continue;
    if (plant.row !== zombie.row) continue;
    const dx = zombie.col - plant.col;
    // Zombie is to the right of the plant, within a tile
    if (dx >= 0 && dx <= 0.9) return plant;
  }
  return null;
}

// ---------- Death ----------

function killZombie(zombie) {
  zombie.hp = 0;
  _run.gold += zombie.gold;
  _state.goldEarned += zombie.gold;
  _state.kills += 1;
  // Write to BOTH lastRoundX (for the round-end summary) AND totalX (so
  // game-over mid-round still shows accurate totals).
  _run.lastRoundGoldEarned = (_run.lastRoundGoldEarned ?? 0) + zombie.gold;
  _run.lastRoundKills = (_run.lastRoundKills ?? 0) + 1;
  _run.totalGoldEarned = (_run.totalGoldEarned ?? 0) + zombie.gold;
  _run.totalKills = (_run.totalKills ?? 0) + 1;
  _state.floatingTexts.push({
    text: `+${zombie.gold}g`,
    row: zombie.row,
    col: zombie.col,
    age: 0,
    maxAge: 1.0,
    color: 'gold',
  });
  _callbacks?.onGoldChange?.();
}

function killPlant(plant) {
  plant.hp = 0;
  _state.plantsLost += 1;
  _run.lastRoundPlantsLost = (_run.lastRoundPlantsLost ?? 0) + 1;
  _run.totalPlantsLost = (_run.totalPlantsLost ?? 0) + 1;

  // Mark the deck instance as no longer placed
  const instance = _run.deck.find((d) => d.instanceId === plant.instanceId);
  if (instance) {
    instance.gridRow = null;
    instance.gridCol = null;
  }
  _callbacks?.onPlantKilled?.(plant);
}

// ---------- Floating text ----------

function tickFloatingTexts(dt) {
  const list = _state.floatingTexts;
  for (let i = list.length - 1; i >= 0; i--) {
    list[i].age += dt;
    if (list[i].age >= list[i].maxAge) list.splice(i, 1);
  }
}

// ---------- End conditions ----------

function checkEndConditions() {
  // Defeat: Aether-Root fell
  if (_run.aetherRootHP <= 0) {
    _state.phase = 'done';
    _state.endReason = 'defeat';
    _callbacks?.onGameOver?.();
    return;
  }

  // Victory: all zombies dead + spawn schedule exhausted
  const spawning = _state.spawnIndex < _state.spawnSchedule.length;
  const stillFighting = _state.zombies.some((z) => z.hp > 0);
  if (!spawning && !stillFighting) {
    _state.phase = 'done';
    _state.endReason = 'victory';
    _callbacks?.onRoundComplete?.();
  }
}

/**
 * After a round ends, restore surviving plants' HP to full so the
 * player doesn't enter the next round with half-dead defenders.
 */
export function healSurvivors() {
  if (!_run) return;
  for (const instance of _run.deck) {
    if (instance.gridRow == null) continue;
    const card = getCard(instance.cardId);
    if (card && card.health != null) {
      instance.hp = card.health;
    }
  }
}
