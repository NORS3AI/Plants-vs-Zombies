/**
 * Grid Placement Module
 *
 * Phase 6 scope:
 *  - Click-to-select then click-to-place interaction model (mobile-friendly)
 *  - Click a placed card to open a targeting/remove modal
 *  - Valid-tile highlighting when a card is selected
 *  - Auto-merge 3 Sunflowers → 1 Gilded Rose
 *  - Renders the deck inventory (unplaced cards only) + grid (placed cards)
 *  - Sell button on each deck card (separate from click-to-select)
 *
 * Data layout:
 *  - run.deck[i].gridRow / gridCol — set when placed, null when in deck
 *  - run.deck[i].targeting — 'first' | 'strongest' | 'weakest' | 'none'
 */

import {
  getCard,
  rollSell,
  RARITIES,
} from '../cards/index.js';
import { renderGrid, STAGING_COL } from '../game/grid.js';
import { Save } from '../game/save.js';
import { renderCard, renderGridCardIcon } from './cardView.js';
import { showModal, confirmModal } from './modal.js';

// Maximum number of plants that can be placed on the grid at once.
// The deck itself is uncapped — this cap just gates how many of the
// player's cards can be active in combat simultaneously.
export const MAX_PLACED_PLANTS = 10;

// ---------- State ----------
// Current selection is module-scoped. Null = nothing selected.
// When non-null, grid tiles highlight as valid drop targets.
let _selection = null;
let _audio = null;
let _onChange = null;
let _onFirstPlace = null;
let _instanceCounter = 1;
let _currentRun = null; // set each renderPlacement; read by sort handler

// ---------- Plant Deck sort ----------
// Persists for the session; reset on page reload.
let _deckSortKey = 'rarity'; // 'rarity' | 'damage' | 'name' | 'health'
let _deckSortBarWired = false;
let _spellSortKey = 'rarity'; // 'rarity' | 'name'
let _spellSortBarWired = false;

const RARITY_TIERS = {};
for (const [id, r] of Object.entries(RARITIES)) RARITY_TIERS[id] = r.tier ?? 0;

function sortDeckInstances(instances) {
  return instances.slice().sort((a, b) => {
    const ca = getCard(a.cardId);
    const cb = getCard(b.cardId);
    if (!ca || !cb) return 0;
    switch (_deckSortKey) {
      case 'name':
        return ca.name.localeCompare(cb.name);
      case 'rarity':
        return (RARITY_TIERS[cb.rarity] ?? 0) - (RARITY_TIERS[ca.rarity] ?? 0)
            || ca.name.localeCompare(cb.name);
      case 'health':
        return (cb.health ?? 0) - (ca.health ?? 0)
            || ca.name.localeCompare(cb.name);
      case 'damage':
        return (cb.damage ?? 0) - (ca.damage ?? 0)
            || ca.name.localeCompare(cb.name);
      default:
        return 0;
    }
  });
}

/** Initialize the placement module. Call once at boot. */
export function initPlacement({ audio, onChange, onFirstPlace }) {
  _audio = audio;
  _onChange = onChange;
  _onFirstPlace = onFirstPlace;
}

function freshInstanceId() {
  return `inst_${Date.now()}_${_instanceCounter++}`;
}

// ============================================================
// SELECTION
// ============================================================

/** Clear any active placement selection and re-render. */
export function clearSelection(run) {
  if (!_selection) return;
  _selection = null;
  renderPlacement(run);
}

/**
 * Find an instance across both decks by id. Returns the instance or
 * null. Used by the selection / cast / sell paths so the rest of
 * placement.js doesn't have to care which deck an item lives in.
 */
function findInstance(run, instanceId) {
  return (
    run.deck?.find((d) => d.instanceId === instanceId) ??
    run.spellDeck?.find((d) => d.instanceId === instanceId) ??
    null
  );
}

/**
 * Click a deck card (unplaced). Toggles selection.
 */
function selectDeckCard(run, instanceId) {
  if (_selection && _selection.instanceId === instanceId) {
    _selection = null;
  } else {
    _selection = { instanceId };
  }
  _audio?.playSfx('click');
  renderPlacement(run);
}

/**
 * Place the selected card at (row, col). Returns true on success.
 * Any plant with an `evolution.requiresSameId` block will trigger
 * a merge check after placement (cascading through chain tiers
 * atomically so the player can collapse a whole line in one tap).
 */
function placeAt(run, row, col) {
  if (!_selection) return false;
  const instance = findInstance(run, _selection.instanceId);
  if (!instance) return false;

  // Tile occupied?
  const existing = findAtTile(run, row, col);
  if (existing) return false;

  // Staging column is zombie-formation territory — plants can't go there.
  if (col === STAGING_COL) {
    flashError("Plants can't be placed in the staging column.");
    _audio?.playSfx('back');
    return false;
  }

  // Cap active plants at MAX_PLACED_PLANTS. Opening chests is unlimited
  // but the grid can only hold 10 simultaneously.
  const placedCount = run.deck.filter((d) => d.gridRow != null).length;
  if (placedCount >= MAX_PLACED_PLANTS) {
    flashError(`Max ${MAX_PLACED_PLANTS} plants on the grid. Remove one first.`);
    _audio?.playSfx('back');
    return false;
  }

  instance.gridRow = row;
  instance.gridCol = col;

  _selection = null;
  _audio?.playSfx('click');
  _onFirstPlace?.();

  // Check for evolution merge (any plant with `evolution.requiresSameId`:
  // Sunflower → Gilded Rose, Seedling → Blooming → Scrubber, etc.).
  // mergeEvolution consults the card definition, so no hard-coded ids.
  const placedCard = getCard(instance.cardId);
  if (placedCard?.evolution?.requiresSameId) {
    mergeEvolution(run, instance.cardId, row, col);
  }

  _onChange?.();
  renderPlacement(run);
  return true;
}

// ============================================================
// GRID CLICK HANDLING
// ============================================================

function handleTileClick(run, row, col) {
  const atTile = findAtTile(run, row, col);

  if (_selection) {
    const instance = findInstance(run, _selection.instanceId);
    if (!instance) {
      clearSelection(run);
      return;
    }
    const card = getCard(instance.cardId);

    if (card?.type === 'spell') {
      // Spells have a different cast path depending on their target type.
      castSpellAtTile(run, instance, card, row, col, atTile);
      return;
    }

    // Plant placement path: empty tile = place, occupied = switch the
    // tap to "open modal for that plant" so taps never feel wasted.
    if (!atTile) {
      placeAt(run, row, col);
    } else {
      _selection = null;
      openPlacedCardModal(run, atTile);
      renderPlacement(run);
    }
    return;
  }

  if (atTile) {
    openPlacedCardModal(run, atTile);
  }
}

