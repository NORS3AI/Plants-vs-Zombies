/**
 * 5×9 Grid Model + Renderer
 *
 * The battlefield is a 5-row × 9-column grid. The Aether-Root sits
 * to the left of the grid (not part of the 45 tiles). Plants are
 * placed on tiles in shop mode and act on cast timers in combat.
 *
 * The rightmost column (col 8, the 9th) is a "staging" zone: it is
 * yellow-checkered, cannot hold plants, and zombies inside it are
 * untargetable. Zombies spawn off-screen and walk through this
 * staging column first, giving them a few seconds to march into
 * battle formation before plants can attack them.
 */

export const GRID_ROWS = 5;
export const GRID_COLS = 9;
/** Rightmost column index: zombies spawn here and are untargetable. */
export const STAGING_COL = GRID_COLS - 1;

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
 * Builds Aether-Root + 5×9 tiles. Each tile gets data-row/data-col.
 */
export function renderGrid(host, { onTileClick } = {}) {
  host.innerHTML = '';

  // Aether-Root (left of grid)
  const aether = document.createElement('div');
  aether.className = 'aether-root';
  aether.title = 'Aether-Root (Mother Plant)';
  const label = document.createElement('span');
  label.className = 'aether-label';
  // Split into two lines so it fits the narrow Aether-Root column on mobile
  label.innerHTML = '<span>AETHER</span><span>ROOT</span>';
  aether.appendChild(label);
  host.appendChild(aether);

  // 5×9 Grid
  const gridEl = document.createElement('div');
  gridEl.className = 'grid';
  gridEl.setAttribute('role', 'grid');
  gridEl.setAttribute('aria-label', `${GRID_ROWS} by ${GRID_COLS} battlefield grid`);

  for (let r = 0; r < GRID_ROWS; r++) {
    for (let c = 0; c < GRID_COLS; c++) {
      const tile = document.createElement('div');
      const parity = (r + c) % 2 === 0 ? 'tile-a' : 'tile-b';
      const isStaging = c === STAGING_COL;
      tile.className = `grid-tile ${parity}${isStaging ? ' tile-staging' : ''}`;
      tile.dataset.row = String(r);
      tile.dataset.col = String(c);
      tile.setAttribute('role', 'gridcell');
      tile.setAttribute('aria-label',
        isStaging
          ? `Row ${r + 1}, staging column (zombies untargetable)`
          : `Row ${r + 1}, Column ${c + 1}`
      );
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
