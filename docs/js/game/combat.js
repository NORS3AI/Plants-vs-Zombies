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
import {
  tickAetherCooldowns,
  resetAetherForRound,
  tickActiveBeams,
} from './aetherSpells.js';

export const GRID_COLS = 12;
export const GRID_ROWS = 5;

// ---------- Module state ----------
let _state = null;
let _run = null;
let _callbacks = null;
let _speedMultiplier = 1; // Player-controlled fast-forward (1x / 2x / 3x)

/** Read-only accessor for the current combat state (used by combatView). */
export function getCombatState() {
  return _state;
}

/** Get the current fast-forward multiplier (1, 2, or 3). */
export function getSpeedMultiplier() {
  return _speedMultiplier;
}

/** Set the fast-forward multiplier. Only values 1-5 are honored. */
export function setSpeedMultiplier(n) {
  const clamped = Math.max(1, Math.min(5, Math.floor(n)));
  _speedMultiplier = clamped;
  return _speedMultiplier;
}

/** Cycle 1 → 2 → 3 → 1. Returns the new multiplier. */
export function cycleSpeedMultiplier() {
  _speedMultiplier = _speedMultiplier >= 3 ? 1 : _speedMultiplier + 1;
  return _speedMultiplier;
}

/** Fire an event callback by name. Safe no-op if no callback registered. */
export function fireCallback(name, ...args) {
  _callbacks?.[name]?.(...args);
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

  // Hydrate placed plants and apply any persistent buffs from spell casts
  const plants = [];
  for (const instance of run.deck) {
    if (instance.gridRow == null || instance.gridCol == null) continue;
    const card = getCard(instance.cardId);
    if (!card) continue;

    const plant = {
      instanceId: instance.instanceId,
      cardId: card.id,
      card, // direct reference for faster access
      row: instance.gridRow,
      col: instance.gridCol,
      hp: card.health,
      maxHp: card.health,
      shield: 0, // Barkskin Guard / World-Tree Seed
      dmgBonus: 0, // Nectar Rush (+damage)
      dmgMul: 1, // Arcane Surge (×damage)
      castSpeedBuff: 0, // Aether Bloom (-cast time)
      // Balance: plants start ready to fire, not after a full 2s delay.
      // A small initial delay (0.4s) lets the player see the grid before
      // everything starts firing.
      castTimer: 0.4,
      targeting: instance.targeting ?? card.targetingDefault ?? 'first',
      isEconomy: card.category === 'economy' || !!card.economy,
      attackFlash: 0,
    };

    // Apply stored buffs (from pre-combat spell casts)
    for (const buff of instance.buffs ?? []) {
      switch (buff.type) {
        case 'shield':
          plant.shield += buff.value;
          break;
        case 'hp_boost':
          plant.maxHp += buff.value;
          plant.hp = plant.maxHp;
          break;
        case 'dmg_boost':
          plant.dmgBonus += buff.value;
          break;
        case 'dmg_mul':
          plant.dmgMul *= buff.value;
          break;
        case 'cast_speed':
          plant.castSpeedBuff += buff.value;
          break;
      }
    }
    // Apply cast-speed buff to the first cast timer (negative = faster)
    if (plant.castSpeedBuff !== 0) {
      plant.castTimer = Math.max(0.1, plant.castTimer + plant.castSpeedBuff);
    }

    plants.push(plant);
  }

  _state = {
    time: 0,
    plants,
    zombies: [],
    projectiles: [], // { id, fromRow, fromCol, toRow, toCol, age, maxAge, color }
    spawnSchedule: generateSpawnSchedule(run.round, diff),
    spawnIndex: 0,
    floatingTexts: [],
    goldEarned: 0,
    kills: 0,
    plantsLost: 0,
    phase: 'spawning',
    endReason: null,
    bossActive: null, // reference to the currently-live boss zombie, if any
    bossName: null,
    roundNumber: run.round,
    activeBeams: [], // Nature's Wrath etc.
    bossJustSpawned: 0, // seconds remaining on the boss-spawn shake
  };

  // Phase 9: clear any stale Aether-Root shield from previous rounds
  // and reset once-per-round spell flags + cooldowns.
  run.aetherRootShield = 0;
  resetAetherForRound(run);

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

  // Apply fast-forward multiplier. All downstream ticks (plants, zombies,
  // projectiles, floating text, aether cooldowns, beams) read from this
  // scaled dt, so the whole simulation speeds up uniformly.
  dt = dt * _speedMultiplier;

  _state.time += dt;

  // 1. Spawn pending zombies
  spawnDue();

  // 2. Tick plants (cast timers → attack / produce gold)
  tickPlants(dt);

  // 3. Active beam effects (Nature's Wrath) — apply DoT to rows, mark kills
  tickActiveBeams(_state, dt);
  // Beam damage happens inline; reap any zombies that died from it
  for (const z of _state.zombies) {
    if (z.hp <= 0 && !z._counted) killZombie(z);
  }

  // 4. Tick zombies (move / attack plants / damage Aether-Root)
  tickZombies(dt);

  // 5. Tick Aether-Root spell cooldowns
  tickAetherCooldowns(_run, dt);

  // 6. Expire floating texts + projectiles
  tickFloatingTexts(dt);
  tickProjectiles(dt);

  // 7. Decay boss-spawn shake
  if (_state.bossJustSpawned > 0) {
    _state.bossJustSpawned = Math.max(0, _state.bossJustSpawned - dt);
  }

  // 8. Check end conditions
  checkEndConditions();
}

