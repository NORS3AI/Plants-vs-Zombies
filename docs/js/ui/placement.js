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
} from '../cards/index.js';
import { renderGrid } from '../game/grid.js';
import { renderCard, renderGridCardIcon } from './cardView.js';
import { showModal, confirmModal } from './modal.js';

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
    // Mid-placement: empty tile = place, occupied = cancel
    if (!atTile) {
      placeAt(run, row, col);
    } else {
      clearSelection(run);
    }
    return;
  }

  if (atTile) {
    openPlacedCardModal(run, atTile);
  }
}

// ============================================================
// PLACED CARD MODAL — targeting + remove
// ============================================================

async function openPlacedCardModal(run, instance) {
  const card = getCard(instance.cardId);
  if (!card) return;

  const targetingLine = card.damage > 0
    ? `Currently targeting: <strong>${instance.targeting ?? card.targetingDefault ?? 'first'}</strong>`
    : `<em>${card.name} does not attack.</em>`;

  const bodyHtml = `
    <div class="placed-modal-body">
      <p class="placed-modal-stats">${formatCardStats(card)}</p>
      <p class="placed-modal-desc">${escapeHtml(card.description ?? '')}</p>
      <p class="placed-modal-targeting">${targetingLine}</p>
    </div>
  `;

  const buttons = [];
  if (card.damage > 0) {
    buttons.push(
      { label: '🎯 First', value: 'first' },
      { label: '💪 Strongest', value: 'strongest' },
      { label: '🩸 Weakest', value: 'weakest' },
    );
  }
  buttons.push({ label: 'Remove', value: 'remove', kind: 'danger' });
  buttons.push({ label: 'Close', value: null, kind: 'default' });

  const choice = await showModal({
    title: card.name,
    bodyHtml,
    buttons,
    wide: false,
  });

  if (choice === 'remove') {
    instance.gridRow = null;
    instance.gridCol = null;
    _audio?.playSfx('back');
  } else if (choice === 'first' || choice === 'strongest' || choice === 'weakest') {
    instance.targeting = choice;
    _audio?.playSfx('click');
  }

  if (choice) {
    _onChange?.();
    renderPlacement(run);
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
  if (countEl) countEl.textContent = String(run.deck.length);
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

  // Mark placement-mode tiles as valid drop targets
  const placing = !!_selection;
  const tiles = host.querySelectorAll('.grid-tile');
  tiles.forEach((tile) => {
    const r = Number(tile.dataset.row);
    const c = Number(tile.dataset.col);
    const placedInstance = findAtTile(run, r, c);

    tile.classList.remove('placement-valid', 'tile-has-card');
    if (placedInstance) {
      tile.classList.add('tile-has-card');
      const card = getCard(placedInstance.cardId);
      if (card) {
        tile.innerHTML = '';
        const icon = renderGridCardIcon(card);
        tile.appendChild(icon);
      }
    } else if (placing) {
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