// ============================================================
// SPELL CASTING
// ============================================================

/**
 * Attempt to cast the selected spell at (row, col). Different spell
 * target types use different click semantics:
 *   - plant:        click an occupied tile (plant) to buff it
 *   - self:         click any tile to grant self effect
 *   - board:        click any tile; applies to all plants
 *   - lane:         click any tile in the target row; applies to whole row
 *   - tile:         click any tile; applies at that location
 *   - plant_group:  not yet supported; shows a toast
 */
function castSpellAtTile(run, instance, card, row, col, targetPlant) {
  const effect = card.effect;
  if (!effect) {
    flashError(`${card.name} has no effect.`);
    return;
  }

  let success = false;
  switch (card.target) {
    case 'plant':
      if (!targetPlant) {
        flashError(`Cast ${card.name} on a plant (tap a plant on the grid).`);
        return;
      }
      success = applyPlantSpell(effect, targetPlant, card, run);
      break;

    case 'self':
      success = applySelfSpell(effect, run, card);
      break;

    case 'board':
      success = applyBoardSpell(effect, run, card);
      break;

    case 'lane':
      success = applyLaneSpell(effect, run, row, card);
      break;

    case 'tile':
      success = applyTileSpell(effect, run, row, col, card);
      break;

    case 'plant_group':
      flashError(`${card.name} requires the Synthesis UI (coming soon).`);
      return;

    default:
      flashError(`${card.name}: target '${card.target}' not supported.`);
      return;
  }

  if (!success) return;

  // Consume the spell instance from whichever deck it lived in.
  // New saves keep spells in run.spellDeck; older saves may still
  // have them in run.deck until the migration runs.
  let idx = run.spellDeck?.findIndex((d) => d.instanceId === instance.instanceId) ?? -1;
  if (idx >= 0) {
    run.spellDeck.splice(idx, 1);
  } else {
    idx = run.deck.findIndex((d) => d.instanceId === instance.instanceId);
    if (idx >= 0) run.deck.splice(idx, 1);
  }

  _selection = null;
  _audio?.playSfx('go');
  flashToast(`✨ ${card.name} cast!`);
  _onChange?.();
  renderPlacement(run);
}

/**
 * Apply a plant-targeted spell to a placed instance. Stores the effect
 * as a buff on the instance so it's persisted through save/load and
 * re-applied to the runtime plant each combat init.
 */
function applyPlantSpell(effect, targetInstance, card, run) {
  if (!targetInstance.buffs) targetInstance.buffs = [];
  const targetCard = getCard(targetInstance.cardId);
  if (!targetCard) return false;

  // Every buff is tagged with the spell that created it so UI
  // renderers can show "Wild Growth × 2" etc. on the card / grid tile.
  const source = { spellId: card.id, spellName: card.name };

  switch (effect.type) {
    case 'shield': {
      const maxHp = targetCard.health ?? 0;
      const amount = effect.valueType === 'pct_max_hp'
        ? Math.round(maxHp * effect.value)
        : effect.value;
      // Shields re-apply each round (refreshed in initCombat)
      targetInstance.buffs.push({ type: 'shield', value: amount, permanent: true, ...source });
      return true;
    }
    case 'permanent_hp_buff':
      targetInstance.buffs.push({ type: 'hp_boost', value: effect.value, permanent: true, ...source });
      return true;
    case 'damage_buff':
      // Nectar Rush: +15 DMG for the round only
      targetInstance.buffs.push({ type: 'dmg_boost', value: effect.value, permanent: false, ...source });
      return true;
    case 'cast_speed_buff':
      // Aether Bloom: permanent -1s cast time (stacks if cast multiple times).
      targetInstance.buffs.push({ type: 'cast_speed', value: effect.value, permanent: true, ...source });
      return true;
    case 'damage_mul':
      // Arcane Surge: 2× damage for 5s (treat as per-round for simplicity)
      targetInstance.buffs.push({ type: 'dmg_mul', value: effect.value, permanent: false, ...source });
      return true;
    case 'tier_up':
      return tierUpPlantInstance(targetInstance, targetCard, effect, run);
    default:
      flashError(`Effect '${effect.type}' not implemented yet.`);
      return false;
  }
}

/**
 * Magic Mushroom — Tier Up.
 *
 * On economy / gold-producing plants (Sunflower, Gilded Rose, Amber
 * Grain, Crystal Fern, Midas Mandrake, Thorn, Golden Grain, Diamond
 * Fern, Bloody Mandrake — anything with `card.economy` or
 * `card.category === 'economy'`): duplicates the plant. A fresh
 * unplaced copy is added to the deck so the player can stack gold
 * production or eventually hit the evolution merge threshold. The
 * original is untouched.
 *
 * On any other plant: bumps `instance.tier` by +1 (defaulting from 1),
 * capped at `effect.maxTier` (99). Combat.js reads the tier during
 * hydration and adds +hpPerTier and +dmgPerTier per tier beyond 1.
 */
function tierUpPlantInstance(instance, card, effect, run) {
  // Cards with a tierEffect field (like Acorn) always tier up even if
  // they're economy plants. The custom scaling is applied in combat.js.
  if (card.tierEffect) {
    const maxTier = effect.maxTier ?? 99;
    const currentTier = instance.tier ?? 1;
    if (currentTier >= maxTier) {
      flashError(`${card.name} is already at T${maxTier} (the cap).`);
      return false;
    }
    instance.tier = currentTier + 1;
    const te = card.tierEffect;
    const extras = [];
    if (te.goldPerTier) extras.push(`+${te.goldPerTier}g`);
    if (te.castTimePerTier) extras.push(`+${te.castTimePerTier}s cast`);
    flashToast(`🍄 ${card.name} T${instance.tier}! ${extras.join(', ')}`);
    return true;
  }

  // Economy / gold-producing plants duplicate instead of tiering up.
  const isEconomy = card.category === 'economy' || !!card.economy;
  if (isEconomy) {
    const freshInst = {
      cardId: card.id,
      instanceId: freshInstanceId(),
      sellValue: rollSell(card),
    };
    run.deck.push(freshInst);
    flashToast(`🍄 A new ${card.name} sprouts in your deck!`);
    return true;
  }

  // Standard plants: +10 HP and +5 DMG per tier.
  const maxTier = effect.maxTier ?? 99;
  const currentTier = instance.tier ?? 1;
  if (currentTier >= maxTier) {
    flashError(`${card.name} is already at T${maxTier} (the cap).`);
    return false;
  }
  instance.tier = currentTier + 1;
  flashToast(`🍄 ${card.name} is now T${instance.tier}!`);
  return true;
}

