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
  formatCardStats,
  getCardsByRarity,
  getNextRarity,
} from '../cards/index.js';
import { renderGrid, STAGING_COL } from '../game/grid.js';
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
 * If the placed card is a Sunflower and this triggers a 3-Sunflower
 * merge, it handles the evolve atomically.
 */
function placeAt(run, row, col) {
  if (!_selection) return false;
  const instance = run.deck.find((d) => d.instanceId === _selection.instanceId);
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

  // Check for Sunflower → Gilded Rose merge
  if (instance.cardId === 'sunflower') {
    mergeSunflowers(run, row, col);
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
    const instance = run.deck.find((d) => d.instanceId === _selection.instanceId);
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
      success = applyPlantSpell(effect, targetPlant, card);
      break;

    case 'self':
      success = applySelfSpell(effect, run, card);
      break;

    case 'board':
      success = applyBoardSpell(effect, run);
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

  // Consume the spell instance
  const idx = run.deck.findIndex((d) => d.instanceId === instance.instanceId);
  if (idx >= 0) run.deck.splice(idx, 1);

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
function applyPlantSpell(effect, targetInstance, card) {
  if (!targetInstance.buffs) targetInstance.buffs = [];
  const targetCard = getCard(targetInstance.cardId);
  if (!targetCard) return false;

  switch (effect.type) {
    case 'shield': {
      const maxHp = targetCard.health ?? 0;
      const amount = effect.valueType === 'pct_max_hp'
        ? Math.round(maxHp * effect.value)
        : effect.value;
      // Shields re-apply each round (refreshed in initCombat)
      targetInstance.buffs.push({ type: 'shield', value: amount, permanent: true });
      return true;
    }
    case 'permanent_hp_buff':
      targetInstance.buffs.push({ type: 'hp_boost', value: effect.value, permanent: true });
      return true;
    case 'damage_buff':
      // Nectar Rush: +15 DMG for the round only
      targetInstance.buffs.push({ type: 'dmg_boost', value: effect.value, permanent: false });
      return true;
    case 'cast_speed_buff':
      // Aether Bloom: -0.5s cast for 10s (treat as per-round for simplicity)
      targetInstance.buffs.push({ type: 'cast_speed', value: effect.value, permanent: false });
      return true;
    case 'damage_mul':
      // Arcane Surge: 2× damage for 5s (treat as per-round for simplicity)
      targetInstance.buffs.push({ type: 'dmg_mul', value: effect.value, permanent: false });
      return true;
    case 'evolve':
      return evolvePlantInstance(targetInstance);
    default:
      flashError(`Effect '${effect.type}' not implemented yet.`);
      return false;
  }
}

/**
 * Magic Mushroom evolve: replace the target plant with a random card
 * of the next rarity tier, keeping its placement.
 */
function evolvePlantInstance(instance) {
  const currentCard = getCard(instance.cardId);
  if (!currentCard) return false;
  const nextRarity = getNextRarity(currentCard.rarity);
  if (!nextRarity) {
    flashError('Already at the highest rarity.');
    return false;
  }
  const candidates = getCardsByRarity(nextRarity.id).filter(
    (c) => c.type === 'plant' && c.category === 'standard',
  );
  if (candidates.length === 0) {
    flashError(`No ${nextRarity.label} plants available to evolve into.`);
    return false;
  }
  const newCard = candidates[Math.floor(Math.random() * candidates.length)];
  instance.cardId = newCard.id;
  // Reset buffs — the new plant starts fresh
  instance.buffs = [];
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

function applyBoardSpell(effect, run) {
  switch (effect.type) {
    case 'heal_all': {
      // World-Tree Seed: full heal + shield on all placed plants
      const shieldAmount = effect.shield ?? 0;
      let touched = 0;
      for (const inst of run.deck) {
        if (inst.gridRow == null) continue;
        if (!inst.buffs) inst.buffs = [];
        inst.buffs.push({ type: 'shield', value: shieldAmount });
        touched++;
      }
      if (touched === 0) {
        flashError('No plants on the grid to heal.');
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
        inst.buffs.push({ type: 'cast_speed', value: -1.5, permanent: false });
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
    },
  });

  if (choice === 'remove') {
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

  const buffsHtml = buffs.length > 0
    ? `
      <div class="placed-section">
        <h4>Active Spells (${buffs.length})</h4>
        <ul class="placed-buffs-list">
          ${buffs.map((b) => `<li>${describeBuff(b, card)}</li>`).join('')}
        </ul>
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
      <p class="placed-modal-stats">${formatCardStats(card)}</p>
      <p class="placed-modal-desc">${escapeHtml(card.description ?? '')}</p>
      ${buffsHtml}
      ${targetingHtml}
    </div>
  `;
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
  const idx = run.deck.findIndex((d) => d.instanceId === instanceId);
  if (idx < 0) return false;
  const instance = run.deck[idx];

  // Can't sell placed cards — must remove from grid first
  if (instance.gridRow != null) return false;

  const card = getCard(instance.cardId);
  if (!card) return false;

  const ok = await confirmModal({
    title: `Sell ${card.name}?`,
    message: `You will receive ${instance.sellValue} gold. This cannot be undone.`,
    confirmLabel: `Sell for ${instance.sellValue}g`,
    cancelLabel: 'Cancel',
  });
  if (!ok) return false;

  // Re-find index in case deck mutated during modal (defensive)
  const currentIdx = run.deck.findIndex((d) => d.instanceId === instanceId);
  if (currentIdx < 0) return false;

  run.deck.splice(currentIdx, 1);
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
 * Check if 3+ Sunflowers are placed and merge them into a Gilded Rose
 * at the `anchor` tile (usually the most recently placed one).
 */
function mergeSunflowers(run, anchorRow, anchorCol) {
  const placedSunflowers = run.deck.filter(
    (d) => d.cardId === 'sunflower' && d.gridRow != null && d.gridCol != null,
  );
  if (placedSunflowers.length < 3) return false;

  // Prefer the anchor tile's sunflower, then any 2 others
  const anchor = placedSunflowers.find(
    (s) => s.gridRow === anchorRow && s.gridCol === anchorCol,
  );
  const others = placedSunflowers.filter((s) => s !== anchor);
  const toMerge = [anchor, ...others.slice(0, 2)].filter(Boolean);
  if (toMerge.length < 3) return false;

  // Remove the 3 sunflowers from the deck
  for (const s of toMerge) {
    const idx = run.deck.findIndex((d) => d.instanceId === s.instanceId);
    if (idx >= 0) run.deck.splice(idx, 1);
  }

  // Add a Gilded Rose placed at the anchor tile
  const rose = getCard('gilded_rose');
  if (rose) {
    run.deck.push({
      cardId: 'gilded_rose',
      instanceId: freshInstanceId(),
      sellValue: rollSell(rose),
      gridRow: anchorRow,
      gridCol: anchorCol,
      targeting: 'none',
    });
    _audio?.playSfx('go');
    flashToast('🌹 3 Sunflowers merged into a Gilded Rose!');
  }
  return true;
}

// ============================================================
// HELPERS
// ============================================================

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
  const t = document.createElement('div');
  t.textContent = msg;
  t.className = 'shop-toast shop-toast-success';
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2500);
}

function flashError(msg) {
  const t = document.createElement('div');
  t.textContent = msg;
  t.className = 'shop-toast';
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 1800);
}

// ============================================================
// RENDERING
// ============================================================

export function renderPlacement(run) {
  renderDeckInventory(run);
  renderGridWithPlacements(run);
}

function renderDeckInventory(run) {
  const host = document.getElementById('deck-inventory');
  const countEl = document.getElementById('deck-count');
  const placedEl = document.getElementById('deck-placed');
  const placedCount = run.deck.filter((d) => d.gridRow != null).length;
  if (countEl) countEl.textContent = String(run.deck.length);
  if (placedEl) placedEl.textContent = String(placedCount);
  if (!host) return;
  host.innerHTML = '';

  // Only show unplaced cards in the deck inventory
  const unplaced = run.deck.filter((d) => d.gridRow == null);

  if (unplaced.length === 0 && run.deck.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'deck-empty';
    empty.textContent = 'Deck empty — buy cards above to start building';
    host.appendChild(empty);
    return;
  }

  if (unplaced.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'deck-empty';
    empty.textContent = 'All deck cards placed. Click a grid card to move or remove.';
    host.appendChild(empty);
    return;
  }

  for (const instance of unplaced) {
    const card = getCard(instance.cardId);
    if (!card) continue;
    const isSelected = _selection?.instanceId === instance.instanceId;
    const el = renderCard(card, {
      sellValue: instance.sellValue,
      small: true,
      isSelected,
      onClick: () => selectDeckCard(run, instance.instanceId),
      onSell: () => sellDeckInstance(run, instance.instanceId),
    });
    host.appendChild(el);
  }
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

    tile.classList.remove('placement-valid', 'tile-has-card', 'spell-target-valid');

    if (placedInstance) {
      tile.classList.add('tile-has-card');
      const card = getCard(placedInstance.cardId);
      if (card) {
        tile.innerHTML = '';
        const icon = renderGridCardIcon(card);
        // Buff badge if the instance has any buffs
        if (placedInstance.buffs && placedInstance.buffs.length > 0) {
          const badge = document.createElement('div');
          badge.className = 'grid-card-buff-badge';
          badge.textContent = '✨';
          badge.title = 'Buffed';
          icon.appendChild(badge);
        }
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
