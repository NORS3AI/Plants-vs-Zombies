/**
 * Combat Renderer
 *
 * Paints the combat state produced by combat.js into the combat grid.
 * Uses absolute positioning for zombies (pixel-interpolated movement)
 * and CSS transitions for smooth walking animation.
 *
 * The grid tiles themselves are built once per COMBAT enter (static).
 * Per-frame updates only touch:
 *   - Zombie elements (move, HP bar, attack flash)
 *   - Plant HP bars
 *   - Plant attack flash
 *   - Floating text (gold popups, aether damage)
 */

import { getCard } from '../cards/index.js';
import { renderGridCardIcon } from './cardView.js';
import { GRID_ROWS, GRID_COLS, STAGING_COL } from '../game/grid.js';
import { castAetherSpell } from '../game/aetherSpells.js';
import { getCombatState } from '../game/combat.js';
import { showModal } from './modal.js';

// Optional audio manager; set by main.js via setCombatViewAudio
let _audio = null;
export function setCombatViewAudio(audio) { _audio = audio; }

// Emoji icons for each Aether-Root spell (keyed by card id)
const SPELL_ICONS = {
  sap_mend: '💚',
  grove_shield: '🛡️',
  thorn_pulse: '🌿',
  photosynthetic_burst: '☀️',
  natures_wrath: '⚡',
  verdant_rebirth: '🌱',
};

// Pixel sizing — read live from the CSS custom properties so a single
// breakpoint in main.css drives all grid layout math.
function readTileMetrics() {
  const styles = getComputedStyle(document.documentElement);
  const parse = (v, fallback) => {
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : fallback;
  };
  return {
    tilePx: parse(styles.getPropertyValue('--tile-size'), 56),
    gapPx: parse(styles.getPropertyValue('--tile-gap'), 4),
  };
}

let _hostEl = null;
let _gridEl = null;
let _overlayEl = null;

// Cached DOM elements by id for per-frame updates (avoids querySelector
// in the hot path)
const _zombieEls = new Map(); // zombie.id → { el, hpFill }
const _plantEls = new Map(); // plant.instanceId → { el, hpFill }

// Combat-time plant move mode. When set the next tap on an empty
// (non-staging) tile relocates the plant to that position. Cleared
// after a successful move, cancellation, or modal close.
let _moveMode = null; // { plant, run } | null
let _currentCombatRun = null; // captured in initCombatView for tile handlers

/**
 * Build the static grid DOM for combat. Called once on COMBAT enter.
 * Also places plant icons on their tiles based on run.deck placements.
 */
export function initCombatView(host, run) {
  _hostEl = host;
  _currentCombatRun = run;
  _moveMode = null;
  host.innerHTML = '';
  _zombieEls.clear();
  _plantEls.clear();

  // Aether-Root anchor (reused from shop grid style)
  const aether = document.createElement('div');
  aether.className = 'aether-root';
  const label = document.createElement('span');
  label.className = 'aether-label';
  label.innerHTML = '<span>AETHER</span><span>ROOT</span>';
  aether.appendChild(label);
  host.appendChild(aether);

  // Grid + overlay wrapper
  const wrap = document.createElement('div');
  wrap.className = 'combat-grid-wrap';

  const gridEl = document.createElement('div');
  gridEl.className = 'grid combat-grid';
  for (let r = 0; r < GRID_ROWS; r++) {
    for (let c = 0; c < GRID_COLS; c++) {
      const tile = document.createElement('div');
      const parity = (r + c) % 2 === 0 ? 'tile-a' : 'tile-b';
      const isStaging = c === STAGING_COL;
      tile.className = `grid-tile ${parity}${isStaging ? ' tile-staging' : ''}`;
      tile.dataset.row = String(r);
      tile.dataset.col = String(c);
      tile.addEventListener('click', () => handleCombatTileClick(r, c));
      gridEl.appendChild(tile);
    }
  }
  wrap.appendChild(gridEl);

  // Overlay for zombies + floating text (absolute positioned)
  const overlay = document.createElement('div');
  overlay.className = 'combat-overlay';
  wrap.appendChild(overlay);

  host.appendChild(wrap);
  _gridEl = gridEl;
  _overlayEl = overlay;

  // Build the Aether-Root spell side panel (outside the grid host)
  buildSpellPanel(run);

  // Seed plant elements on their tiles
  for (const instance of run.deck) {
    if (instance.gridRow == null || instance.gridCol == null) continue;
    const card = getCard(instance.cardId);
    if (!card) continue;
    const tile = findTile(instance.gridRow, instance.gridCol);
    if (!tile) continue;
    tile.innerHTML = '';
    const icon = renderGridCardIcon(card, instance);

    // Shield bar (blue, shown above HP when shield > 0)
    const shieldBar = document.createElement('div');
    shieldBar.className = 'plant-shield-bar';
    const shieldFill = document.createElement('div');
    shieldFill.className = 'plant-shield-fill';
    shieldFill.style.width = '0%';
    shieldBar.appendChild(shieldFill);
    icon.appendChild(shieldBar);

    // HP bar overlay on the plant
    const hpBar = document.createElement('div');
    hpBar.className = 'plant-hp-bar';
    const hpFill = document.createElement('div');
    hpFill.className = 'plant-hp-fill';
    hpFill.style.width = '100%';
    hpBar.appendChild(hpFill);
    icon.appendChild(hpBar);

    tile.appendChild(icon);
    tile.classList.add('tile-has-card');

    _plantEls.set(instance.instanceId, { el: icon, hpFill, shieldFill });
  }
}

