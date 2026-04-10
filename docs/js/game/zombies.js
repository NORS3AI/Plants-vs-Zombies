/**
 * Zombie + Boss Data, Spawn Schedules
 *
 * Phase 8 implements the full 10-round content roster per the design doc:
 *
 *   Scaling:
 *     HP  = 10 + (round × 10)
 *     DMG = 2  + (round × 3)
 *     Count per round = [3, 6, 10, 15, 21, 28, 35, 42, 46, 50]
 *
 *   Each round has its own named zombie with a unique sprite and, for
 *   some rounds, a passive ability modifier (speed buff, armor, etc.).
 *
 *   Each round ends with a boss (HP = 3× zombie HP, DMG = 2× zombie DMG,
 *   visual scale 1.5× or 2×). Bosses have minimal "signature" abilities
 *   implemented: trample speed, heavy thump double-dmg, armor reduction.
 *   The rest are flagged in data and Phase 8+ can flesh them out.
 *
 *   When a boss spawns, all remaining standard zombies get a +10% speed
 *   frenzy buff (applied in combat.js on the spawn-boss hook).
 */

const ROUND_COUNTS = [3, 6, 10, 15, 21, 28, 35, 42, 46, 50];

// ============================================================
// STANDARD ZOMBIES (round 1–10)
// ============================================================
/**
 * The 10 round-specific standard zombies. Stats derive from the scaling
 * formula; names, sprites, and optional modifiers are defined here.
 *
 *   speedMul — per-type multiplier on the base walk speed (0.5 tiles/s)
 *   armor    — flat damage reduction on incoming attacks (min 1 dmg)
 */
export const ZOMBIE_TYPES = [
  { id: 'shambling_husk',    name: 'Shambling Husk',     sprite: '🧟',  speedMul: 1.0 },
  { id: 'rotted_squire',     name: 'Rotted Squire',      sprite: '🧟‍♂️', speedMul: 1.0 },
  { id: 'grave_bound_wight', name: 'Grave-Bound Wight',  sprite: '👻',  speedMul: 1.1 },
  { id: 'blighted_archer',   name: 'Blighted Archer',    sprite: '🏹',  speedMul: 1.0 },
  { id: 'plague_knight',     name: 'Plague-Knight',      sprite: '🛡️',  speedMul: 0.9, armor: 2 },
  { id: 'crypt_ghoul',       name: 'Crypt Ghoul',        sprite: '🦇',  speedMul: 1.2 },
  { id: 'fallen_paladin',    name: 'Fallen Paladin',     sprite: '⚔️',  speedMul: 1.0, armor: 3 },
  { id: 'bone_grit_colossus',name: 'Bone-Grit Colossus', sprite: '💀',  speedMul: 0.8, armor: 5 },
  { id: 'lich_apprentice',   name: 'Lich Apprentice',    sprite: '🧙',  speedMul: 1.1 },
  { id: 'abyssal_revenant',  name: 'Abyssal Revenant',   sprite: '👹',  speedMul: 1.0, armor: 4 },
];

// ============================================================
// BOSSES (round 1–10, one per round)
// ============================================================
/**
 * Each boss is a single high-HP unit that spawns after the standard
 * wave is depleted. Boss abilities (partial implementation for Phase 8):
 *
 *   trample     — +20% speed (R2)
 *   heavyThump  — every 3rd attack deals 2× damage (R1)
 *   armor       — flat incoming damage reduction (R4+, R8 extra)
 *   soulReap    — boss heals 5 HP on each plant kill (R3)
 *   — remaining abilities (Venom Spit / Freezing Aura / Burn Step /
 *     Phase Shift / Blight Breath / Death's Call) are declared as
 *     flavor on the boss data but NOT wired into combat for Phase 8.
 *     Phase 8+ / Phase 11 will specialize them.
 */
export const BOSSES = [
  {
    id: 'grave_warden',
    name: 'The Grave-Warden',
    sprite: '💂',
    hp: 60, dmg: 10,
    speedMul: 1.0, scale: 1.5,
    ability: 'Heavy Thump',
    abilityKey: 'heavyThump',
  },
  {
    id: 'rot_hoof_centaur',
    name: 'Rot-Hoof Centaur',
    sprite: '🐎',
    hp: 90, dmg: 16,
    speedMul: 1.2, scale: 1.5,
    ability: 'Trample',
    abilityKey: 'trample',
  },
  {
    id: 'cursed_harvester',
    name: 'Cursed Harvester',
    sprite: '🪦',
    hp: 120, dmg: 22,
    speedMul: 1.0, scale: 1.6,
    ability: 'Soul Reap',
    abilityKey: 'soulReap',
  },
  {
    id: 'iron_bound_ogre',
    name: 'Iron-Bound Ogre',
    sprite: '👹',
    hp: 150, dmg: 28,
    speedMul: 0.8, scale: 1.8,
    armor: 3,
    ability: 'Armor Plating',
    abilityKey: 'armor',
  },
  {
    id: 'blight_widow',
    name: 'The Blight-Widow',
    sprite: '🕷️',
    hp: 180, dmg: 34,
    speedMul: 1.0, scale: 1.6,
    ability: 'Venom Spit',
    abilityKey: 'venomSpit',
  },
  {
    id: 'frost_lich_overseer',
    name: 'Frost-Lich Overseer',
    sprite: '❄️',
    hp: 210, dmg: 40,
    speedMul: 0.9, scale: 1.7,
    ability: 'Freezing Aura',
    abilityKey: 'freezingAura',
  },
  {
    id: 'infernal_juggernaut',
    name: 'Infernal Juggernaut',
    sprite: '🔥',
    hp: 240, dmg: 46,
    speedMul: 0.9, scale: 1.8,
    ability: 'Burn-Step',
    abilityKey: 'burnStep',
  },
  {
    id: 'shadow_stalker_wraith',
    name: 'Shadow-Stalker Wraith',
    sprite: '👤',
    hp: 270, dmg: 52,
    speedMul: 1.1, scale: 1.7,
    ability: 'Phase Shift',
    abilityKey: 'phaseShift',
  },
  {
    id: 'necro_dragon',
    name: 'Necro-Dragon Fledgling',
    sprite: '🐉',
    hp: 300, dmg: 58,
    speedMul: 1.0, scale: 1.9,
    ability: 'Blight Breath',
    abilityKey: 'blightBreath',
  },
  {
    id: 'arch_lich_malakor',
    name: 'The Arch-Lich Malakor',
    sprite: '💀',
    hp: 500, dmg: 80,
    speedMul: 0.9, scale: 2.0,
    ability: "Death's Call",
    abilityKey: 'deathsCall',
  },
];