// ---------- Spawning ----------

function spawnDue() {
  while (
    _state.spawnIndex < _state.spawnSchedule.length &&
    _state.spawnSchedule[_state.spawnIndex].time <= _state.time
  ) {
    const entry = _state.spawnSchedule[_state.spawnIndex++];
    const type = entry.type;
    const zombie = {
      id: `zombie_${_state.time.toFixed(2)}_${_state.spawnIndex}`,
      typeId: type.id,
      name: type.name,
      sprite: type.sprite,
      row: entry.row,
      col: GRID_COLS, // spawn at right edge (col 12)
      hp: type.maxHp,
      maxHp: type.maxHp,
      dmg: type.dmg,
      baseSpeed: type.speed,
      speed: type.speed,
      attackInterval: type.attackInterval,
      attackTimer: 0,
      gold: type.gold,
      armor: type.armor ?? 0,
      state: 'walking',
      blockedBy: null,
      // Status effects (each: { expiresAt } pointing to _state.time)
      slowUntil: 0, // speed halved while _state.time < slowUntil
      // Boss-only
      isBoss: !!type.isBoss,
      scale: type.scale ?? 1,
      ability: type.ability,
      abilityKey: type.abilityKey,
      attackCount: 0, // used by Heavy Thump
    };
    _state.zombies.push(zombie);

    // Boss spawn: announce (no more Frenzy buff — rounds were too
    // punishing with the +10% speed boost on remaining zombies)
    if (zombie.isBoss) {
      _state.bossActive = zombie;
      _state.bossJustSpawned = 0.6; // triggers CSS shake for 600ms
      _callbacks?.onBossSpawn?.(zombie);
    }
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
        const baseDmg = plant.card.damage + (plant.dmgBonus ?? 0);
        const finalDmg = Math.round(baseDmg * (plant.dmgMul ?? 1));
        damageZombie(target, finalDmg, plant);
        plant.attackFlash = 0.35;
        // Spawn a projectile visual from plant to target
        spawnProjectile(plant, target);

        // --- Plant abilities on attack ---
        for (const ab of plant.card.abilities ?? []) {
          if (ab.type === 'slow_on_hit') {
            const duration = ab.duration ?? 2.0;
            target.slowUntil = Math.max(target.slowUntil, _state.time + duration);
          } else if (ab.type === 'stun_chance') {
            if (Math.random() < (ab.chance ?? 0)) {
              const dur = ab.duration ?? 1.0;
              target.slowUntil = Math.max(target.slowUntil, _state.time + dur);
              target.baseSpeed = 0; // freeze
              target.speed = 0;
              setTimeout(() => { target.baseSpeed = target.baseSpeed || target.speed; }, dur * 1000);
            }
          } else if (ab.type === 'execute') {
            // Non-boss zombies below threshold % HP are instantly killed
            const threshold = ab.threshold ?? 0.15;
            if (!target.isBoss && target.hp > 0 && target.hp / target.maxHp <= threshold) {
              target.hp = 0;
            }
          } else if (ab.type === 'beam') {
            // Beam pierces: hit ALL zombies in the target's row (beam
            // weapons pivot to whatever row the target is in) with the
            // same damage. The primary target was already damaged; this
            // pass hits everyone else in that row.
            const range = plant.card.range ?? 12;
            for (const z of _state.zombies) {
              if (z === target || z.hp <= 0) continue;
              if (z.row !== target.row) continue;
              // Use absolute column distance — beam sweeps in both directions
              const dCol = Math.abs(z.col - plant.col);
              if (dCol > range) continue;
              damageZombie(z, finalDmg, plant);
              spawnProjectile(plant, z);
              if (z.hp <= 0) killZombie(z);
            }
          } else if (ab.type === 'chain_lightning') {
            // Lightning jumps to N additional nearby targets from the primary.
            const maxJumps = ab.maxJumps ?? 2;
            const jumpRadius = ab.jumpRadius ?? 2;
            const hit = new Set([target]);
            let lastHop = target;
            for (let j = 0; j < maxJumps; j++) {
              const nextHop = _state.zombies.find((z) => {
                if (hit.has(z) || z.hp <= 0) return false;
                const dRow = Math.abs(z.row - lastHop.row);
                const dCol = Math.abs(z.col - lastHop.col);
                return dRow <= jumpRadius && dCol <= jumpRadius;
              });
              if (!nextHop) break;
              damageZombie(nextHop, finalDmg, plant);
              spawnProjectile(lastHop, nextHop);
              if (nextHop.hp <= 0) killZombie(nextHop);
              hit.add(nextHop);
              lastHop = nextHop;
            }
          } else if (ab.type === 'splash') {
            // Splash: same damage to zombies in the 8 tiles adjacent
            // to the target (row ±1 within 1 tile horizontally).
            for (const z of _state.zombies) {
              if (z === target || z.hp <= 0) continue;
              const dRow = Math.abs(z.row - target.row);
              const dCol = Math.abs(z.col - target.col);
              if (dRow <= (ab.radius ?? 1) && dCol <= (ab.radius ?? 1)) {
                damageZombie(z, finalDmg, plant);
                if (z.hp <= 0) killZombie(z);
              }
            }
          } else if (ab.type === 'cone_damage') {
            // 3-row wide cone hitting zombies ahead of the plant
            const width = ab.width ?? 3;
            const depth = ab.depth ?? 6;
            const halfW = Math.floor(width / 2);
            for (const z of _state.zombies) {
              if (z === target || z.hp <= 0) continue;
              if (Math.abs(z.row - plant.row) > halfW) continue;
              const dx = z.col - plant.col;
              if (dx < 0 || dx > depth) continue;
              damageZombie(z, finalDmg, plant);
              if (z.hp <= 0) killZombie(z);
            }
          }
        }

        if (target.hp <= 0) killZombie(target);

        // --- Passive abilities: heal adjacent on every cast ---
        for (const ab of plant.card.abilities ?? []) {
          if (ab.type === 'heal_adjacent') {
            for (const ally of _state.plants) {
              if (ally === plant || ally.hp <= 0) continue;
              if (ally.hp >= ally.maxHp) continue;
              const dRow = Math.abs(ally.row - plant.row);
              const dCol = Math.abs(ally.col - plant.col);
              if (dRow + dCol <= 1) {
                ally.hp = Math.min(ally.maxHp, ally.hp + (ab.value ?? 5));
              }
            }
          }
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

/** Apply damage to a zombie, respecting armor. */
function damageZombie(zombie, amount, source) {
  const armor = zombie.armor ?? 0;
  const net = Math.max(1, amount - armor);
  zombie.hp -= net;
}

let _floatingCounter = 0;
function nextFloatingId() {
  return `ft_${++_floatingCounter}`;
}

let _projectileCounter = 0;
function nextProjectileId() {
  return `pj_${++_projectileCounter}`;
}

/** Spawn a projectile from (plant) to (zombie). */
function spawnProjectile(plant, zombie) {
  if (!_state?.projectiles) return;
  _state.projectiles.push({
    id: nextProjectileId(),
    fromRow: plant.row,
    fromCol: plant.col,
    toRow: zombie.row,
    toCol: zombie.col,
    age: 0,
    maxAge: 0.25,
    color: projectileColorFor(plant.card),
  });
}

function projectileColorFor(card) {
  if (!card) return 'gold';
  // Use rarity color as projectile tint
  return card.rarity || 'gold';
}

function tickProjectiles(dt) {
  if (!_state?.projectiles) return;
  const list = _state.projectiles;
  for (let i = list.length - 1; i >= 0; i--) {
    list[i].age += dt;
    if (list[i].age >= list[i].maxAge) list.splice(i, 1);
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
    id: nextFloatingId(),
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
  // Balance: every plant gets a minimum engagement range of 5 tiles
  // so melee plants (Seedling Scrubber, Ironroot Sentry, Bramble-Whip
  // Vine) get ~5 cast cycles of free fire before the zombie blocks
  // them. Commons can now handle rounds 1-3 solo; Rares+ are needed
  // by round 5+ when zombie HP outpaces their 5-dmg ceiling.
  const range = Math.max(5, card.range ?? 1);
  const pattern = card.attackPattern ?? 'forward';
  const hasBeam = (card.abilities ?? []).some((a) => a.type === 'beam');

  // Candidate rows this plant attacks
  const rows = new Set();
  if (hasBeam) {
    // Beam weapons can pivot to any row (Solar Archon's "beam damage")
    for (let r = 0; r < GRID_ROWS; r++) rows.add(r);
  } else if (pattern === 'side') {
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
  const zombies = _state.zombies;
  for (let i = zombies.length - 1; i >= 0; i--) {
    const z = zombies[i];
    if (z.hp <= 0) {
      zombies.splice(i, 1);
      continue;
    }

    // Apply slow status (halves speed while active)
    const slowed = _state.time < (z.slowUntil ?? 0);
    z.speed = slowed ? z.baseSpeed * 0.5 : z.baseSpeed;

    const blocker = findBlockingPlant(z);

    if (blocker) {
      z.state = 'attacking';
      z.blockedBy = blocker.instanceId;
      z.attackTimer -= dt;
      if (z.attackTimer <= 0) {
        z.attackCount = (z.attackCount ?? 0) + 1;
        let dmg = z.dmg;

        // Boss: Heavy Thump — every 3rd attack does 2× damage
        if (z.abilityKey === 'heavyThump' && z.attackCount % 3 === 0) {
          dmg *= 2;
        }

        // Shield absorbs damage first (from Barkskin Guard etc.)
        if ((blocker.shield ?? 0) > 0) {
          const absorbed = Math.min(blocker.shield, dmg);
          blocker.shield -= absorbed;
          dmg -= absorbed;
        }
        blocker.hp -= dmg;
        z.attackTimer = z.attackInterval;

        if (blocker.hp <= 0) {
          // Boss: Soul Reap — heals 5 HP on plant kill
          if (z.abilityKey === 'soulReap') {
            z.hp = Math.min(z.maxHp, z.hp + 5);
          }
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
        let remaining = z.dmg;
        // Aether-Root shield absorbs damage first (Phase 9)
        if ((_run.aetherRootShield ?? 0) > 0) {
          const absorbed = Math.min(_run.aetherRootShield, remaining);
          _run.aetherRootShield -= absorbed;
          remaining -= absorbed;
        }
        _run.aetherRootHP = Math.max(0, _run.aetherRootHP - remaining);
        _callbacks?.onAetherHit?.();
        // Boss breached: clear bossActive so the banner dismisses
        if (_state.bossActive === z) _state.bossActive = null;
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
  if (zombie.hp <= 0 && zombie._counted) return;
  zombie.hp = 0;
  zombie._counted = true;
  if (_state.bossActive === zombie) {
    _state.bossActive = null;
  }
  let goldGained = zombie.gold;

  // Amber Grain / similar: each plant with economy.goldPerLaneKill in the
  // zombie's row grants extra gold on the kill.
  for (const p of _state.plants) {
    if (p.hp <= 0) continue;
    if (p.row !== zombie.row) continue;
    const bonus = p.card.economy?.goldPerLaneKill ?? 0;
    if (bonus > 0) goldGained += bonus;
  }

  _run.gold += goldGained;
  _state.goldEarned += goldGained;
  _state.kills += 1;
  // Write to BOTH lastRoundX (for the round-end summary) AND totalX (so
  // game-over mid-round still shows accurate totals).
  _run.lastRoundGoldEarned = (_run.lastRoundGoldEarned ?? 0) + goldGained;
  _run.lastRoundKills = (_run.lastRoundKills ?? 0) + 1;
  _run.totalGoldEarned = (_run.totalGoldEarned ?? 0) + goldGained;
  _run.totalKills = (_run.totalKills ?? 0) + 1;
  _state.floatingTexts.push({
    id: nextFloatingId(),
    text: `+${goldGained}g`,
    row: zombie.row,
    col: zombie.col,
    age: 0,
    maxAge: 1.0,
    color: 'gold',
  });
  _callbacks?.onGoldChange?.();
  _callbacks?.onZombieKilled?.(zombie);
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

// Note: between-round healing is implicit — initCombat always hydrates
// plants from card.health, so plants always start a round at full HP.
// A dedicated healSurvivors() function will land when Phase 8+ adds
// persistent buffs (Wild Growth, shields) that need explicit carry-over.

/**
 * Phase 12: remove per-round buffs (dmg_boost, cast_speed, dmg_mul)
 * that should only last the duration of a single round. Permanent
 * buffs (hp_boost, shield) are marked { permanent: true } and stay.
 * Called from main.js endRound().
 */
export function clearTransientBuffs(run) {
  if (!run?.deck) return;
  for (const instance of run.deck) {
    if (!instance.buffs) continue;
    instance.buffs = instance.buffs.filter((b) => b.permanent === true);
  }
}
