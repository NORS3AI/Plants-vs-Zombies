/**
 * Shop Module
 *
 * All shop logic: roll/refresh the 3-card spawn, buy/sell, open packs.
 * Manages currentRun.shopRoll, currentRun.deck, currentRun.packsOpened.
 *
 * Phase 5 scope: data flow + UI rendering. Combat / placement land in
 * Phase 6 (placement) and Phase 7 (combat).
 */

import {
  getCard,
  rollShopCards,
  rollPackCards,
  rollCost,
  rollSell,
  PACKS,
  PACK_ORDER,
} from '../cards/index.js';
import { renderCard, renderPackChest } from './cardView.js';
import { confirmModal, showModal } from './modal.js';

// Deck itself is uncapped — "opening a chest should be super exciting".
// The 10-card limit is now on how many plants can be PLACED on the
// grid at once (enforced in placement.js). Kept as a historical
// reference export for any code that still imports it.
export const MAX_DECK_SIZE = Infinity;
export const SHOP_CARD_COUNT = 3;
export const REFRESH_COST = 1;

let _audio = null;
let _onChange = null;
let _onFirstBuy = null;
let _onFirstPack = null;

/**
 * Initialize the shop module. Call once at boot.
 *
 * @param {object} deps
 *   - audio: AudioManager (for SFX)
 *   - onChange: () => void — called whenever the run mutates
 *   - onFirstBuy: () => void — fired on each successful slot buy (tutorial hook)
 *   - onFirstPack: () => void — fired on each successful pack open (tutorial hook)
 */
export function initShop({ audio, onChange, onFirstBuy, onFirstPack }) {
  _audio = audio;
  _onChange = onChange;
  _onFirstBuy = onFirstBuy;
  _onFirstPack = onFirstPack;
}

// ============================================================
// SHOP ROLL — generate / refresh
// ============================================================

/** Generate a fresh 3-card shop offering, replacing any existing roll. */
export function rerollShop(run) {
  const cards = rollShopCards(SHOP_CARD_COUNT);
  run.shopRoll = cards.map((card) => ({
    cardId: card.id,
    cost: rollCost(card),
    sold: false,
  }));
  run.shopRollRound = run.round;
}

/**
 * Ensure currentRun has a shopRoll for the current round. Free auto-reroll
 * when the round number has advanced; otherwise no-op (preserves the roll
 * across save/reload within a round).
 */
export function ensureShopRollForRound(run) {
  if (
    !run.shopRoll ||
    run.shopRoll.length === 0 ||
    run.shopRollRound !== run.round
  ) {
    rerollShop(run);
  }
}

/** Pay 1 gold to refresh the shop offering. Returns true on success. */
export function refreshShop(run) {
  if (run.gold < REFRESH_COST) {
    flashError(`Need ${REFRESH_COST} gold to refresh`);
    _audio?.playSfx('back');
    return false;
  }
  run.gold -= REFRESH_COST;
  rerollShop(run);
  _audio?.playSfx('click');
  _onChange?.();
  return true;
}

// ============================================================
// BUY / SELL
// ============================================================

let _instanceCounter = 1;

function freshInstanceId() {
  return `inst_${Date.now()}_${_instanceCounter++}`;
}

/**
 * Add a card to the appropriate deck. Plants live in `run.deck`;
 * plant-target spells live in `run.spellDeck`. Aether-Root spells
 * never flow through here — they use addToAetherSpells() which
 * handles the duplicate auto-sell behavior.
 *
 * Rolls a sellValue at insertion time so it's deterministic for the
 * lifetime of that instance.
 */
function addToDeck(run, card) {
  const instance = {
    cardId: card.id,
    instanceId: freshInstanceId(),
    sellValue: rollSell(card),
  };
  if (card.type === 'spell') {
    if (!run.spellDeck) run.spellDeck = [];
    run.spellDeck.push(instance);
  } else {
    run.deck.push(instance);
  }
}

/**
 * Add an Aether-Root spell to the side panel inventory.
 *
 * Aether-Root spells can't stack — the Aether-Root only has one of
 * each socket. If the player already owns a copy of this spell, the
 * new copy is auto-sold (the rolled sell value is added to gold) and
 * a toast is flashed so the player knows what happened. Returns
 * `{ added, soldValue }` so the pack-reveal UI can show context.
 */
