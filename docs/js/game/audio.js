/**
 * Audio Manager
 *
 * Lazy-initialized Web Audio API wrapper. Synthesizes simple SFX
 * (clicks, ticks, transitions) so the music/sound toggles do something
 * audible immediately. Real music tracks land in Phase 12.
 *
 * Browsers require a user gesture before AudioContext.resume() works,
 * so init() is called on the first click event in main.js.
 */

const SFX_PRESETS = {
  click: (ctx, dest) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(dest);
    osc.type = 'sine';
    osc.frequency.value = 720;
    const t = ctx.currentTime;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.25, t + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);
    osc.start(t);
    osc.stop(t + 0.1);
  },

  hover: (ctx, dest) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(dest);
    osc.type = 'sine';
    const t = ctx.currentTime;
    osc.frequency.setValueAtTime(520, t);
    osc.frequency.exponentialRampToValueAtTime(680, t + 0.06);
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.12, t + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);
    osc.start(t);
    osc.stop(t + 0.1);
  },

  tick: (ctx, dest) => {
    // Countdown tick — short, urgent
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(dest);
    osc.type = 'square';
    osc.frequency.value = 480;
    const t = ctx.currentTime;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.15, t + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
    osc.start(t);
    osc.stop(t + 0.13);
  },

  go: (ctx, dest) => {
    // Round start — ascending arpeggio
    const notes = [440, 554, 660, 880];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(dest);
      osc.type = 'triangle';
      osc.frequency.value = freq;
      const t = ctx.currentTime + i * 0.06;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.2, t + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
      osc.start(t);
      osc.stop(t + 0.2);
    });
  },

  back: (ctx, dest) => {
    // Back/cancel — descending blip
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(dest);
    osc.type = 'sine';
    const t = ctx.currentTime;
    osc.frequency.setValueAtTime(520, t);
    osc.frequency.exponentialRampToValueAtTime(320, t + 0.1);
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.18, t + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
    osc.start(t);
    osc.stop(t + 0.13);
  },

  damage: (ctx, dest) => {
    // Aether-Root takes damage — low, alarming
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(dest);
    osc.type = 'sawtooth';
    const t = ctx.currentTime;
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.exponentialRampToValueAtTime(80, t + 0.25);
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.22, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
    osc.start(t);
    osc.stop(t + 0.32);
  },

  gameover: (ctx, dest) => {
    // Game over — descending lament
    const notes = [440, 392, 349, 294, 220];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(dest);
      osc.type = 'sine';
      osc.frequency.value = freq;
      const t = ctx.currentTime + i * 0.18;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.18, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);
      osc.start(t);
      osc.stop(t + 0.28);
    });
  },
};

export class AudioManager {
  constructor() {
    this.ctx = null;
    this.sfxBus = null;
    this.musicBus = null;
    this.musicEnabled = true;
    this.sfxEnabled = true;
    this.musicVolume = 0.6;
    this.sfxVolume = 0.8;
    this._initialized = false;
  }

  /**
   * Lazy init. Must be called from a user gesture (click) the first time
   * because of browser autoplay policies.
   */
  init() {
    if (this._initialized) return;
    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (!Ctor) {
      console.warn('[audio] Web Audio API unavailable');
      return;
    }
    try {
      this.ctx = new Ctor();
      this.sfxBus = this.ctx.createGain();
      this.sfxBus.gain.value = this.sfxVolume;
      this.sfxBus.connect(this.ctx.destination);
      this.musicBus = this.ctx.createGain();
      this.musicBus.gain.value = this.musicVolume;
      this.musicBus.connect(this.ctx.destination);
      this._initialized = true;
    } catch (e) {
      console.warn('[audio] init failed:', e);
    }
  }

  /** Apply settings from the Save store. */
  setSettings({ music, sounds, musicVolume, sfxVolume } = {}) {
    if (typeof music === 'boolean') this.musicEnabled = music;
    if (typeof sounds === 'boolean') this.sfxEnabled = sounds;
    if (typeof musicVolume === 'number') {
      this.musicVolume = musicVolume;
      if (this.musicBus) this.musicBus.gain.value = musicVolume;
    }
    if (typeof sfxVolume === 'number') {
      this.sfxVolume = sfxVolume;
      if (this.sfxBus) this.sfxBus.gain.value = sfxVolume;
    }
  }

  /** Fire a one-shot SFX by preset name. Silently no-ops if disabled or uninit. */
  playSfx(name) {
    if (!this.sfxEnabled || !this._initialized) return;
    const preset = SFX_PRESETS[name];
    if (!preset) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();
    try {
      // Bus handles all volume scaling — presets use fixed inner gains
      // so the slider response is linear, not quadratic.
      preset(this.ctx, this.sfxBus);
    } catch (e) {
      console.warn(`[audio] sfx '${name}' failed:`, e);
    }
  }

  /**
   * Music playback stub. Real tracks added in Phase 12.
   * The musicEnabled / musicVolume state is honored for forward-compat.
   */
  playMusic(/* trackName */) {
    // No-op until Phase 12
  }

  stopMusic() {
    // No-op until Phase 12
  }
}