function applySelfSpell(effect, run, card) {
  switch (effect.type) {
    case 'gold_grant':
      run.gold += effect.value ?? 0;
      run.lastRoundGoldEarned = (run.lastRoundGoldEarned ?? 0) + (effect.value ?? 0);
      run.totalGoldEarned = (run.totalGoldEarned ?? 0) + (effect.value ?? 0);
      return true;
    default:
      flashError(`Self spell '${effect.type}' not implemented yet.`);
      return false;
  }
}

function applyBoardSpell(effect, run, card) {
  const source = card ? { spellId: card.id, spellName: card.name } : {};
  switch (effect.type) {
    case 'heal_all': {
      // World-Tree Seed: full heal + shield on all placed plants
      const shieldAmount = effect.shield ?? 0;
      let touched = 0;
      for (const inst of run.deck) {
        if (inst.gridRow == null) continue;
        if (!inst.buffs) inst.buffs = [];
        inst.buffs.push({ type: 'shield', value: shieldAmount, permanent: true, ...source });
        touched++;
      }
      if (touched === 0) {
        flashError('No plants on the grid to heal.');
        return false;
      }
      return true;
    }
    case 'link_all_plants': {
      // Mycelium Network: buff every placed plant with +20% DMG and
      // +20 HP for the round. No special targeting UI — just works.
      const dmgMul = 1 + (effect.dmgBuffPct ?? 0.2);
      const hpBuff = effect.hpBuff ?? 20;
      let touched = 0;
      for (const inst of run.deck) {
        if (inst.gridRow == null) continue;
        if (!inst.buffs) inst.buffs = [];
        inst.buffs.push({ type: 'dmg_mul', value: dmgMul, permanent: false, ...source });
        inst.buffs.push({ type: 'hp_boost', value: hpBuff, permanent: false, ...source });
        touched++;
      }
      if (touched === 0) {
        flashError('No plants on the grid to link.');
        return false;
      }
      return true;
    }
    case 'mycelium_tower': {
      // Mycelium Tower (artifact): permanent +100% damage and +100 HP
      // to every placed plant. These are permanent buffs that survive
      // round-end cleanup.
      const dmgMul = effect.dmgMul ?? 2.0;
      const hpBuff = effect.hpBuff ?? 100;
      let touched = 0;
      for (const inst of run.deck) {
        if (inst.gridRow == null) continue;
        if (!inst.buffs) inst.buffs = [];
        inst.buffs.push({ type: 'dmg_mul', value: dmgMul, permanent: true, ...source });
        inst.buffs.push({ type: 'hp_boost', value: hpBuff, permanent: true, ...source });
        touched++;
      }
      if (touched === 0) {
        flashError('No plants on the grid to empower.');
        return false;
      }
      return true;
    }
    default:
      flashError(`Board spell '${effect.type}' not implemented yet.`);
      return false;
  }
}

/**
 * Lane-targeted spell: applies an effect to all plants currently
 * placed in the clicked row. Cast in shop mode, effect persists as a
 * per-round buff on each plant instance and is hydrated in combat.
 */
function applyLaneSpell(effect, run, row, card) {
  switch (effect.type) {
    case 'reset_cooldowns_lane': {
      // Chrono-Bloom: slash cast time for all plants in the lane.
      // Spec: "Resets the cast time of all plants in a specific lane
      // for 5 seconds" — since we can't easily do a 5-second timed
      // effect in the buff system, we interpret this as a strong
      // per-round castSpeed reduction on every plant in the lane.
      const plantsInRow = run.deck.filter(
        (d) => d.gridRow === row && d.gridCol != null,
      );
      if (plantsInRow.length === 0) {
        flashError(`No plants in row ${row + 1}. Cast Chrono-Bloom on a row with plants.`);
        return false;
      }
      for (const inst of plantsInRow) {
        if (!inst.buffs) inst.buffs = [];
        // -1.5s cast time (combat.js clamps final castTimer to 0.1 min)
        inst.buffs.push({
          type: 'cast_speed',
          value: -1.5,
          permanent: false,
          spellId: card.id,
          spellName: card.name,
        });
      }
      flashToast(`⏱ ${card.name} — row ${row + 1} cast time slashed`);
      return true;
    }
    case 'damage_lane': {
      // Solar Flare: no zombies in shop mode, so store a pending
      // effect that triggers on the first tick of combat against all
      // zombies in the chosen row.
      if (!run.pendingSpellEffects) run.pendingSpellEffects = [];
      run.pendingSpellEffects.push({
        type: 'damage_lane',
        row,
        value: effect.value ?? 50,
        spellName: card.name,
      });
      flashToast(`🔥 ${card.name} — row ${row + 1} will burn at round start`);
      return true;
    }
    default:
      flashError(`Lane spell '${effect.type}' not implemented yet.`);
      return false;
  }
}

/**
 * Tile-targeted spell: stores a pending effect that triggers at the
 * clicked tile on the first tick of combat.
 */
function applyTileSpell(effect, run, row, col, card) {
  switch (effect.type) {
    case 'damage_area': {
      // Spore-Burst: pending AoE damage at this tile
      if (!run.pendingSpellEffects) run.pendingSpellEffects = [];
      run.pendingSpellEffects.push({
        type: 'damage_area',
        row,
        col,
        value: effect.value ?? 5,
        radius: effect.radius ?? 1,
        spellName: card.name,
      });
      flashToast(`💨 ${card.name} — tile (${row + 1},${col + 1}) primed`);
      return true;
    }
    default:
      flashError(`Tile spell '${effect.type}' not implemented yet.`);
      return false;
  }
}

// ============================================================
// PLACED CARD MODAL — targeting + remove
// ============================================================