function findTile(row, col) {
  if (!_gridEl) return null;
  return _gridEl.querySelector(`.grid-tile[data-row="${row}"][data-col="${col}"]`);
}

// ============================================================
// COMBAT TILE CLICKS — plant details + mid-round move
// ============================================================

function handleCombatTileClick(row, col) {
  const run = _currentCombatRun;
  const state = getCombatState();
  if (!run || !state) return;

  // In move mode: next tap picks the destination tile.
  if (_moveMode) {
    // Tap the source tile (the plant being moved) → cancel move mode
    if (row === _moveMode.plant.row && col === _moveMode.plant.col) {
      exitMoveMode();
      flashCombatToast('Move cancelled.');
      return;
    }
    if (col === STAGING_COL) {
      flashCombatToast("Can't move into the staging column.");
      return;
    }
    // Destination must be empty (no living plant)
    const occupied = state.plants.some(
      (p) => p.hp > 0 && p.row === row && p.col === col,
    );
    if (occupied) {
      flashCombatToast('That tile is already occupied.');
      return;
    }
    movePlantTo(_moveMode.plant, row, col, run);
    exitMoveMode();
    return;
  }

  // Otherwise: tap a plant to open its details modal
  const plant = state.plants.find(
    (p) => p.hp > 0 && p.row === row && p.col === col,
  );
  if (plant) {
    openCombatPlantModal(plant, run);
  }
}

/**
 * Combat-time plant details modal. Shows live HP, shield, buffs,
 * tier and targeting. Includes a Move button that enters move mode
 * so the player can relocate the plant to any empty non-staging
 * tile mid-round.
 */
async function openCombatPlantModal(plant, run) {
  const card = plant.card;
  const instance = run.deck.find((d) => d.instanceId === plant.instanceId);
  if (!card || !instance) return;

  const bodyHtml = buildCombatPlantBody(plant, card, instance);

  const choice = await showModal({
    title: card.name,
    bodyHtml,
    buttons: [
      { label: 'Move', value: 'move', kind: 'primary' },
      { label: 'Close', value: null, kind: 'default' },
    ],
    showClose: true,
    extraClass: 'modal-dialog-placed',
  });

  if (choice === 'move') {
    enterMoveMode(plant, run);
  }
}

/**
 * Build the live body HTML for a plant in combat. Uses the runtime
 * `plant` for current HP / shield / damage multipliers and the
 * `instance` buffs list for the stacked-spell breakdown.
 */
