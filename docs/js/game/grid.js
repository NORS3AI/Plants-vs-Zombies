/**
 * 5×12 Grid Model + Renderer
 *
 * The battlefield is a 5-row × 12-column grid. The Aether-Root sits
 * to the left of the grid (not part of the 60 tiles). Plants are
 * placed on tiles in shop mode and act on cast timers in combat.
 */

export const GRID_ROWS = 5;
export const GRID_COLS = 12;

/** Create an empty grid: 2D array of nulls. */
export function createGrid() {
  const grid = [];
  for (let r = 0; r < GRID_ROWS; r++) {
    const row = [];
    for (let c = 0; c < GRID_COLS; c++) row.push(null);
    grid.push(row);
  }
  return grid;
}

/** Bounds check. */
export function inBounds(row, col) {
  return row >= 0 && row < GRID_ROWS && col >= 0 && col < GRID_COLS;
}

/** Place a card at (row, col). Returns true on success. */
export function placeCard(grid, row, col, card) {
  if (!inBounds(row, col)) return false;
  if (grid[row][col] !== null) return false;
  grid[row][col] = card;
  return true;
}

/** Remove the card at (row, col). Returns the removed card or null. */
export function removeCard(grid, row, col) {
  if (!inBounds(row, col)) return null;
  const card = grid[row][col];
  grid[row][col] = null;
  return card;
}

/**
 * Render the grid into a host element.
 * Builds Aether-Root + 5×12 tiles. Each tile gets data-row/data-col.
 */
export function renderGrid(host, { onTileClick } = {}) {
  host.innerHTML = '';

  // Aether-Root (left of grid)
  const aether = document.createElement('div');
  aether.className = 'aether-root';
  aether.title = 'Aether-Root (Mother Plant)';
  const label = document.createElement('span');
  label.className = 'aether-label';
  label.textContent = 'Aether-Root';
  aether.appendChild(label);
  host.appendChild(aether);

  // 5×12 Grid
  const gridEl = document.createElement('div');
  gridEl.className = 'grid';
  gridEl.setAttribute('role', 'grid');
  gridEl.setAttribute('aria-label', `${GRID_ROWS} by ${GRID_COLS} battlefield grid`);

  for (let r = 0; r < GRID_ROWS; r++) {
    for (let c = 0; c < GRID_COLS; c++) {
      const tile = document.createElement('div');
      const parity = (r + c) % 2 === 0 ? 'tile-a' : 'tile-b';
      tile.className = `grid-tile ${parity}`;
      tile.dataset.row = String(r);
      tile.dataset.col = String(c);
      tile.setAttribute('role', 'gridcell');
      tile.setAttribute('aria-label', `Row ${r + 1}, Column ${c + 1}`);
      if (onTileClick) {
        tile.addEventListener('click', () => onTileClick(r, c, tile));
      }
      gridEl.appendChild(tile);
    }
  }
  host.appendChild(gridEl);

  return { aether, gridEl };
}

/** Update tile visuals from a grid model (called per render frame in later phases). */
export function paintGrid(host, grid) {
  const tiles = host.querySelectorAll('.grid-tile');
  tiles.forEach((tile) => {
    const r = Number(tile.dataset.row);
    const c = Number(tile.dataset.col);
    const card = grid[r]?.[c];
    tile.textContent = card ? card.name?.[0] ?? '·' : '';
  });
}