async function openPlacedCardModal(run, instance) {
  const card = getCard(instance.cardId);
  if (!card) return;

  const bodyHtml = buildPlacedCardBody(card, instance);

  const choice = await showModal({
    title: card.name,
    bodyHtml,
    buttons: [
      { label: 'Remove', value: 'remove', kind: 'danger' },
      { label: 'Close', value: null, kind: 'default' },
    ],
    showClose: true,
    extraClass: 'modal-dialog-placed',
    onReady: (dialog) => {
      // Attach click handlers to targeting buttons so taps update
      // instance.targeting in place, WITHOUT closing the modal.
      dialog.querySelectorAll('.placed-targeting-btn').forEach((btn) => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const newTarget = btn.dataset.targeting;
          if (!newTarget) return;
          instance.targeting = newTarget;
          // Update visual "is-selected" state
          dialog.querySelectorAll('.placed-targeting-btn').forEach((b) => {
            b.classList.toggle('is-selected', b === btn);
          });
          _audio?.playSfx('click');
          _onChange?.();
        });
      });

      // "Clear all buffs" button: wipes the instance.buffs array and
      // re-renders the modal body in place so the player can see the
      // result without any modal flicker.
      const clearBtn = dialog.querySelector('.placed-clear-buffs-btn');
      if (clearBtn) {
        clearBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          const count = (instance.buffs ?? []).length;
          instance.buffs = [];
          _audio?.playSfx('back');
          _onChange?.();
          renderPlacement(run);
          flashToast(`🧹 Cleared ${count} buff${count === 1 ? '' : 's'}.`);
          // Replace the modal body in-place so the player sees the
          // updated stats and the (now empty) buffs list immediately.
          const body = dialog.querySelector('.placed-modal-body');
          if (body) {
            const card = getCard(instance.cardId);
            if (card) {
              const newBody = document.createElement('div');
              newBody.innerHTML = buildPlacedCardBody(card, instance);
              body.replaceWith(newBody.firstElementChild);
              // Re-wire targeting buttons on the new body
              dialog.querySelectorAll('.placed-targeting-btn').forEach((btn) => {
                btn.addEventListener('click', (ev) => {
                  ev.stopPropagation();
                  const newTarget = btn.dataset.targeting;
                  if (!newTarget) return;
                  instance.targeting = newTarget;
                  dialog.querySelectorAll('.placed-targeting-btn').forEach((b) => {
                    b.classList.toggle('is-selected', b === btn);
                  });
                  _audio?.playSfx('click');
                  _onChange?.();
                });
              });
            }
          }
        });
      }
    },
  });

  if (choice === 'remove') {
    // Keep the plant instance (and its buffs) — just demote it off
    // the grid back into the deck inventory. The player can re-place
    // it later and it will keep everything that was cast on it.
    instance.gridRow = null;
    instance.gridCol = null;
    _audio?.playSfx('back');
    _onChange?.();
    renderPlacement(run);
  } else {
    // Even on "Close" we might have updated targeting — re-render so
    // the grid reflects any state changes.
    renderPlacement(run);
  }
}

/**
 * Build the HTML body for the placed-card modal. Shows stats,
 * description, active buffs (stacked), and inline targeting buttons.
 */
function buildPlacedCardBody(card, instance) {
  const buffs = instance.buffs ?? [];
  const currentTarget = instance.targeting ?? card.targetingDefault ?? 'first';
  const tier = Math.max(1, instance.tier ?? 1);

  // Effective stats = base card + tier bonus + buff bonuses. We compute
  // them here so the player can see what the plant will actually do in
  // combat without having to mentally add up every buff.
  const effective = computeEffectiveStats(card, instance, tier);

  const tierBadge = tier > 1
    ? `<span class="placed-tier-badge">T${tier}</span>`
    : '';

  const buffsHtml = buffs.length > 0
    ? `
      <div class="placed-section">
        <h4>Active Spells (${buffs.length})</h4>
        <ul class="placed-buffs-list">
          ${buffs.map((b) => `<li>${describeBuff(b, card)}</li>`).join('')}
        </ul>
        <button type="button" class="btn btn-small btn-danger placed-clear-buffs-btn">Clear all buffs</button>
      </div>
    `
    : '';

  const targetingHtml = card.damage > 0
    ? `
      <div class="placed-section">
        <h4>Targeting</h4>
        <div class="placed-targeting-btns">
          <button type="button" class="placed-targeting-btn ${currentTarget === 'first' ? 'is-selected' : ''}" data-targeting="first">🎯 First</button>
          <button type="button" class="placed-targeting-btn ${currentTarget === 'strongest' ? 'is-selected' : ''}" data-targeting="strongest">💪 Strongest</button>
          <button type="button" class="placed-targeting-btn ${currentTarget === 'weakest' ? 'is-selected' : ''}" data-targeting="weakest">🩸 Weakest</button>
        </div>
      </div>
    `
    : '<p class="placed-no-target"><em>This plant does not attack.</em></p>';

  return `
    <div class="placed-modal-body">
      <p class="placed-modal-stats">${tierBadge}${effective.statsHtml}</p>
      <p class="placed-modal-desc">${escapeHtml(card.description ?? '')}</p>
      ${buffsHtml}
      ${targetingHtml}
    </div>
  `;
}

/**
 * Compute effective in-combat stats from a card + instance by adding
 * tier bonuses and every stored buff. Returns a pre-formatted HTML
 * string ready to drop into the modal.
 *
 * Tier:   +10 HP, +5 DMG per tier above 1
 * Buffs:  hp_boost, dmg_boost, dmg_mul, cast_speed (per buff)
 */
function computeEffectiveStats(card, instance, tier) {
  const baseHp = card.health ?? 0;
  const baseDmg = card.damage ?? 0;
  const baseCast = card.castTime ?? 0;
  const te = card.tierEffect;

  // Cards with a tierEffect (Acorn) scale gold/cast per tier instead
  // of the standard +10 HP / +5 DMG.
  const hasTierEffect = !!te;
  const tierHpBonus = hasTierEffect ? 0 : (tier - 1) * 10;
  const tierDmgBonus = hasTierEffect ? 0 : (tier - 1) * 5;
  const tierCastBonus = te?.castTimePerTier ? (tier - 1) * te.castTimePerTier : 0;

  let hp = baseHp + tierHpBonus;
  let dmg = baseDmg + tierDmgBonus;
  let dmgMul = 1;
  let cast = baseCast + tierCastBonus;

  for (const buff of instance.buffs ?? []) {
    switch (buff.type) {
      case 'hp_boost': hp += buff.value; break;
      case 'dmg_boost': dmg += buff.value; break;
      case 'dmg_mul': dmgMul *= buff.value; break;
      case 'cast_speed': cast = Math.max(0.1, cast + buff.value); break;
    }
  }

  const finalDmg = Math.round(dmg * dmgMul);
  const parts = [`${hp} HP`];
  if (baseDmg > 0) parts.push(`${finalDmg} DMG`);
  if (baseCast > 0) parts.push(`${cast.toFixed(1)}s cast`);
  // Show effective gold for economy plants with tierEffect
  if (te?.goldPerTier && card.economy?.goldPerCast) {
    const goldPerCast = card.economy.goldPerCast + (tier - 1) * te.goldPerTier;
    parts.push(`${goldPerCast}g / cast`);
  }
  return {
    statsHtml: parts.map((p) => escapeHtml(p)).join(' · '),
    hp,
    dmg: finalDmg,
  };
}

/**
 * Human-readable description of a stored buff entry.
 */
