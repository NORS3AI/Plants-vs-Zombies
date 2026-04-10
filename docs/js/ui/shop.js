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

export const MAX_DECK_SIZE = 10;
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
 * Add a card to the deck. Rolls a sellValue at insertion time so it's
 * deterministic for the lifetime of that instance.
 */
function addToDeck(run, card) {
  const instance = {
    cardId: card.id,
    instanceId: freshInstanceId(),
    sellValue: rollSell(card),
  };
  run.deck.push(instance);
}

/**
 * Add an Aether-Root spell to the side panel inventory.
 */
function addToAetherSpells(run, card) {
  if (!run.aetherSpells) run.aetherSpells = [];
  run.aetherSpells.push({
    cardId: card.id,
    instanceId: freshInstanceId(),
    sellValue: rollSell(card),
    cooldownRemaining: 0,
    usedThisRound: false,
  });
}

/**
 * Buy a card from the shop slot. Returns true on success.
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
  if (run.deck.length >= MAX_DECK_SIZE) {
    flashError(`Deck full (${MAX_DECK_SIZE} max)`);
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
 * Sell a deck card by its instance id. Confirms via modal first.
 */
export async function sellDeckCard(run, instanceId) {
  const idx = run.deck.findIndex((c) => c.instanceId === instanceId);
  if (idx < 0) return false;
  const instance = run.deck[idx];
  const card = getCard(instance.cardId);
  if (!card) return false;

  const ok = await confirmModal({
    title: `Sell ${card.name}?`,
    message: `You will receive ${instance.sellValue} gold. This cannot be undone.`,
    confirmLabel: `Sell for ${instance.sellValue}g`,
    cancelLabel: 'Cancel',
  });
  if (!ok) return false;

  run.deck.splice(idx, 1);
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

  // No pre-flight deck-full check: pack contents may be all Aether-Root
  // spells (which go to a separate inventory). We distribute carefully
  // below and warn if deck overflow causes drops.

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

  // Distribute: deck cards capped at MAX_DECK_SIZE, Aether-Root spells go
  // to the side panel inventory. Track overflow drops to warn the player.
  let droppedCount = 0;
  for (const card of cards) {
    if (card.category === 'aether_root') {
      addToAetherSpells(run, card);
    } else if (run.deck.length < MAX_DECK_SIZE) {
      addToDeck(run, card);
    } else {
      droppedCount++;
    }
  }

  _audio?.playSfx('go');
  _onFirstPack?.();
  _onChange?.();

  if (droppedCount > 0) {
    flashError(`Deck full — ${droppedCount} card${droppedCount > 1 ? 's' : ''} lost. Sell some cards first.`);
  }

  // Show pack-opening modal
  await showPackRevealModal(pack, cards);
  return true;
}

function showPackRevealModal(pack, cards) {
  const titleEl = `${pack.label} Pack — ${cards.length} cards`;
  const cardsHtml = cards
    .map((c) => {
      const rarityClass = `card-rarity-${c.rarity}`;
      const icon = c.type === 'plant' ? '🌱' : '✨';
      return `
        <div class="reveal-card ${rarityClass}">
          <div class="reveal-card-icon">${icon}</div>
          <div class="reveal-card-name">${escapeHtml(c.name)}</div>
          <div class="reveal-card-rarity">${escapeHtml(c.rarity)}</div>
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
  updateRefreshButton(run);
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