// ============================================================
// COUNT + TYPE LOOKUP
// ============================================================

export function zombieCountForRound(round) {
  if (round <= 0) return 0;
  if (round <= ROUND_COUNTS.length) return ROUND_COUNTS[round - 1];
  // Endless: extrapolate with +5 per round past 10
  return ROUND_COUNTS[ROUND_COUNTS.length - 1] + (round - 10) * 5;
}

/**
 * Round 1-10: look up the specific zombie type.
 * Endless: cycle through a mix of easy and hard types (spec: "a mix of
 * Easy mode zombies and Insane mode zombies").
 */
function zombieTypeDefForRound(round) {
  if (round >= 1 && round <= ZOMBIE_TYPES.length) {
    return ZOMBIE_TYPES[round - 1];
  }
  // Endless: alternate between round 1 and round 10 types each round,
  // with intermediate types mixed in.
  const idx = (round * 3) % ZOMBIE_TYPES.length;
  return ZOMBIE_TYPES[idx];
}

function bossDefForRound(round) {
  if (round >= 1 && round <= BOSSES.length) {
    return BOSSES[round - 1];
  }
  // Endless: cycle through bosses
  const idx = (round - 1) % BOSSES.length;
  return BOSSES[idx];
}

// ============================================================
// TYPE CONSTRUCTION
// ============================================================

const BASE_SPEED = 0.5; // tiles per second

export function makeZombieType(round, diff = {}) {
  const def = zombieTypeDefForRound(round);
  const baseHp = 10 + round * 10;
  const baseDmg = 2 + round * 3;
  const hpMul = diff.enemyHPMul ?? 1;
  const dmgMul = diff.enemyDmgMul ?? 1;
  return {
    id: def.id,
    name: def.name,
    sprite: def.sprite,
    maxHp: Math.max(1, Math.round(baseHp * hpMul)),
    dmg: Math.max(1, Math.round(baseDmg * dmgMul)),
    speed: BASE_SPEED * (def.speedMul ?? 1),
    attackInterval: 1.0,
    gold: 1,
    armor: def.armor ?? 0,
    isBoss: false,
  };
}

export function makeBossType(round, diff = {}) {
  const def = bossDefForRound(round);
  const hpMul = diff.enemyHPMul ?? 1;
  const dmgMul = diff.enemyDmgMul ?? 1;
  return {
    id: def.id,
    name: def.name,
    sprite: def.sprite,
    maxHp: Math.max(1, Math.round(def.hp * hpMul)),
    dmg: Math.max(1, Math.round(def.dmg * dmgMul)),
    speed: BASE_SPEED * (def.speedMul ?? 1),
    attackInterval: 1.2,
    gold: 10 + round * 2, // bosses drop more gold
    armor: def.armor ?? 0,
    scale: def.scale ?? 1.5,
    ability: def.ability,
    abilityKey: def.abilityKey,
    isBoss: true,
  };
}

// ============================================================
// SPAWN SCHEDULE
// ============================================================

const GRID_ROWS = 5;
const SPAWN_WINDOW_BASE_SEC = 18;
const SPAWN_WINDOW_PER_ROUND_SEC = 4;
const BOSS_DELAY_AFTER_LAST = 3; // Boss spawns 3s after the last standard zombie

export function generateSpawnSchedule(round, diff = {}) {
  const count = zombieCountForRound(round);
  const windowSec =
    SPAWN_WINDOW_BASE_SEC + (round - 1) * SPAWN_WINDOW_PER_ROUND_SEC;
  const schedule = [];
  const type = makeZombieType(round, diff);

  // Standard wave: round-robin across rows with jitter in timing
  for (let i = 0; i < count; i++) {
    const baseTime = (i / Math.max(1, count - 1)) * windowSec;
    const jitter = (Math.random() - 0.5) * (windowSec / count) * 0.6;
    const time = Math.max(0, baseTime + jitter);
    const row = i % GRID_ROWS;
    schedule.push({ time, type, row, isBoss: false });
  }

  // Boss spawns after the last standard zombie, in the middle row
  const boss = makeBossType(round, diff);
  const bossTime = windowSec + BOSS_DELAY_AFTER_LAST;
  const bossRow = Math.floor(GRID_ROWS / 2); // middle row
  schedule.push({ time: bossTime, type: boss, row: bossRow, isBoss: true });

  schedule.sort((a, b) => a.time - b.time);
  return schedule;
}