function describeBuff(buff, card) {
  switch (buff.type) {
    case 'shield':
      return `🛡 <strong>+${buff.value}</strong> shield`;
    case 'hp_boost':
      return `❤️ <strong>+${buff.value}</strong> max HP`;
    case 'dmg_boost':
      return `⚔️ <strong>+${buff.value}</strong> damage`;
    case 'dmg_mul':
      return `⚡ <strong>×${buff.value}</strong> damage multiplier`;
    case 'cast_speed': {
      const sign = buff.value < 0 ? '' : '+';
      return `⏱ <strong>${sign}${buff.value}s</strong> cast time`;
    }
    default:
      return `✨ ${buff.type}`;
  }
}

// ============================================================
// SELL FROM DECK
// ============================================================

async function sellDeckInstance(run, instanceId) {
  const pickDeck = (id) => {
    const plantIdx = run.deck?.findIndex((d) => d.instanceId === id) ?? -1;
    if (plantIdx >= 0) return { arr: run.deck, idx: plantIdx };
    const spellIdx = run.spellDeck?.findIndex((d) => d.instanceId === id) ?? -1;
    if (spellIdx >= 0) return { arr: run.spellDeck, idx: spellIdx };
    return null;
  };

  const hit = pickDeck(instanceId);
  if (!hit) return false;
  const instance = hit.arr[hit.idx];

  // Can't sell placed cards — must remove from grid first
  if (instance.gridRow != null) return false;

  const card = getCard(instance.cardId);
  if (!card) return false;

  const skip = Save.loadSettings().skipSellConfirm;
  if (!skip) {
    const ok = await confirmModal({
      title: `Sell ${card.name}?`,
      message: `You will receive ${instance.sellValue} gold. This cannot be undone.`,
      confirmLabel: `Sell for ${instance.sellValue}g`,
      cancelLabel: 'Cancel',
    });
    if (!ok) return false;
  }

  // Re-find index in case the deck mutated during the modal (defensive).
  const nowHit = pickDeck(instanceId);
  if (!nowHit) return false;
  nowHit.arr.splice(nowHit.idx, 1);
  run.gold += instance.sellValue;
  _audio?.playSfx('click');
  _onChange?.();
  renderPlacement(run);
  return true;
}

// ============================================================
// SUNFLOWER → GILDED ROSE AUTO-MERGE
// ============================================================

/**
 * Generic "merge N of the same plant into its evolution" logic.
 *
 * When a plant is placed, we check its card definition for an
 * `evolution: { requiresCount, requiresSameId, intoId }` block. If
 * the grid already has enough siblings, this function consumes them
 * and spawns the evolved plant at the anchor tile.
 *
 * Recurses after a successful merge so chain evolutions (e.g.
 * Seedling Scrubber → Blooming Scrubber → Scrubber) can collapse
 * in a single placement when the right number of tiles line up.
 */
function mergeEvolution(run, cardId, anchorRow, anchorCol) {
  const card = getCard(cardId);
  const evolution = card?.evolution;
  if (!evolution?.requiresSameId || !evolution.intoId) return false;

  const requiresCount = evolution.requiresCount ?? 3;
  const placed = run.deck.filter(
    (d) => d.cardId === cardId && d.gridRow != null && d.gridCol != null,
  );
  if (placed.length < requiresCount) return false;

  // Prefer the anchor tile's instance so the fusion lands where
  // the player just clicked. Then take any (requiresCount - 1)
  // others in placement order.
  const anchor = placed.find(
    (s) => s.gridRow === anchorRow && s.gridCol === anchorCol,
  );
  const others = placed.filter((s) => s !== anchor);
  const toMerge = [anchor, ...others.slice(0, requiresCount - 1)].filter(Boolean);
  if (toMerge.length < requiresCount) return false;

  // Remove the consumed instances from the deck.
  for (const s of toMerge) {
    const idx = run.deck.findIndex((d) => d.instanceId === s.instanceId);
    if (idx >= 0) run.deck.splice(idx, 1);
  }

  // Spawn the evolved plant at the anchor tile.
  const resultCard = getCard(evolution.intoId);
  if (!resultCard) {
    console.warn(`[merge] target '${evolution.intoId}' not in card database`);
    return false;
  }
  const resultInst = {
    cardId: evolution.intoId,
    instanceId: freshInstanceId(),
    sellValue: rollSell(resultCard),
    gridRow: anchorRow,
    gridCol: anchorCol,
    targeting: resultCard.targetingDefault ?? 'first',
  };
  run.deck.push(resultInst);
  recordAttainedFusion(run, evolution.intoId);

  _audio?.playSfx('go');
  flashToast(`✨ ${requiresCount} ${card.name}s → ${resultCard.name}!`);

  // Chain: if the new plant can itself merge (there are already 2
  // more of the evolved form placed), cascade the merge through
  // every chain tier in a single placement.
  mergeEvolution(run, evolution.intoId, anchorRow, anchorCol);
  enforceRarityLimits(run);
  return true;
}

/**
 * Scan `run.deck` for any group of UNPLACED plants (gridRow == null)
 * whose count reaches the evolution `requiresCount`. When found,
 * the N copies are removed and replaced with a single evolved
 * instance — still unplaced, living in the deck. This cascades via
 * a while-loop so buying the 9th Seedling Scrubber can collapse all
 * the way to a Scrubber in one tick.
 *
 * Called from main.js onRunChange (before save) and STATES.SHOP.enter
 * so the deck is always in its fully-merged state when the player
 * sees it.
 */