function buildCombatPlantBody(plant, card, instance) {
  const tier = plant.tier ?? 1;
  const buffs = instance.buffs ?? [];

  // Effective stats right now, in combat
  const effectiveDmg = Math.round(
    (card.damage + (plant.dmgBonus ?? 0)) * (plant.dmgMul ?? 1),
  );
  const baseCast = card.castTime > 0 ? card.castTime : 0;
  const castTime = Math.max(0.1, baseCast + (plant.castSpeedBuff ?? 0));

  const tierBadge = tier > 1
    ? `<span class="placed-tier-badge">T${tier}</span>`
    : '';

  const hpPct = Math.max(0, Math.min(1, plant.hp / plant.maxHp));
  const hpText = `${Math.ceil(plant.hp)} / ${Math.ceil(plant.maxHp)} HP`;
  const shieldRow = (plant.shield ?? 0) > 0
    ? `<div class="combat-plant-shield">🛡 Shield: <strong>${Math.ceil(plant.shield)}</strong></div>`
    : '';

  const statsParts = [];
  if (card.damage > 0) statsParts.push(`${effectiveDmg} DMG`);
  if (baseCast > 0) statsParts.push(`${castTime.toFixed(1)}s cast`);
  const statsLine = statsParts.length > 0 ? statsParts.join(' · ') : '—';

  const buffsHtml = buffs.length > 0
    ? `
      <div class="placed-section">
        <h4>Active Spells (${buffs.length})</h4>
        <ul class="placed-buffs-list">
          ${buffs.map((b) => `<li>${describeBuffText(b)}</li>`).join('')}
        </ul>
      </div>
    `
    : '';

  const targetingLine = card.damage > 0
    ? `<div class="combat-plant-targeting">Targeting: <strong>${escapeHtmlText(plant.targeting ?? 'first')}</strong></div>`
    : '';

  return `
    <div class="placed-modal-body">
      <p class="placed-modal-stats">${tierBadge}${escapeHtmlText(statsLine)}</p>
      <div class="combat-plant-hp-wrap">
        <div class="combat-plant-hp-text">${escapeHtmlText(hpText)}</div>
        <div class="combat-plant-hp-track"><div class="combat-plant-hp-fill" style="width:${hpPct * 100}%"></div></div>
      </div>
      ${shieldRow}
      <p class="placed-modal-desc">${escapeHtmlText(card.description ?? '')}</p>
      ${buffsHtml}
      ${targetingLine}
      <p class="combat-plant-move-hint">Tap <strong>Move</strong> to relocate this plant — any empty tile except the staging column is a valid target.</p>
    </div>
  `;
}

function describeBuffText(buff) {
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

function escapeHtmlText(s) {
  return String(s).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
  );
}

function enterMoveMode(plant, run) {
  _moveMode = { plant, run: run ?? _currentCombatRun };
  if (_gridEl) _gridEl.classList.add('combat-move-mode');
  // Highlight empty (non-staging) tiles as valid destinations
  const state = getCombatState();
  if (!state || !_gridEl) return;
  const tiles = _gridEl.querySelectorAll('.grid-tile');
  tiles.forEach((tile) => {
    const r = Number(tile.dataset.row);
    const c = Number(tile.dataset.col);
    if (c === STAGING_COL) return;
    const occupied = state.plants.some(
      (p) => p.hp > 0 && p.row === r && p.col === c,
    );
    if (!occupied) tile.classList.add('combat-move-target-valid');
    // The "source" tile gets a distinct class so the player knows
    // which plant they're moving.
    if (r === plant.row && c === plant.col) tile.classList.add('combat-move-source');
  });
  flashCombatToast('Tap an empty tile to move the plant there.');
}

function exitMoveMode() {
  _moveMode = null;
  if (_gridEl) {
    _gridEl.classList.remove('combat-move-mode');
    _gridEl.querySelectorAll('.grid-tile').forEach((tile) => {
      tile.classList.remove('combat-move-target-valid', 'combat-move-source');
    });
  }
}

/**
 * Relocate a plant to (row, col) mid-combat. Updates both the
 * runtime _state.plants entry (so targeting / findBlockingPlant
 * re-evaluate next tick) and the run.deck instance (so the new
 * position persists through save / round end / next shop phase).
 * Also moves the DOM icon between tiles.
 */
function movePlantTo(plant, row, col, run) {
  const oldTile = findTile(plant.row, plant.col);
  const newTile = findTile(row, col);
  if (!newTile) return;

  // Update runtime state
  plant.row = row;
  plant.col = col;

  // Update the persistent deck instance
  const instance = run.deck.find((d) => d.instanceId === plant.instanceId);
  if (instance) {
    instance.gridRow = row;
    instance.gridCol = col;
  }

  // Move the DOM icon between tiles. The _plantEls map entry still
  // points at the same element — it just lives under a new parent.
  const entry = _plantEls.get(plant.instanceId);
  if (entry?.el) {
    if (oldTile) {
      oldTile.classList.remove('tile-has-card');
      oldTile.innerHTML = '';
    }
    newTile.innerHTML = '';
    newTile.appendChild(entry.el);
    newTile.classList.add('tile-has-card');
  }

  flashCombatToast(`${plant.card.name} relocated.`);
}

