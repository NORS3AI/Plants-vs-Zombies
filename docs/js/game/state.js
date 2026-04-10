/**
 * State Machine
 *
 * Drives screen transitions through the game flow:
 *   MENU → DIFFICULTY → SHOP → COUNTDOWN → COMBAT → ROUND_END → SHOP (loop)
 *                                                  ↘ GAME_OVER
 */

export const STATES = Object.freeze({
  MENU: 'menu',
  DIFFICULTY: 'difficulty',
  SHOP: 'shop',
  COUNTDOWN: 'countdown',
  COMBAT: 'combat',
  ROUND_END: 'round_end',
  GAME_OVER: 'game_over',
  VICTORY: 'victory',
  LEADERBOARD: 'leaderboard',
  SETTINGS: 'settings',
});

export class StateMachine {
  constructor() {
    this.current = null;
    this.previous = null;
    this.handlers = new Map();
    this.listeners = new Set();
  }

  /**
   * Register lifecycle handlers for a state.
   * handlers: { enter?(data), exit?(), update?(dt), render?() }
   */
  register(name, handlers = {}) {
    this.handlers.set(name, handlers);
  }

  /** Subscribe to state-change events. Returns unsubscribe fn. */
  onChange(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  /** Transition to a new state, calling exit() on the old and enter() on the new. */
  transition(name, data = null) {
    if (!this.handlers.has(name)) {
      console.warn(`[state] unknown state: ${name}`);
      return;
    }
    if (this.current === name) return;

    const oldHandlers = this.handlers.get(this.current);
    oldHandlers?.exit?.();

    this.previous = this.current;
    this.current = name;

    const newHandlers = this.handlers.get(name);
    newHandlers?.enter?.(data);

    this.listeners.forEach((fn) => fn(name, this.previous));
  }

  /** Per-frame update tick. */
  update(dt) {
    this.handlers.get(this.current)?.update?.(dt);
  }

  /** Per-frame render tick. */
  render() {
    this.handlers.get(this.current)?.render?.();
  }
}