export function checkDeckMerges(run) {
  if (!run?.deck) return;
  let keepGoing = true;
  while (keepGoing) {
    keepGoing = false;
    // Group ALL instances by cardId — both placed (gridRow != null)
    // and unplaced. If the total hits the evolution threshold the
    // copies are consumed (pulled off the grid if needed) and the
    // evolved result lands in the deck unplaced.
    const groups = new Map();
    for (const inst of run.deck) {
      if (!groups.has(inst.cardId)) groups.set(inst.cardId, []);
      groups.get(inst.cardId).push(inst);
    }
    for (const [cardId, instances] of groups) {
      const card = getCard(cardId);
      if (!card?.evolution?.requiresSameId) continue;
      const required = card.evolution.requiresCount ?? 3;
      if (instances.length < required) continue;

      // Merge! Take `required` instances (prefer unplaced first so
      // the grid isn't disrupted unless we have to).
      const sorted = instances.slice().sort((a, b) =>
        (a.gridRow == null ? 0 : 1) - (b.gridRow == null ? 0 : 1),
      );
      const toMerge = sorted.slice(0, required);
      for (const inst of toMerge) {
        const idx = run.deck.findIndex((d) => d.instanceId === inst.instanceId);
        if (idx >= 0) run.deck.splice(idx, 1);
      }

      const resultCard = getCard(card.evolution.intoId);
      if (!resultCard) continue;

      run.deck.push({
        cardId: card.evolution.intoId,
        instanceId: freshInstanceId(),
        sellValue: rollSell(resultCard),
        targeting: resultCard.targetingDefault ?? 'first',
      });
      recordAttainedFusion(run, card.evolution.intoId);

      _audio?.playSfx('go');
      flashToast(`✨ ${required} ${card.name}s → ${resultCard.name}!`);
      keepGoing = true;
      break;
    }
  }
  enforceRarityLimits(run);

  // --- Spell deck merges (same logic, different array) ---
  if (run.spellDeck) {
    let spellKeep = true;
    while (spellKeep) {
      spellKeep = false;
      const groups = new Map();
      for (const inst of run.spellDeck) {
        if (!groups.has(inst.cardId)) groups.set(inst.cardId, []);
        groups.get(inst.cardId).push(inst);
      }
      for (const [cardId, instances] of groups) {
        const card = getCard(cardId);
        if (!card?.evolution?.requiresSameId) continue;
        const required = card.evolution.requiresCount ?? 3;
        if (instances.length < required) continue;

        const toMerge = instances.slice(0, required);
        for (const inst of toMerge) {
          const idx = run.spellDeck.findIndex((d) => d.instanceId === inst.instanceId);
          if (idx >= 0) run.spellDeck.splice(idx, 1);
        }

        const resultCard = getCard(card.evolution.intoId);
        if (!resultCard) continue;

        run.spellDeck.push({
          cardId: card.evolution.intoId,
          instanceId: freshInstanceId(),
          sellValue: rollSell(resultCard),
        });
        recordAttainedFusion(run, card.evolution.intoId);

        _audio?.playSfx('go');
        flashToast(`✨ ${required} ${card.name}s → ${resultCard.name}!`);
        spellKeep = true;
        break;
      }
    }
    enforceSpellDeckLimits(run);
  }
}

/**
 * Enforce per-card deck limits on spells in run.spellDeck. Artifact
 * spells use card.deckLimit (default 1). Excess copies are auto-sold
 * for their sellValue.
 */
function enforceSpellDeckLimits(run) {
  if (!run?.spellDeck) return;
  const cardCounts = new Map();
  for (let i = run.spellDeck.length - 1; i >= 0; i--) {
    const inst = run.spellDeck[i];
    const card = getCard(inst.cardId);
    if (!card) continue;
    const limit = card.deckLimit;
    if (limit == null) continue;
    const count = (cardCounts.get(inst.cardId) ?? 0) + 1;
    cardCounts.set(inst.cardId, count);
    if (count > limit) {
      const gold = inst.sellValue ?? 0;
      run.gold += gold;
      run.spellDeck.splice(i, 1);
      flashToast(`⚠️ ${card.name} auto-sold for ${gold}g (spell limit: ${limit})`);
    }
  }
}

// ============================================================
// HELPERS
// ============================================================

/**
 * Enforce per-rarity and per-card deck limits. After any merge, scan
 * run.deck and auto-sell any copies that exceed the limit for their
 * rarity or card-level cap.
 *
 * Rules:
 *   - Legendary: max 3 total in the deck (across all legendary cardIds)
 *   - Artifact:  max card.deckLimit per cardId (default 1)
 *   - Void:      max card.deckLimit per cardId (default 1)
 *   - Lily Weed: always exempt from ALL limits
 */
function enforceRarityLimits(run) {
  if (!run?.deck) return;

  // --- Per-card limits (artifact / void / any card with deckLimit) ---
  const cardCounts = new Map();
  for (let i = run.deck.length - 1; i >= 0; i--) {
    const inst = run.deck[i];
    if (inst.cardId === 'lily_weed') continue;
    const card = getCard(inst.cardId);
    if (!card) continue;
    const limit = card.deckLimit;
    if (limit == null) continue;
    const count = (cardCounts.get(inst.cardId) ?? 0) + 1;
    cardCounts.set(inst.cardId, count);
    if (count > limit) {
      const gold = inst.sellValue ?? 0;
      run.gold += gold;
      run.deck.splice(i, 1);
      flashToast(`⚠️ ${card.name} auto-sold for ${gold}g (limit: ${limit})`);
    }
  }

  // --- Legendary cap: max 3 across ALL legendary cardIds ---
  const MAX_LEGENDARY = 3;
  const legendaries = [];
  for (let i = 0; i < run.deck.length; i++) {
    const inst = run.deck[i];
    if (inst.cardId === 'lily_weed') continue;
    const card = getCard(inst.cardId);
    if (card?.rarity === 'legendary') legendaries.push(i);
  }
  if (legendaries.length > MAX_LEGENDARY) {
    // Sell the newest extras (highest indices first)
    const toSell = legendaries.slice(MAX_LEGENDARY).reverse();
    for (const idx of toSell) {
      const inst = run.deck[idx];
      const card = getCard(inst.cardId);
      const gold = inst.sellValue ?? 0;
      run.gold += gold;
      run.deck.splice(idx, 1);
      flashToast(`⚠️ ${card?.name ?? 'Legendary'} auto-sold for ${gold}g (legendary cap: ${MAX_LEGENDARY})`);
    }
  }
}

function recordAttainedFusion(run, cardId) {
  // Write to BOTH run (for the merge-log button visibility check)
  // and meta (so the fusion log persists across runs forever).
  if (!run.attainedFusions) run.attainedFusions = [];
  if (!run.attainedFusions.includes(cardId)) run.attainedFusions.push(cardId);

  const meta = Save.loadMeta();
  if (!meta.attainedFusions) meta.attainedFusions = [];
  if (!meta.attainedFusions.includes(cardId)) {
    meta.attainedFusions.push(cardId);
    Save.saveMeta(meta);
  }
}

function findAtTile(run, row, col) {
  return run.deck.find(
    (d) => d.gridRow === row && d.gridCol === col,
  );
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
  );
}

function flashToast(msg) {
  const log = document.getElementById('toast-log');
  if (!log) return;
  const t = document.createElement('div');
  t.textContent = msg;
  t.className = 'shop-toast shop-toast-info';
  log.appendChild(t);
  log.scrollTop = log.scrollHeight;
  setTimeout(() => { t.classList.add('shop-toast-fade'); }, 5000);
  setTimeout(() => t.remove(), 7000);
}

function flashError(msg) {
  const log = document.getElementById('toast-log');
  if (!log) return;
  const t = document.createElement('div');
  t.textContent = msg;
  t.className = 'shop-toast';
  log.appendChild(t);
  log.scrollTop = log.scrollHeight;
  setTimeout(() => { t.classList.add('shop-toast-fade'); }, 5000);
  setTimeout(() => t.remove(), 7000);
}

