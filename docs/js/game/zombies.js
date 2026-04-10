/**
 * Zombie Data + Spawn Schedule
 *
 * Phase 7 uses a single generic "Shambling Husk" type for all rounds.
 * Phase 8 adds the full 10-round roster and boss types with unique
 * abilities. The scaling formulas and spawn counts are already matched
 * to the design doc so Phase 8 just needs to specialize names/sprites.
 *
 * Scaling (from CLAUDE.md):
 *   HP  = 10 + (round × 10)
 *   DMG = 2  + (round × 3)
 *   Count per round = [3, 6, 10, 15, 21, 28, 35, 42, 46, 50]
 */

const ROUND_COUNTS = [3, 6, 10, 15, 21, 28, 35, 42, 46, 50];

/**
 * Look up (or extrapolate) how many zombies spawn in a given round.
 * Endless mode uses the formula for rounds > 10.
 */
export function zombieCountForRound(round) {
  if (round <= 0) return 0;
  if (round <= ROUND_COUNTS.length) return ROUND_COUNTS[round - 1];
  // Endless: extrapolate with +5 per round past 10
  return ROUND_COUNTS[ROUND_COUNTS.length - 1] + (round - 10) * 5;
}

/**
 * Build a zombie type for the given round. Phase 7 is a single generic
 * type; Phase 8 will return different named zombies.
 *
 * @param {number} round
 * @param {object} diff — difficulty config from difficulty.js (for multipliers)
 */
export function makeZombieType(round, diff = {}) {
  const baseHp = 10 + round * 10;
  const baseDmg = 2 + round * 3;
  const hpMul = diff.enemyHPMul ?? 1;
  const dmgMul = diff.enemyDmgMul ?? 1;
  return {
    id: 'shambling_husk',
    name: 'Shambling Husk',
    sprite: '🧟',
    maxHp: Math.round(baseHp * hpMul),
    dmg: Math.round(baseDmg * dmgMul),
    speed: 0.5, // tiles per second (base; later zombies are faster)
    attackInterval: 1.0, // seconds between melee hits once blocked
    gold: 1, // gold awarded on kill
  };
}

/**
 * Generate a spawn schedule for the given round.
 *
 * Returns an array of { time, type, row } entries. Zombies are spread
 * across the available rows so the player can't turtle one lane.
 * Spawns are spread over `SPAWN_WINDOW_SEC` seconds (longer for higher
 * counts so late rounds don't overwhelm immediately).
 */
const GRID_ROWS = 5;
const SPAWN_WINDOW_BASE_SEC = 20; // Total spawn window for round 1
const SPAWN_WINDOW_PER_ROUND_SEC = 5; // Additional seconds per round

export function generateSpawnSchedule(round, diff = {}) {
  const count = zombieCountForRound(round);
  const window = SPAWN_WINDOW_BASE_SEC + (round - 1) * SPAWN_WINDOW_PER_ROUND_SEC;
  const schedule = [];
  const type = makeZombieType(round, diff);

  // Distribute spawns across the window. Small jitter to avoid perfect
  // clumping, and round-robin through the rows so no single lane is
  // completely ignored.
  for (let i = 0; i < count; i++) {
    const baseTime = (i / Math.max(1, count - 1)) * window;
    const jitter = (Math.random() - 0.5) * (window / count) * 0.6;
    const time = Math.max(0, baseTime + jitter);
    const row = i % GRID_ROWS;
    schedule.push({
      time,
      type,
      row,
    });
  }

  // Sort by time so we can process spawns with a simple pointer
  schedule.sort((a, b) => a.time - b.time);
  return schedule;
}
