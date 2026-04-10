/**
 * Card View
 *
 * Renders a single card as a DOM element. Used by:
 *   - Shop slots (3-card spawn)
 *   - Pack opening reveals
 *   - Deck inventory
 *   - Card detail panel (Phase 5+)
 *
 * The renderer is purely presentational. Buy/sell logic lives in shop.js.
 */

import { RARITIES, formatCardStats } from '../cards/index.js';

/**
 * Build a card element.
 *
 * @param {object} card     Card definition (from /cards data files)
 * @param {object} options
 *   - cost?: number — show "X gold" tag (shop slot)
 *   - sellValue?: number — show "Sell: X" tag (deck inventory)
 *   - sold?: boolean — gray out, mark sold
 *   - small?: boolean — compact mode for deck inventory
 *   - onClick?: (card) => void — click handler
 * @returns {HTMLElement}
 */
export function renderCard(card, options = {}) {
  const el = document.createElement('div');
  el.className = `card card-rarity-${card.rarity}`;
  if (options.small) el.classList.add('card-small');
  if (options.sold) el.classList.add('card-sold');
  if (card.rarity === 'legendary') el.classList.add('card-legendary-shine');
  el.dataset.cardId = card.id;

  // Rarity stripe (top)
  const stripe = document.createElement('div');
  stripe.className = 'card-stripe';
  el.appendChild(stripe);

  // Body
  const body = document.createElement('div');
  body.className = 'card-body';

  const name = document.createElement('div');
  name.className = 'card-name';
  name.textContent = card.name;
  body.appendChild(name);

  const typeRow = document.createElement('div');
  typeRow.className = 'card-type-row';
  const rarityLabel = RARITIES[card.rarity]?.label ?? card.rarity;
  const typeIcon = card.type === 'plant' ? '🌱' : '✨';
  typeRow.innerHTML = `<span>${typeIcon} ${rarityLabel}</span>`;
  body.appendChild(typeRow);

  if (!options.small) {
    const stats = document.createElement('div');
    stats.className = 'card-stats';
    stats.textContent = formatCardStats(card);
    body.appendChild(stats);

    const desc = document.createElement('div');
    desc.className = 'card-desc';
    desc.textContent = card.description ?? '';
    body.appendChild(desc);
  }

  el.appendChild(body);

  // Footer (cost / sell value)
  if (options.cost != null || options.sellValue != null) {
    const footer = document.createElement('div');
    footer.className = 'card-footer';
    if (options.cost != null) {
      const tag = document.createElement('span');
      tag.className = 'card-cost';
      tag.textContent = options.sold ? 'SOLD' : `${options.cost} gold`;
      footer.appendChild(tag);
    } else if (options.sellValue != null) {
      const tag = document.createElement('span');
      tag.className = 'card-sell';
      tag.textContent = `Sell: ${options.sellValue}g`;
      footer.appendChild(tag);
    }
    el.appendChild(footer);
  }

  if (options.onClick && !options.sold) {
    el.classList.add('card-clickable');
    el.addEventListener('click', () => options.onClick(card, el));
  }

  return el;
}

/**
 * Build a pack chest element.
 *
 * @param {object} pack — Pack definition from /cards/packs.js
 * @param {object} options
 *   - onClick?: (pack) => void
 *   - disabled?: boolean — gray out (e.g., not enough gold)
 *   - opened?: number — pity counter, shown as "Opened: N"
 * @returns {HTMLElement}
 */
export function renderPackChest(pack, options = {}) {
  const el = document.createElement('button');
  el.className = `pack-chest pack-chest-${pack.id}`;
  if (options.disabled) {
    el.classList.add('disabled');
    el.disabled = true;
  }
  el.dataset.packId = pack.id;

  const icon = document.createElement('div');
  icon.className = 'pack-icon';
  icon.textContent = pack.id === 'mythic' ? '📦' : pack.id === 'arcane' ? '🎁' : '💎';
  el.appendChild(icon);

  const name = document.createElement('div');
  name.className = 'pack-name';
  name.textContent = pack.label;
  el.appendChild(name);

  const cost = document.createElement('div');
  cost.className = 'pack-cost';
  cost.textContent = `${pack.cost} gold`;
  el.appendChild(cost);

  if (options.opened != null && pack.pityLegendaryEvery) {
    const pity = document.createElement('div');
    pity.className = 'pack-pity';
    const next = pack.pityLegendaryEvery - (options.opened % pack.pityLegendaryEvery);
    pity.textContent = next === pack.pityLegendaryEvery ? `Opened: ${options.opened}` : `Pity in ${next}`;
    el.appendChild(pity);
  }

  if (options.onClick && !options.disabled) {
    el.addEventListener('click', () => options.onClick(pack));
  }

  return el;
}
