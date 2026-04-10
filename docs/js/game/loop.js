/**
 * Game Loop
 *
 * Wraps requestAnimationFrame, computes delta time, and ticks the
 * provided update + render functions. Pauses cleanly when stopped.
 */

export class GameLoop {
  constructor({ update, render }) {
    this.update = update;
    this.render = render;
    this.running = false;
    this.lastTime = 0;
    this.rafId = null;
    this._tick = this._tick.bind(this);
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    this.rafId = requestAnimationFrame(this._tick);
  }

  stop() {
    this.running = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  _tick(now) {
    if (!this.running) return;

    // Cap delta time at 100ms to avoid huge jumps after tab-switch
    const dt = Math.min((now - this.lastTime) / 1000, 0.1);
    this.lastTime = now;

    this.update?.(dt);
    this.render?.();

    this.rafId = requestAnimationFrame(this._tick);
  }
}