function flashCombatToast(msg) {
  const t = document.createElement('div');
  t.textContent = msg;
  t.className = 'shop-toast shop-toast-success';
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 1800);
}

/**
 * Render one frame based on the current combat state.
 * Called from the game loop every frame while in COMBAT.
 */
export function renderCombatFrame(state) {
  if (!state || !_overlayEl) return;
  const { tilePx, gapPx } = readTileMetrics();
  const step = tilePx + gapPx;

  // ---------- Plants: HP bars + attack flash + shield ----------
  for (const plant of state.plants) {
    const entry = _plantEls.get(plant.instanceId);
    if (!entry) continue;
    const pct = Math.max(0, Math.min(1, plant.hp / plant.maxHp));
    entry.hpFill.style.width = `${pct * 100}%`;
    if (pct < 0.3) {
      entry.hpFill.classList.add('plant-hp-low');
    } else {
      entry.hpFill.classList.remove('plant-hp-low');
    }
    // Shield bar (blue, proportional to 50% of maxHp as a rough scale)
    if (entry.shieldFill) {
      const shield = plant.shield ?? 0;
      if (shield > 0) {
        const shieldPct = Math.min(1, shield / (plant.maxHp * 0.5));
        entry.shieldFill.style.width = `${shieldPct * 100}%`;
        entry.el.classList.add('plant-has-shield');
      } else {
        entry.shieldFill.style.width = '0%';
        entry.el.classList.remove('plant-has-shield');
      }
    }
    if (plant.attackFlash > 0) {
      entry.el.classList.add('plant-attacking');
    } else {
      entry.el.classList.remove('plant-attacking');
    }
    if (plant.hp <= 0) {
      entry.el.classList.add('plant-dead');
    }
  }

  // ---------- Zombies: create / update / remove ----------
  const seen = new Set();
  for (const zombie of state.zombies) {
    if (zombie.hp <= 0) continue;
    seen.add(zombie.id);
    let entry = _zombieEls.get(zombie.id);
    if (!entry) {
      entry = createZombieElement(zombie);
      _zombieEls.set(zombie.id, entry);
      _overlayEl.appendChild(entry.el);
    }
    const x = zombie.col * step;
    const y = zombie.row * step;
    entry.el.style.transform = `translate(${x}px, ${y}px)`;
    const pct = Math.max(0, Math.min(1, zombie.hp / zombie.maxHp));
    entry.hpFill.style.width = `${pct * 100}%`;
    if (pct < 0.3) entry.hpFill.classList.add('zombie-hp-low');
    else entry.hpFill.classList.remove('zombie-hp-low');

    if (zombie.state === 'attacking') entry.el.classList.add('zombie-attacking');
    else entry.el.classList.remove('zombie-attacking');

    // Slow status indicator
    const slowed = state.time < (zombie.slowUntil ?? 0);
    if (slowed) entry.el.classList.add('zombie-slowed');
    else entry.el.classList.remove('zombie-slowed');
  }

  // Boss banner
  updateBossBanner(state);

  // Aether-Root spell cooldowns (side panel)
  updateSpellPanel(state);

  // Aether-Root shield bar (HUD overlay)
  updateAetherHUD(state);

  // Remove zombies that are no longer in state (fade-out first)
  for (const [id, entry] of _zombieEls) {
    if (!seen.has(id)) {
      if (!entry.removing) {
        entry.removing = true;
        entry.el.classList.add('zombie-dying');
        setTimeout(() => {
          entry.el.remove();
          _zombieEls.delete(id);
        }, 260);
      }
    }
  }

  // ---------- Projectiles ----------
  renderProjectiles(state, step);

  // ---------- Floating texts ----------
  renderFloatingTexts(state, step);

  // ---------- Boss shake ----------
  if (state.bossJustSpawned > 0 && _gridEl) {
    _gridEl.classList.add('boss-shake');
  } else if (_gridEl) {
    _gridEl.classList.remove('boss-shake');
  }
}