// ============================================================
// RENDERING
// ============================================================

export function renderPlacement(run) {
  if (!run.spellDeck) run.spellDeck = [];
  _currentRun = run; // fresh ref for the sort-bar click handler
  renderDeckInventory(run);
  renderSpellDeckInventory(run);
  renderGridWithPlacements(run);
}

function renderDeckInventory(run) {
  const host = document.getElementById('deck-inventory');
  const countEl = document.getElementById('deck-count');
  const placedEl = document.getElementById('deck-placed');
  // The plant deck only tracks plants — the count shown is plants owned.
  const placedCount = run.deck.filter((d) => d.gridRow != null).length;
  if (countEl) countEl.textContent = String(run.deck.length);
  if (placedEl) placedEl.textContent = String(placedCount);
  if (!host) return;
  host.innerHTML = '';

  // Wire sort-bar click handlers once (survives across re-renders).
  // No `run` arg — the handler reads _currentRun (set by renderPlacement).
  wireDeckSortBar();

  // Only show unplaced plants in the deck inventory
  const unplaced = run.deck.filter((d) => d.gridRow == null);

  if (unplaced.length === 0 && run.deck.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'deck-empty';
    empty.textContent = 'No plants yet — buy cards above to start building your deck.';
    host.appendChild(empty);
    return;
  }

  if (unplaced.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'deck-empty';
    empty.textContent = 'All plants placed. Tap a grid card to move, upgrade, or remove.';
    host.appendChild(empty);
    return;
  }

  // Apply the current sort before rendering
  const sorted = sortDeckInstances(unplaced);

  for (const instance of sorted) {
    const card = getCard(instance.cardId);
    if (!card) continue;
    const isSelected = _selection?.instanceId === instance.instanceId;
    const el = renderCard(card, {
      sellValue: instance.sellValue,
      small: true,
      isSelected,
      instance,
      onClick: () => selectDeckCard(run, instance.instanceId),
      onSell: () => sellDeckInstance(run, instance.instanceId),
    });
    host.appendChild(el);
  }
}

/**
 * Attach click handlers to the #deck-sort-bar buttons. Wired once;
 * subsequent calls just update the `.is-active` highlight to match
 * `_deckSortKey`.
 *
 * The handler reads `_currentRun` (module-level, refreshed every
 * renderPlacement call) instead of a closure-captured `run` — this
 * was the original bug: the first wire captured a stale run ref
 * that never updated on new runs.
 */
function wireDeckSortBar() {
  const bar = document.getElementById('deck-sort-bar');
  if (!bar) return;

  if (!_deckSortBarWired) {
    bar.addEventListener('click', (e) => {
      const btn = e.target.closest('.deck-sort-btn');
      if (!btn) return;
      const key = btn.dataset.sort;
      if (!key) return;
      _deckSortKey = key;
      _audio?.playSfx('click');
      // _currentRun is always the latest run reference, set by
      // renderPlacement before this handler can fire.
      if (_currentRun) renderPlacement(_currentRun);
    });
    _deckSortBarWired = true;
  }

  // Update active indicator
  bar.querySelectorAll('.deck-sort-btn').forEach((btn) => {
    btn.classList.toggle('is-active', btn.dataset.sort === _deckSortKey);
  });
}

/**
 * Render the Spell Deck: all owned plant-target spells. Lives in a
 * dedicated shop section (#spell-deck-inventory) so the player can
 * scan spells independently of plants.
 */
function renderSpellDeckInventory(run) {
  const host = document.getElementById('spell-deck-inventory');
  const countEl = document.getElementById('spell-deck-count');
  const spellDeck = run.spellDeck ?? [];
  if (countEl) countEl.textContent = String(spellDeck.length);
  if (!host) return;
  host.innerHTML = '';

  wireSpellSortBar();

  // Auto-sell excess spells: if > 5 copies of any single spell
  // (except Magic Mushroom), auto-sell the extras for their gold.
  autoSellExcessSpells(run);

  // Show/hide Sell All buttons
  const sellPlantBtn = document.getElementById('sell-all-plants-btn');
  const unplacedPlants = run.deck.filter((d) => d.gridRow == null);
  if (sellPlantBtn) sellPlantBtn.hidden = unplacedPlants.length === 0;
  const sellSpellBtn = document.getElementById('sell-all-spells-btn');
  if (sellSpellBtn) sellSpellBtn.hidden = spellDeck.length === 0;

  if (spellDeck.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'deck-empty';
    empty.textContent = 'No spells yet — buy or pack-open spells to stock this deck.';
    host.appendChild(empty);
    return;
  }

  const sorted = sortSpellInstances(spellDeck);
  for (const instance of sorted) {
    const card = getCard(instance.cardId);
    if (!card) continue;
    const isSelected = _selection?.instanceId === instance.instanceId;
    const el = renderCard(card, {
      sellValue: instance.sellValue,
      small: true,
      isSelected,
      instance,
      onClick: () => selectDeckCard(run, instance.instanceId),
      onSell: () => sellDeckInstance(run, instance.instanceId),
    });
    host.appendChild(el);
  }
}

function sortSpellInstances(instances) {
  return instances.slice().sort((a, b) => {
    const ca = getCard(a.cardId);
    const cb = getCard(b.cardId);
    if (!ca || !cb) return 0;
    if (_spellSortKey === 'rarity') {
      return (RARITY_TIERS[cb.rarity] ?? 0) - (RARITY_TIERS[ca.rarity] ?? 0)
          || ca.name.localeCompare(cb.name);
    }
    return ca.name.localeCompare(cb.name);
  });
}

function wireSpellSortBar() {
  const bar = document.getElementById('spell-deck-sort-bar');
  if (!bar) return;
  if (!_spellSortBarWired) {
    bar.addEventListener('click', (e) => {
      const btn = e.target.closest('.deck-sort-btn');
      if (!btn) return;
      const key = btn.dataset.sort;
      if (!key) return;
      _spellSortKey = key;
      _audio?.playSfx('click');
      if (_currentRun) renderPlacement(_currentRun);
    });
    _spellSortBarWired = true;
  }
  bar.querySelectorAll('.deck-sort-btn').forEach((btn) => {
    btn.classList.toggle('is-active', btn.dataset.sort === _spellSortKey);
  });
}

/**
 * If any non-Magic-Mushroom spell has > 5 copies in run.spellDeck,
 * auto-sell the extras and add the gold. Keeps the spell deck clean.
 */
