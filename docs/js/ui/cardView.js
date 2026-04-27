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

import { formatCardStats } from '../cards/index.js';
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
 *   - instance?: object — the deck instance (with buffs / tier) so the
 *     card can surface applied spells and tier even when unplaced.
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
  if (card.rarity === 'artifact') el.classList.add('card-artifact-shine');
  el.dataset.cardId = card.id;

  const instance = options.instance ?? null;
  const buffs = instance?.buffs ?? [];
  const tier = Math.max(1, instance?.tier ?? 1);

  // Rarity stripe (top)
  const stripe = document.createElement('div');
  stripe.className = 'card-stripe';
  el.appendChild(stripe);

  // Corner tier pill — visible even on small deck cards
  if (tier > 1) {
    const tierPill = document.createElement('div');
    tierPill.className = 'card-tier-pill';
    tierPill.textContent = `T${tier}`;
    tierPill.title = `Tier ${tier} (+${(tier - 1) * 10} HP, +${(tier - 1) * 5} DMG)`;
    el.appendChild(tierPill);
  }

  // Body
  const body = document.createElement('div');
  body.className = 'card-body';

  const name = document.createElement('div');
  name.className = 'card-name';
  name.textContent = card.name;
  body.appendChild(name);

  const typeRow = document.createElement('div');
  typeRow.className = 'card-type-row';
  const typeIcon = card.type === 'plant' ? '🌱' : '✨';
  const typeLabel = card.type === 'plant' ? 'Plant' : 'Spell';
  const typeSpan = document.createElement('span');
  typeSpan.textContent = `${typeIcon} ${typeLabel}`;
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

  // Active spells panel — shown on any card whose instance carries
  // buffs. Groups by spellId so "Wild Growth × 2" collapses cleanly.
  if (buffs.length > 0) {
    const spellsSection = document.createElement('div');
    spellsSection.className = 'card-active-spells';
    const header = document.createElement('div');
    header.className = 'card-active-spells-head';
    header.textContent = `Active Spells (${buffs.length})`;
    spellsSection.appendChild(header);
    const list = document.createElement('ul');
    list.className = 'card-active-spells-list';
    for (const entry of groupBuffsBySpell(buffs)) {
      const li = document.createElement('li');
      li.className = 'card-active-spells-item';
      li.textContent = entry.count > 1
        ? `${entry.name} × ${entry.count}`
        : entry.name;
      li.title = entry.summary;
      list.appendChild(li);
    }
    spellsSection.appendChild(list);
    body.appendChild(spellsSection);
  }

  // Artifact warning — limit 1 per cardId
  if (card.rarity === 'artifact') {
    const warn = document.createElement('div');
    warn.className = 'card-artifact-warn';
    warn.textContent = '⚠ Artifact — limit 1. Duplicates are auto-sold.';
    body.appendChild(warn);
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
  // Show "Plant" or "Spell" instead of the rarity name. Rarity still
  // drives the border color via `var(--rarity-${card.rarity})`.
  const typeLabel = card.type === 'plant' ? 'Plant' : 'Spell';
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
        <div class="cd-rarity" style="color: ${rarityColor};">${typeLabel}</div>
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
 * Shows the type glyph, first word of the name, and — when an
 * `instance` with buffs is passed in — a compact row of buff-type
 * icons stacked below the label so the player can see at a glance
 * which spells are applied without opening the modal.
 */
export function renderGridCardIcon(card, instance = null) {
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

  // Active-spell icon strip — visible on the grid tile itself so
  // buffed plants are obvious at a glance (the detailed list lives in
  // the tap-to-open modal).
  const buffs = instance?.buffs ?? [];
  if (buffs.length > 0) {
    const strip = document.createElement('div');
    strip.className = 'grid-card-buff-strip';
    const seen = new Set();
    for (const b of buffs) {
      if (seen.has(b.type)) continue;
      seen.add(b.type);
      const dot = document.createElement('span');
      dot.className = `grid-card-buff-icon grid-card-buff-${b.type}`;
      dot.textContent = buffTypeEmoji(b.type);
      dot.title = b.spellName ?? b.type;
      strip.appendChild(dot);
    }
    el.appendChild(strip);
  }
  return el;
}

function buffTypeEmoji(type) {
  switch (type) {
    case 'shield': return '🛡';
    case 'hp_boost': return '❤';
    case 'dmg_boost': return '⚔';
    case 'dmg_mul': return '⚡';
    case 'cast_speed': return '⏱';
    default: return '✨';
  }
}

/**
 * Group an instance's buffs by source spellId and return a flat
 * list of { name, count, summary } suitable for rendering on cards.
 * Buffs without a spellName (legacy saves or untagged pushes) fall
 * back to a type-based label so they still show up.
 */
function groupBuffsBySpell(buffs) {
  const groups = new Map();
  for (const b of buffs) {
    const key = b.spellId ?? `__type_${b.type}`;
    const name = b.spellName ?? fallbackBuffName(b);
    const summary = buffSummary(b);
    const existing = groups.get(key);
    if (existing) {
      existing.count += 1;
      existing.summary += `, ${summary}`;
    } else {
      groups.set(key, { name, count: 1, summary });
    }
  }
  return [...groups.values()];
}

function fallbackBuffName(b) {
  switch (b.type) {
    case 'shield': return 'Shield';
    case 'hp_boost': return 'HP Buff';
    case 'dmg_boost': return 'Damage Buff';
    case 'dmg_mul': return 'Damage Multiplier';
    case 'cast_speed': return 'Cast Speed';
    default: return b.type ?? 'Buff';
  }
}

function buffSummary(b) {
  switch (b.type) {
    case 'shield': return `+${b.value} shield`;
    case 'hp_boost': return `+${b.value} max HP`;
    case 'dmg_boost': return `+${b.value} damage`;
    case 'dmg_mul': return `×${b.value} damage`;
    case 'cast_speed': {
      const sign = b.value < 0 ? '' : '+';
      return `${sign}${b.value}s cast time`;
    }
    default: return b.type ?? '';
  }
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