function addToAetherSpells(run, card) {
  if (!run.aetherSpells) run.aetherSpells = [];

  // Duplicate? Auto-sell instead of adding.
  const already = run.aetherSpells.find((s) => s.cardId === card.id);
  if (already) {
    const soldValue = rollSell(card);
    run.gold += soldValue;
    run.lastRoundGoldEarned = (run.lastRoundGoldEarned ?? 0) + soldValue;
    run.totalGoldEarned = (run.totalGoldEarned ?? 0) + soldValue;
    flashError(`${card.name}: duplicate auto-sold for ${soldValue}g.`);
    return { added: false, soldValue };
  }

  run.aetherSpells.push({
    cardId: card.id,
    instanceId: freshInstanceId(),
    sellValue: rollSell(card),
    cooldownRemaining: 0,
    usedThisRound: false,
  });
  return { added: true, soldValue: 0 };
}

/**
 * Buy a card from the shop slot. Returns true on success.
 * No deck-size cap — the player can own any number of cards; the cap
 * applies only to how many can be placed on the grid at once (Phase 11+).
 */
export function buyShopSlot(run, slotIndex) {
  const slot = run.shopRoll[slotIndex];
  if (!slot || slot.sold) return false;

  const card = getCard(slot.cardId);
  if (!card) return false;

  if (run.gold < slot.cost) {
    flashError(`Need ${slot.cost} gold (you have ${run.gold})`);
    _audio?.playSfx('back');
    return false;
  }

  run.gold -= slot.cost;
  slot.sold = true;
  addToDeck(run, card);
  _audio?.playSfx('click');
  _onFirstBuy?.();
  _onChange?.();
  return true;
}

/**
 * Sell an Aether-Root spell from the side-panel inventory. Confirms
 * via modal first. Used by the Aether-Root shop section.
 */
export async function sellAetherSpell(run, instanceId) {
  if (!run.aetherSpells) return false;
  const idx = run.aetherSpells.findIndex((s) => s.instanceId === instanceId);
  if (idx < 0) return false;
  const instance = run.aetherSpells[idx];
  const card = getCard(instance.cardId);
  if (!card) return false;

  const ok = await confirmModal({
    title: `Sell ${card.name}?`,
    message: `You will receive ${instance.sellValue} gold. The Aether-Root will lose access to this spell for the rest of the run (until you find another copy).`,
    confirmLabel: `Sell for ${instance.sellValue}g`,
    cancelLabel: 'Cancel',
    danger: true,
  });
  if (!ok) return false;

  run.aetherSpells.splice(idx, 1);
  run.gold += instance.sellValue;
  _audio?.playSfx('click');
  _onChange?.();
  return true;
}

/**
 * Sell a deck card by its instance id. Searches both the plant
 * deck and the spell deck. Confirms via modal first.
 */
export async function sellDeckCard(run, instanceId) {
  const findIn = (arr) => ({ arr, idx: arr?.findIndex((c) => c.instanceId === instanceId) ?? -1 });
  let hit = findIn(run.deck);
  if (hit.idx < 0) hit = findIn(run.spellDeck);
  if (hit.idx < 0) return false;
  const instance = hit.arr[hit.idx];
  const card = getCard(instance.cardId);
  if (!card) return false;

  const ok = await confirmModal({
    title: `Sell ${card.name}?`,
    message: `You will receive ${instance.sellValue} gold. This cannot be undone.`,
    confirmLabel: `Sell for ${instance.sellValue}g`,
    cancelLabel: 'Cancel',
  });
  if (!ok) return false;

  hit.arr.splice(hit.idx, 1);
  run.gold += instance.sellValue;
  _audio?.playSfx('click');
  _onChange?.();
  return true;
}

// ============================================================
// PACKS
// ============================================================

/**
 * Buy and open a pack. Animates the reveal in a modal, adds cards to
 * the deck (or aetherSpells inventory). Honors deck cap and pity rules.
 */
export async function buyPack(run, packId) {
  const pack = PACKS[packId];
  if (!pack) return false;

  if (run.gold < pack.cost) {
    flashError(`Need ${pack.cost} gold (you have ${run.gold})`);
    _audio?.playSfx('back');
    return false;
  }

  // Pre-increment the pity counter, then roll
  run.gold -= pack.cost;
  if (!run.packsOpened) run.packsOpened = { mythic: 0, arcane: 0, frenzy: 0 };
  run.packsOpened[packId] = (run.packsOpened[packId] ?? 0) + 1;
  const pityState = {
    mythicCount: run.packsOpened.mythic,
    arcaneCount: run.packsOpened.arcane,
    frenzyCount: run.packsOpened.frenzy,
  };

  const cards = rollPackCards(packId, pityState);
  if (cards.length === 0) {
    flashError(`Pack opened empty — please report this bug`);
    _onChange?.();
    return false;
  }

  // Distribute: every card is kept. Regular cards go to the deck (no
  // size cap — "opening a chest should be super exciting, never a
  // negative"). Aether-Root spells go to the side panel inventory.
  for (const card of cards) {
    if (card.category === 'aether_root') {
      addToAetherSpells(run, card);
    } else {
      addToDeck(run, card);
    }
  }

  _audio?.playSfx('go');
  _onFirstPack?.();
  _onChange?.();

  // Show pack-opening modal
  await showPackRevealModal(pack, cards);
  return true;
}