function autoSellExcessSpells(run) {
  if (!run?.spellDeck) return;
  const MAX_SPELL_COPIES = 5;
  const counts = new Map();
  for (const inst of run.spellDeck) {
    if (!counts.has(inst.cardId)) counts.set(inst.cardId, []);
    counts.get(inst.cardId).push(inst);
  }
  let totalSold = 0;
  let totalGold = 0;
  for (const [cardId, copies] of counts) {
    if (cardId === 'magic_mushroom') continue;
    if (copies.length <= MAX_SPELL_COPIES) continue;
    const excess = copies.slice(MAX_SPELL_COPIES);
    for (const inst of excess) {
      const idx = run.spellDeck.findIndex((d) => d.instanceId === inst.instanceId);
      if (idx >= 0) {
        run.spellDeck.splice(idx, 1);
        const gold = inst.sellValue ?? 0;
        run.gold += gold;
        totalGold += gold;
        totalSold++;
      }
    }
  }
  if (totalSold > 0) {
    flashToast(`🧹 Auto-sold ${totalSold} excess spell${totalSold === 1 ? '' : 's'} for ${totalGold}g`);
  }
}

/**
 * Sell all unplaced plants of a specific rarity from the Plant Deck.
 * Lily Weeds (id 'lily_weed') are NEVER sold by bulk operations —
 * they're a special collectible the player can have infinitely.
 */
export async function sellPlantsByRarity(run, rarity) {
  const targets = run.deck.filter((d) => {
    if (d.gridRow != null) return false;
    if (d.cardId === 'lily_weed') return false;
    const c = getCard(d.cardId);
    return c?.rarity === rarity;
  });
  if (targets.length === 0) {
    flashError(`No unplaced ${rarity} plants to sell.`);
    return;
  }
  const totalGold = targets.reduce((sum, d) => sum + (d.sellValue ?? 0), 0);
  if (!Save.loadSettings().skipSellConfirm) {
    const ok = await confirmModal({
      title: `Sell all ${targets.length} ${rarity} plants?`,
      message: `You will receive ${totalGold} gold. Placed plants and Lily Weeds are NOT affected.`,
      confirmLabel: `Sell for ${totalGold}g`,
      cancelLabel: 'Cancel',
      danger: true,
    });
    if (!ok) return;
  }
  const ids = new Set(targets.map((d) => d.instanceId));
  for (let i = run.deck.length - 1; i >= 0; i--) {
    if (ids.has(run.deck[i].instanceId)) {
      run.gold += run.deck[i].sellValue ?? 0;
      run.deck.splice(i, 1);
    }
  }
  _audio?.playSfx('click');
  _onChange?.();
  renderPlacement(run);
}

/**
 * Sell all spells of a specific rarity from the Spell Deck.
 */
export async function sellSpellsByRarity(run, rarity) {
  const spellDeck = run.spellDeck ?? [];
  const targets = spellDeck.filter((d) => {
    const c = getCard(d.cardId);
    return c?.rarity === rarity;
  });
  if (targets.length === 0) {
    flashError(`No ${rarity} spells to sell.`);
    return;
  }
  const totalGold = targets.reduce((sum, d) => sum + (d.sellValue ?? 0), 0);
  if (!Save.loadSettings().skipSellConfirm) {
    const ok = await confirmModal({
      title: `Sell all ${targets.length} ${rarity} spells?`,
      message: `You will receive ${totalGold} gold.`,
      confirmLabel: `Sell for ${totalGold}g`,
      cancelLabel: 'Cancel',
      danger: true,
    });
    if (!ok) return;
  }
  const ids = new Set(targets.map((d) => d.instanceId));
  for (let i = run.spellDeck.length - 1; i >= 0; i--) {
    if (ids.has(run.spellDeck[i].instanceId)) {
      run.gold += run.spellDeck[i].sellValue ?? 0;
      run.spellDeck.splice(i, 1);
    }
  }
  _audio?.playSfx('click');
  _onChange?.();
  renderPlacement(run);
}

function renderGridWithPlacements(run) {
  const host = document.getElementById('grid-container');
  if (!host) return;

  // Rebuild the grid DOM with our tile click handler
  renderGrid(host, {
    onTileClick: (row, col) => handleTileClick(run, row, col),
  });

  // Determine what mode we're in for highlighting purposes
  let selectionMode = 'none'; // 'none' | 'place-plant' | 'cast-spell'
  if (_selection) {
    const selInstance = run.deck.find((d) => d.instanceId === _selection.instanceId);
    const selCard = selInstance ? getCard(selInstance.cardId) : null;
    if (selCard?.type === 'spell') {
      selectionMode = 'cast-spell';
    } else if (selCard?.type === 'plant') {
      selectionMode = 'place-plant';
    }
  }

  const tiles = host.querySelectorAll('.grid-tile');
  tiles.forEach((tile) => {
    const r = Number(tile.dataset.row);
    const c = Number(tile.dataset.col);
    const placedInstance = findAtTile(run, r, c);

    tile.classList.remove('placement-valid', 'tile-has-card', 'spell-target-valid', 'tile-buffed');

    if (placedInstance) {
      tile.classList.add('tile-has-card');
      const card = getCard(placedInstance.cardId);
      if (card) {
        tile.innerHTML = '';
        // Pass the instance so the icon can render its buff strip
        // (one emoji per applied spell type, with spell name as the
        // hover title).
        const icon = renderGridCardIcon(card, placedInstance);
        // Buff badge if the instance has any buffs OR tier > 1
        const buffCount = (placedInstance.buffs ?? []).length;
        const tier = placedInstance.tier ?? 1;
        if (buffCount > 0 || tier > 1) {
          const badge = document.createElement('div');
          badge.className = 'grid-card-buff-badge';
          badge.textContent = tier > 1 ? `T${tier}` : '✨';
          badge.title = tier > 1 ? `Tier ${tier}` : `${buffCount} buff${buffCount === 1 ? '' : 's'}`;
          // Tier badge uses a different palette to distinguish from buff glow
          if (tier > 1) badge.classList.add('grid-card-buff-badge-tier');
          icon.appendChild(badge);
        }
        if (buffCount > 0) tile.classList.add('tile-buffed');
        tile.appendChild(icon);
      }
      // Plant tiles glow when a spell is selected (they're valid targets)
      if (selectionMode === 'cast-spell') {
        tile.classList.add('spell-target-valid');
      }
    } else if (selectionMode === 'place-plant' && c !== STAGING_COL) {
      // Empty tiles glow when a plant is selected — staging col is
      // excluded because plants can't be placed there.
      tile.classList.add('placement-valid');
    }
  });
}

// ============================================================
// PUBLIC API (used by main.js)
// ============================================================

export function getSelection() {
  return _selection;
}
