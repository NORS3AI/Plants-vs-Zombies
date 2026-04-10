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
import { GRID_ROWS, GRID_COLS } from '../game/grid.js';

// Pixel sizing (must match main.css .grid-tile size)
const TILE_PX = 56;
const TILE_GAP_PX = 4;
const MOBILE_TILE_PX = 40;

let _hostEl = null;
let _gridEl = null;
let _overlayEl = null;

// Cached DOM elements by id for per-frame updates (avoids querySelector
// in the hot path)
const _zombieEls = new Map(); // zombie.id → { el, hpFill }
const _plantEls = new Map(); // plant.instanceId → { el, hpFill }

/**
 * Build the static grid DOM for combat. Called once on COMBAT enter.
 * Also places plant icons on their tiles based on run.deck placements.
 */
export function initCombatView(host, run) {
  _hostEl = host;
  host.innerHTML = '';
  _zombieEls.clear();
  _plantEls.clear();

  // Aether-Root anchor (reused from shop grid style)
  const aether = document.createElement('div');
  aether.className = 'aether-root';
  const label = document.createElement('span');
  label.className = 'aether-label';
  label.textContent = 'Aether-Root';
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
      tile.className = `grid-tile ${parity}`;
      tile.dataset.row = String(r);
      tile.dataset.col = String(c);
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

  // Seed plant elements on their tiles
  for (const instance of run.deck) {
    if (instance.gridRow == null || instance.gridCol == null) continue;
    const card = getCard(instance.cardId);
    if (!card) continue;
    const tile = findTile(instance.gridRow, instance.gridCol);
    if (!tile) continue;
    tile.innerHTML = '';
    const icon = renderGridCardIcon(card);

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

    _plantEls.set(instance.instanceId, { el: icon, hpFill });
  }
}

function findTile(row, col) {
  if (!_gridEl) return null;
  return _gridEl.querySelector(`.grid-tile[data-row="${row}"][data-col="${col}"]`);
}

/** Figure out the current tile pixel size (handles mobile). */
function currentTileSize() {
  return window.innerWidth <= 900 ? MOBILE_TILE_PX : TILE_PX;
}

/**
 * Render one frame based on the current combat state.
 * Called from the game loop every frame while in COMBAT.
 */
export function renderCombatFrame(state) {
  if (!state || !_overlayEl) return;
  const tilePx = currentTileSize();
  const step = tilePx + TILE_GAP_PX;

  // ---------- Plants: HP bars + attack flash ----------
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
    // Position: col 0 = rightmost plant tile area, col 12 = right edge
    // Zombies enter at col 12 (offscreen-ish) and walk toward col 0.
    const x = zombie.col * step;
    const y = zombie.row * step;
    entry.el.style.transform = `translate(${x}px, ${y}px)`;
    const pct = Math.max(0, Math.min(1, zombie.hp / zombie.maxHp));
    entry.hpFill.style.width = `${pct * 100}%`;
    if (pct < 0.3) {
      entry.hpFill.classList.add('zombie-hp-low');
    } else {
      entry.hpFill.classList.remove('zombie-hp-low');
    }
    if (zombie.state === 'attacking') {
      entry.el.classList.add('zombie-attacking');
    } else {
      entry.el.classList.remove('zombie-attacking');
    }
  }

  // Remove zombies that are no longer in state
  for (const [id, entry] of _zombieEls) {
    if (!seen.has(id)) {
      entry.el.remove();
      _zombieEls.delete(id);
    }
  }

  // ---------- Floating texts ----------
  renderFloatingTexts(state, step);
}

function createZombieElement(zombie) {
  const el = document.createElement('div');
  el.className = 'combat-zombie';
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

// ---------- Floating texts (gold popups etc) ----------

const _floatingEls = new Map();

function renderFloatingTexts(state, step) {
  const present = new Set();
  for (let i = 0; i < state.floatingTexts.length; i++) {
    const ft = state.floatingTexts[i];
    const key = `ft_${i}_${ft.text}_${ft.row}_${ft.col.toFixed(1)}`;
    present.add(key);
    let el = _floatingEls.get(key);
    if (!el) {
      el = document.createElement('div');
      el.className = `floating-text floating-text-${ft.color ?? 'gold'}`;
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

/** Tear down combat DOM on exit. */
export function resetCombatView() {
  if (_hostEl) _hostEl.innerHTML = '';
  _hostEl = null;
  _gridEl = null;
  _overlayEl = null;
  _zombieEls.clear();
  _plantEls.clear();
  _floatingEls.clear();
}