function createZombieElement(zombie) {
  const el = document.createElement('div');
  el.className = 'combat-zombie';
  if (zombie.isBoss) {
    el.classList.add('combat-boss');
    el.style.setProperty('--boss-scale', String(zombie.scale ?? 1.5));
  }
  el.dataset.id = zombie.id;

  const sprite = document.createElement('div');
  sprite.className = 'zombie-sprite';
  sprite.textContent = zombie.sprite || '🧟';
  el.appendChild(sprite);

  const hpBar = document.createElement('div');
  hpBar.className = 'zombie-hp-bar';
  const hpFill = document.createElement('div');
  hpFill.className = 'zombie-hp-fill';
  hpFill.style.width = '100%';
  hpBar.appendChild(hpFill);
  el.appendChild(hpBar);

  return { el, hpFill };
}

// ---------- Projectiles ----------

const _projectileEls = new Map();

function renderProjectiles(state, step) {
  if (!state.projectiles) return;
  const present = new Set();
  for (const pj of state.projectiles) {
    present.add(pj.id);
    let el = _projectileEls.get(pj.id);
    if (!el) {
      el = document.createElement('div');
      el.className = `combat-projectile combat-projectile-${pj.color}`;
      _overlayEl.appendChild(el);
      _projectileEls.set(pj.id, el);
    }
    const t = Math.min(1, pj.age / pj.maxAge);
    // Interpolate from plant center to zombie center
    const sx = pj.fromCol * step + step / 2 - 4;
    const sy = pj.fromRow * step + step / 2 - 4;
    const ex = pj.toCol * step + step / 2 - 4;
    const ey = pj.toRow * step + step / 2 - 4;
    const x = sx + (ex - sx) * t;
    const y = sy + (ey - sy) * t;
    el.style.transform = `translate(${x}px, ${y}px)`;
    el.style.opacity = String(1 - t * 0.3);
  }
  for (const [id, el] of _projectileEls) {
    if (!present.has(id)) {
      el.remove();
      _projectileEls.delete(id);
    }
  }
}

// ---------- Floating texts (gold popups etc) ----------

const _floatingEls = new Map();

function renderFloatingTexts(state, step) {
  const present = new Set();
  for (const ft of state.floatingTexts) {
    // Use the stable id assigned by combat.js; fallback for older entries
    const key = ft.id ?? `anon_${ft.row}_${ft.col}`;
    present.add(key);
    let el = _floatingEls.get(key);
    if (!el) {
      el = document.createElement('div');
      el.className =
        `floating-text floating-text-${ft.color ?? 'gold'}` +
        (ft.big ? ' floating-text-big' : '');
      el.textContent = ft.text;
      _overlayEl.appendChild(el);
      _floatingEls.set(key, el);
    }
    const t = ft.age / ft.maxAge;
    const x = ft.col * step;
    const y = ft.row * step - t * 24; // drift upward
    el.style.transform = `translate(${x}px, ${y}px)`;
    el.style.opacity = String(Math.max(0, 1 - t));
  }
  // Remove expired
  for (const [key, el] of _floatingEls) {
    if (!present.has(key)) {
      el.remove();
      _floatingEls.delete(key);
    }
  }
}

// ---------- Aether-Root Spell Panel ----------

let _currentRun = null;
const _spellSlotEls = new Map(); // instanceId → { el, cooldownEl, readyDot }