function showPackRevealModal(pack, cards) {
  const titleEl = `${pack.label} Pack — ${cards.length} cards`;
  const cardsHtml = cards
    .map((c) => {
      // Keep the rarity-driven border via card-rarity-* class, but
      // show "Plant" or "Spell" as the readable label.
      const rarityClass = `card-rarity-${c.rarity}`;
      const icon = c.type === 'plant' ? '🌱' : '✨';
      const typeLabel = c.type === 'plant' ? 'Plant' : 'Spell';
      return `
        <div class="reveal-card ${rarityClass}">
          <div class="reveal-card-icon">${icon}</div>
          <div class="reveal-card-name">${escapeHtml(c.name)}</div>
          <div class="reveal-card-rarity">${typeLabel}</div>
        </div>
      `;
    })
    .join('');

  return showModal({
    title: titleEl,
    bodyHtml: `<div class="reveal-grid">${cardsHtml}</div>`,
    buttons: [{ label: 'Continue', value: true, kind: 'primary' }],
    wide: true,
  });
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
  );
}

// ============================================================
// RENDERING
// ============================================================

/**
 * Render the shop UI (cards + pack chests + refresh button).
 * Deck inventory + grid are rendered by placement.js since Phase 6.
 */
export function renderShop(run) {
  ensureShopRollForRound(run);
  renderShopCards(run);
  renderPackRow(run);
  renderAetherSpellInventory(run);
  updateRefreshButton(run);
}

/**
 * Render the Aether-Root spell inventory section. Each owned spell
 * shows its icon, name, cooldown, and a sell button. Duplicates can't
 * exist (they auto-sell on pack open), so this is a single-instance
 * list with at most one of each spell.
 */
function renderAetherSpellInventory(run) {
  const host = document.getElementById('aether-spell-inventory');
  const countEl = document.getElementById('aether-spell-count');
  if (!host) return;
  const spells = run.aetherSpells ?? [];
  if (countEl) countEl.textContent = String(spells.length);
  host.innerHTML = '';

  if (spells.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'aether-spell-empty';
    empty.textContent = 'No Aether-Root spells yet — open Mythic, Arcane, or Frenzy packs to find them.';
    host.appendChild(empty);
    return;
  }

  for (const inst of spells) {
    const card = getCard(inst.cardId);
    if (!card) continue;
    const tile = document.createElement('div');
    tile.className = `aether-spell-tile aether-spell-rarity-${card.rarity}`;
    tile.innerHTML = `
      <div class="aether-spell-icon">✨</div>
      <div class="aether-spell-body">
        <div class="aether-spell-name">${escapeHtml(card.name)}</div>
        <div class="aether-spell-desc">${escapeHtml(card.description ?? '')}</div>
        <div class="aether-spell-meta">
          ${card.cooldown ? `${card.cooldown}s CD` : card.oncePerRound ? '1/round' : ''}
        </div>
      </div>
      <button type="button" class="btn btn-small btn-danger aether-spell-sell-btn" data-sell="${inst.instanceId}">Sell ${inst.sellValue}g</button>
    `;
    tile
      .querySelector('.aether-spell-sell-btn')
      .addEventListener('click', (e) => {
        e.stopPropagation();
        sellAetherSpell(run, inst.instanceId);
      });
    host.appendChild(tile);
  }
}

function renderShopCards(run) {
  const host = document.getElementById('shop-cards');
  if (!host) return;
  host.innerHTML = '';
  run.shopRoll.forEach((slot, slotIndex) => {
    const card = getCard(slot.cardId);
    if (!card) return;
    const el = renderCard(card, {
      cost: slot.cost,
      sold: slot.sold,
      onClick: () => buyShopSlot(run, slotIndex),
    });
    host.appendChild(el);
  });
}

function renderPackRow(run) {
  const host = document.getElementById('pack-chests');
  if (!host) return;
  host.innerHTML = '';
  for (const id of PACK_ORDER) {
    const pack = PACKS[id];
    const opened = run.packsOpened?.[id] ?? 0;
    const el = renderPackChest(pack, {
      opened,
      disabled: run.gold < pack.cost,
      onClick: () => buyPack(run, id),
    });
    host.appendChild(el);
  }
}

function updateRefreshButton(run) {
  const btn = document.getElementById('refresh-shop-button');
  if (!btn) return;
  btn.disabled = run.gold < REFRESH_COST;
}

// ============================================================
// MISC
// ============================================================

function flashError(msg) {
  const t = document.createElement('div');
  t.textContent = msg;
  t.className = 'shop-toast';
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 1800);
}
