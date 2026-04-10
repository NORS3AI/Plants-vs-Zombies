/**
 * Difficulty Configuration
 *
 * Source-of-truth for per-difficulty stats. Multipliers applied to
 * zombie HP/DMG; player HP and starting gold are absolute.
 */

export const DIFFICULTIES = Object.freeze({
  tutorial: {
    id: 'tutorial',
    label: 'Tutorial',
    playerHP: 100,
    startGold: 10,
    enemyHPMul: 0.75,
    enemyDmgMul: 0.75,
    locked: false,
  },
  easy: {
    id: 'easy',
    label: 'Easy',
    playerHP: 150,
    startGold: 10,
    enemyHPMul: 0.75,
    enemyDmgMul: 0.75,
    locked: false,
  },
  normal: {
    id: 'normal',
    label: 'Normal',
    playerHP: 100,
    startGold: 5,
    enemyHPMul: 1.0,
    enemyDmgMul: 1.0,
    locked: false,
  },
  hard: {
    id: 'hard',
    label: 'Hard',
    playerHP: 50,
    startGold: 3,
    enemyHPMul: 2.0,
    enemyDmgMul: 1.5,
    locked: false,
  },
  insane: {
    id: 'insane',
    label: 'Insane',
    playerHP: 25,
    startGold: 1,
    enemyHPMul: 3.5,
    enemyDmgMul: 3.0,
    locked: false,
  },
  endless: {
    id: 'endless',
    label: 'Endless',
    playerHP: 100,
    startGold: 5,
    enemyHPMul: 1.0,
    enemyDmgMul: 1.0,
    locked: true, // Unlocked by beating Round 10
  },
});

export function getDifficulty(id) {
  return DIFFICULTIES[id] ?? null;
}
