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
import { showModal } from './modal.js';

/**
 * Build a card element.
 *
 * @param {object} card     Card definition (from /cards data files)
 * @param {object} options
 *   - cost?: number — show "X gold" tag (shop slot)
 *   - sellValue?: number — show "Sell: X" tag (deck inventory)
 *   - sold?: boolean — gray out, mark sold
 *   - small?: boolean — compact mode for deck inventory
 *   - isSelected?: boolean — visual "currently selected for placement"
 *   - isPlaced?: boolean — visual "already placed on grid"
 *   - onClick?: (card) => void — main card body click
 *   - onSell?: (card) => void — "Sell" pill click (stops propagation)
 * @returns {HTMLElement}
 */
export function renderCard(card, options = {}) {
  const el = document.createElement('div');
  el.className = `card card-rarity-${card.rarity}`;
  if (options.small) el.classList.add('card-small');
  if (options.sold) el.classList.add('card-sold');
  if (options.isSelected) el.classList.add('card-selected');
  if (options.isPlaced) el.classList.add('card-placed');
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
  const typeSpan = document.createElement('span');
  typeSpan.textContent = `${typeIcon} ${rarityLabel}`;
  typeRow.appendChild(typeSpan);
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

  // Footer (cost / sell value / sell button)
  if (options.cost != null || options.sellValue != null) {
    const footer = document.createElement('div');
    footer.className = 'card-footer';
    if (options.cost != null) {
      const tag = document.createElement('span');
      tag.className = 'card-cost';
      tag.textContent = options.sold ? 'SOLD' : `${options.cost} gold`;
      footer.appendChild(tag);
    } else if (options.sellValue != null) {
      if (options.onSell) {
        // Interactive sell pill
        const sellBtn = document.createElement('button');
        sellBtn.className = 'card-sell-btn';
        sellBtn.textContent = `Sell ${options.sellValue}g`;
        sellBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          options.onSell(card);
        });
        footer.appendChild(sellBtn);
      } else {
        const tag = document.createElement('span');
        tag.className = 'card-sell';
        tag.textContent = `Sell: ${options.sellValue}g`;
        footer.appendChild(tag);
      }
    }
    el.appendChild(footer);
  }

  if (options.onClick && !options.sold) {
    el.classList.add('card-clickable');
    el.addEventListener('click', () => options.onClick(card, el));
  }

  // Info button (top-right): opens the full card detail modal.
  // Stops propagation so it doesn't trigger placement/select.
  if (options.showInfo !== false) {
    const infoBtn = document.createElement('button');
    infoBtn.className = 'card-info-btn';
    infoBtn.type = 'button';
    infoBtn.textContent = 'ℹ';
    infoBtn.setAttribute('aria-label', 'Card details');
    infoBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      showCardDetails(card);
    });
    el.appendChild(infoBtn);
  }

  return el;
}

/**
 * Show a full card detail modal (the "card flip" view). Rendered via
 * modal.js showModal with bodyHtml so it picks up the existing
 * backdrop, fade-in, and tap-outside dismiss behaviors. A red X in
 * the top-right also dismisses.
 */
export function showCardDetails(card) {
  const rarityLabel = RARITIES[card.rarity]?.label ?? card.rarity;
  const rarityColor = `var(--rarity-${card.rarity})`;
  const typeIcon = card.type === 'plant' ? '🌱' : '✨';

  const escape = (s) =>
    String(s ?? '').replace(/[&<>"']/g, (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
    );

  let statsRows = '';
  if (card.type === 'plant') {
    statsRows += `<div class="cd-stat"><span>Health</span><strong>${card.health}</strong></div>`;
    if (card.damage > 0) statsRows += `<div class="cd-stat"><span>Damage</span><strong>${card.damage}</strong></div>`;
    if (card.castTime > 0) statsRows += `<div class="cd-stat"><span>Cast Time</span><strong>${card.castTime}s</strong></div>`;
    if (card.range != null && card.range !== 0) statsRows += `<div class="cd-stat"><span>Range</span><strong>${card.range}</strong></div>`;
    if (card.attackPattern && card.attackPattern !== 'none') statsRows += `<div class="cd-stat"><span>Attack</span><strong>${escape(card.attackPattern)}</strong></div>`;
    if (card.targetingDefault && card.targetingDefault !== 'none') statsRows += `<div class="cd-stat"><span>Targets</span><strong>${escape(card.targetingDefault)}</strong></div>`;
  } else {
    if (card.cooldown) statsRows += `<div class="cd-stat"><span>Cooldown</span><strong>${card.cooldown}s</strong></div>`;
    if (card.oncePerRound) statsRows += `<div class="cd-stat"><span>Usage</span><strong>1 / round</strong></div>`;
    if (card.target) statsRows += `<div class="cd-stat"><span>Target</span><strong>${escape(card.target)}</strong></div>`;
  }

  // Surface abilities in a friendly list
  const abilities = card.abilities ?? [];
  const economy = card.economy;
  let extrasHtml = '';
  if (abilities.length > 0) {
    extrasHtml += '<div class="cd-section"><h4>Abilities</h4><ul>';
    for (const a of abilities) {
      const type = a.type?.replace(/_/g, ' ') ?? '';
      extrasHtml += `<li>${escape(type)}</li>`;
    }
    extrasHtml += '</ul></div>';
  }
  if (economy) {
    extrasHtml += '<div class="cd-section"><h4>Economy</h4><ul>';
    if (economy.goldPerCast != null) extrasHtml += `<li>+${economy.goldPerCast} gold every ${card.castTime}s</li>`;
    if (economy.goldPerLaneKill != null) extrasHtml += `<li>+${economy.goldPerLaneKill} gold per kill in this lane</li>`;
    if (economy.goldPerKill) extrasHtml += `<li>Gold per kill scales with round</li>`;
    extrasHtml += '</ul></div>';
  }

  const bodyHtml = `
    <div class="card-details card-rarity-${escape(card.rarity)}">
      <div class="cd-header">
        <div class="cd-icon">${typeIcon}</div>
        <div class="cd-rarity" style="color: ${rarityColor};">${escape(rarityLabel)}</div>
      </div>
      ${statsRows ? `<div class="cd-stats">${statsRows}</div>` : ''}
      <p class="cd-desc">${escape(card.description ?? '')}</p>
      ${extrasHtml}
    </div>
  `;

  return showModal({
    title: card.name,
    bodyHtml,
    buttons: [],
    showClose: true,
    dismissible: true,
    extraClass: 'modal-dialog-flip',
  });
}

/**
 * Build a tiny card icon suitable for rendering inside a grid tile.
 * Just shows the first letter + rarity border.
 */
export function renderGridCardIcon(card) {
  const el = document.createElement('div');
  el.className = `grid-card grid-card-rarity-${card.rarity}`;
  const icon = document.createElement('div');
  icon.className = 'grid-card-icon';
  icon.textContent = card.type === 'plant' ? '🌱' : '✨';
  el.appendChild(icon);
  const label = document.createElement('div');
  label.className = 'grid-card-label';
  label.textContent = card.name.split(' ')[0]; // First word
  el.appendChild(label);
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