function buildSpellPanel(run) {
  _currentRun = run;
  const host = document.getElementById('spell-slots');
  if (!host) return;
  host.innerHTML = '';
  _spellSlotEls.clear();

  const spells = run.aetherSpells ?? [];
  if (spells.length === 0) {
    const hint = document.createElement('p');
    hint.className = 'spell-panel-empty';
    hint.textContent = 'Open Mythic, Arcane, or Frenzy packs to find Aether-Root spells.';
    host.appendChild(hint);
    return;
  }

  for (const instance of spells) {
    const card = getCard(instance.cardId);
    if (!card) continue;
    const slot = document.createElement('button');
    slot.className = 'spell-slot';
    slot.dataset.instanceId = instance.instanceId;
    slot.title = `${card.name}\n${card.description}`;

    const iconEl = document.createElement('div');
    iconEl.className = 'spell-icon';
    iconEl.textContent = SPELL_ICONS[card.id] ?? '✨';
    slot.appendChild(iconEl);

    const nameEl = document.createElement('div');
    nameEl.className = 'spell-name';
    nameEl.textContent = card.name;
    slot.appendChild(nameEl);

    const cooldownEl = document.createElement('div');
    cooldownEl.className = 'spell-cooldown-overlay';
    const cooldownText = document.createElement('span');
    cooldownText.className = 'spell-cooldown-text';
    cooldownEl.appendChild(cooldownText);
    slot.appendChild(cooldownEl);

    slot.addEventListener('click', (e) => {
      e.stopPropagation();
      const ok = castAetherSpell(run, instance.instanceId);
      if (ok) {
        _audio?.playSfx('go');
        slot.classList.add('spell-just-cast');
        setTimeout(() => slot.classList.remove('spell-just-cast'), 300);
      } else {
        _audio?.playSfx('back');
        slot.classList.add('spell-denied');
        setTimeout(() => slot.classList.remove('spell-denied'), 300);
      }
    });

    host.appendChild(slot);
    _spellSlotEls.set(instance.instanceId, { slot, cooldownEl, cooldownText });
  }
}

function updateSpellPanel(state) {
  if (!_currentRun?.aetherSpells) return;
  for (const instance of _currentRun.aetherSpells) {
    const entry = _spellSlotEls.get(instance.instanceId);
    if (!entry) continue;
    const card = getCard(instance.cardId);
    const card_onRound = card?.oncePerRound;
    const cd = instance.cooldownRemaining ?? 0;
    const usedRound = card_onRound && instance.usedThisRound;

    if (cd > 0 || usedRound) {
      entry.slot.classList.add('spell-on-cooldown');
      if (usedRound) {
        entry.cooldownText.textContent = '1/rnd';
      } else {
        entry.cooldownText.textContent = `${Math.ceil(cd)}s`;
      }
    } else {
      entry.slot.classList.remove('spell-on-cooldown');
      entry.cooldownText.textContent = '';
    }
  }
}

// ---------- Aether-Root HUD (shield bar + HP) ----------

function updateAetherHUD(state) {
  if (!_currentRun) return;
  const shieldEl = document.getElementById('aether-shield-bar');
  const shieldFill = document.getElementById('aether-shield-fill');
  if (shieldEl && shieldFill) {
    const shield = _currentRun.aetherRootShield ?? 0;
    if (shield > 0) {
      shieldEl.classList.add('is-active');
      // Scale visible width to a rough max of 100 shield
      const pct = Math.min(1, shield / 100);
      shieldFill.style.width = `${pct * 100}%`;
      shieldEl.dataset.value = String(Math.round(shield));
    } else {
      shieldEl.classList.remove('is-active');
    }
  }
}

// ---------- Boss banner ----------

function updateBossBanner(state) {
  const banner = document.getElementById('boss-banner');
  if (!banner) return;
  const boss = state.bossActive;
  if (!boss || boss.hp <= 0) {
    banner.classList.remove('is-active');
    return;
  }
  banner.classList.add('is-active');
  const nameEl = banner.querySelector('.boss-banner-name');
  const hpEl = banner.querySelector('.boss-banner-hp-fill');
  const abilityEl = banner.querySelector('.boss-banner-ability');
  if (nameEl) nameEl.textContent = boss.name;
  if (abilityEl) abilityEl.textContent = boss.ability ? `${boss.ability}` : '';
  if (hpEl) {
    const pct = Math.max(0, Math.min(1, boss.hp / boss.maxHp));
    hpEl.style.width = `${pct * 100}%`;
  }
}

/** Tear down combat DOM on exit. */
export function resetCombatView() {
  if (_hostEl) _hostEl.innerHTML = '';
  const banner = document.getElementById('boss-banner');
  if (banner) banner.classList.remove('is-active');
  const spellHost = document.getElementById('spell-slots');
  if (spellHost) spellHost.innerHTML = '';
  const shieldEl = document.getElementById('aether-shield-bar');
  if (shieldEl) shieldEl.classList.remove('is-active');
  _hostEl = null;
  _gridEl = null;
  _overlayEl = null;
  _zombieEls.clear();
  _plantEls.clear();
  _floatingEls.clear();
  _projectileEls.clear();
  _spellSlotEls.clear();
  _currentRun = null;
  _currentCombatRun = null;
  _moveMode = null;
}
