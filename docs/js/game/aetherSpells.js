/**
 * Aether-Root Spell Effects
 *
 * The 6 side-panel spells the PLAYER actively casts during combat.
 * Phase 9 wires all 6 to real combat state. Each spell is keyed by its
 * card id (from cards/aetherRoot.js) so the side panel can dispatch
 * by looking up the instance.cardId.
 *
 * Cooldown / oncePerRound tracking lives on the run-persistent
 * `aetherSpells` inventory built in Phase 5. This module just applies
 * the effects.
 */

import { getCombatState, GRID_COLS, GRID_ROWS } from './combat.js';
import { getCard } from '../cards/index.js';

// ---------- Effect implementations ----------

function healAether(run, amount) {
  const heal = amount === 'full' ? run.aetherRootMaxHP : amount;
  run.aetherRootHP = Math.min(run.aetherRootMaxHP, run.aetherRootHP + heal);
}

function addShield(run, amount) {
  run.aetherRootShield = (run.aetherRootShield ?? 0) + amount;
}

function damageAetherDirect(run, amount) {
  // Bypasses shield (used by Photosynthetic Burst: "reduces the
  // Aether-Root's current health by 5 HP")
  run.aetherRootHP = Math.max(0, run.aetherRootHP - amount);
}

const EFFECTS = {
  sap_mend(run, state) {
    healAether(run, 10);
    flashText(state, 'sap_mend', '+10 HP', 'green');
  },

  grove_shield(run, state) {
    addShield(run, 25);
    flashText(state, 'grove_shield', '+25 Shield', 'blue');
  },

  thorn_pulse(run, state) {
    // Knock all zombies back 2 tiles
    for (const z of state.zombies) {
      if (z.hp <= 0) continue;
      z.col = Math.min(GRID_COLS, z.col + 2);
      z.state = 'walking';
      z.blockedBy = null;
      z.attackTimer = 0;
    }
    flashText(state, 'thorn_pulse', 'Knockback!', 'blue');
  },

  photosynthetic_burst(run, state) {
    run.gold += 5;
    run.lastRoundGoldEarned = (run.lastRoundGoldEarned ?? 0) + 5;
    run.totalGoldEarned = (run.totalGoldEarned ?? 0) + 5;
    damageAetherDirect(run, 5);
    flashText(state, 'photo_burst', '+5g / -5 HP', 'gold');
  },

  natures_wrath(run, state) {
    // Spawn a continuous beam effect for 5 seconds down the center row.
    // tickCombat's beam updater applies DoT.
    const row = Math.floor(GRID_ROWS / 2);
    if (!state.activeBeams) state.activeBeams = [];
    state.activeBeams.push({
      row,
      duration: 5,
      remaining: 5,
      dps: 50,
    });
    flashText(state, 'natures_wrath', "NATURE'S WRATH!", 'red', row, 6);
  },

  verdant_rebirth(run, state) {
    healAether(run, 'full');
    addShield(run, 50);
    flashText(state, 'verdant_rebirth', 'REBIRTH!', 'green');
  },
};

function flashText(state, idSuffix, text, color, row = 2, col = 6) {
  if (!state?.floatingTexts) return;
  state.floatingTexts.push({
    id: `aether_${idSuffix}_${state.time.toFixed(2)}`,
    text,
    row,
    col,
    age: 0,
    maxAge: 1.8,
    color,
  });
}

// ---------- Public cast API ----------

/**
 * Cast an owned Aether-Root spell instance. Returns true on success.
 * Fails silently if the spell is on cooldown, has been used this round
 * (for oncePerRound spells), or combat isn't running.
 */
export function castAetherSpell(run, instanceId) {
  const state = getCombatState();
  if (!state) return false;
  const instance = (run.aetherSpells ?? []).find((s) => s.instanceId === instanceId);
  if (!instance) return false;
  const card = getCard(instance.cardId);
  if (!card) return false;

  // Cooldown check
  if ((instance.cooldownRemaining ?? 0) > 0) return false;
  if (card.oncePerRound && instance.usedThisRound) return false;

  const effect = EFFECTS[card.id];
  if (!effect) return false;
  effect(run, state);

  // Start the cooldown
  if (card.oncePerRound) {
    instance.usedThisRound = true;
  } else if (card.cooldown) {
    instance.cooldownRemaining = card.cooldown;
  }
  return true;
}

/** Tick all Aether-Root spell cooldowns by dt seconds. */
export function tickAetherCooldowns(run, dt) {
  if (!run?.aetherSpells) return;
  for (const s of run.aetherSpells) {
    if ((s.cooldownRemaining ?? 0) > 0) {
      s.cooldownRemaining = Math.max(0, s.cooldownRemaining - dt);
    }
  }
}

/**
 * Reset once-per-round flags and cooldowns at the start of combat.
 * Called from initCombat so every round starts with spells ready.
 */
export function resetAetherForRound(run) {
  if (!run?.aetherSpells) return;
  for (const s of run.aetherSpells) {
    s.usedThisRound = false;
    s.cooldownRemaining = 0;
  }
}

/** Apply active beam DoT effects (called from tickCombat). */
export function tickActiveBeams(state, dt) {
  if (!state?.activeBeams || state.activeBeams.length === 0) return;
  for (let i = state.activeBeams.length - 1; i >= 0; i--) {
    const beam = state.activeBeams[i];
    beam.remaining -= dt;
    if (beam.remaining <= 0) {
      state.activeBeams.splice(i, 1);
      continue;
    }
    // Apply dps*dt damage to all zombies in the beam's row
    for (const z of state.zombies) {
      if (z.hp <= 0) continue;
      if (z.row !== beam.row) continue;
      z.hp -= beam.dps * dt;
    }
  }
}
