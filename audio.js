/* Blue Gold Rush audio: original Web Audio synthesis (no external assets). */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.BGRAudio = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const STORE_KEY = 'bgr-audio-v1';
  const MAX_VOICES = 12;
  const BPM = 132, STEP = 60 / BPM / 4;
  const LOOKAHEAD = 0.14, TICK_MS = 40;
  const hz = n => 440 * Math.pow(2, (n - 69) / 12);
  // Am - F - C - G, 16 steps per bar
  const CHORDS = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]];
  const ARP = [0, 1, 2, 1, 2, 1, 0, 1, 2, 1, 2, 1, 2, 1, 0, 1];

  function create(opts) {
    opts = opts || {};
    const win = opts.window || (typeof window !== 'undefined' ? window : {});
    const storage = opts.storage !== undefined ? opts.storage : (function () { try { return win.localStorage; } catch (e) { return null; } })();
    const Ctor = opts.AudioContext || win.AudioContext || win.webkitAudioContext;

    let ctx = null, master = null, sfxBus = null, musicBus = null, noiseBuf = null;
    let enabled = true, volume = 0.7;
    let state = 'menu';           // menu, run, pause, over
    let musicOn = false, timer = null, nextTime = 0, step = 0;
    let voices = 0;
    const lastPlayed = {};
    const listeners = [];

    try {
      const s = storage && JSON.parse(storage.getItem(STORE_KEY) || 'null');
      if (s) {
        if (typeof s.enabled === 'boolean') enabled = s.enabled;
        if (typeof s.volume === 'number' && isFinite(s.volume)) volume = Math.min(1, Math.max(0, s.volume));
      }
    } catch (e) { /* ignore corrupt storage */ }

    const save = () => { try { storage && storage.setItem(STORE_KEY, JSON.stringify({ enabled, volume })); } catch (e) {} };
    const emit = () => listeners.forEach(fn => { try { fn({ enabled, volume }); } catch (e) {} });
    const gainValue = () => (enabled ? volume : 0);

    function applyGain() {
      if (!master) return;
      const t = ctx.currentTime;
      master.gain.cancelScheduledValues(t);
      master.gain.setTargetAtTime(gainValue(), t, 0.015);
    }

    // Must be called from a user gesture the first time.
    function init() {
      if (!Ctor) return false;
      if (!ctx) {
        try { ctx = new Ctor(); } catch (e) { ctx = null; return false; }
        master = ctx.createGain(); master.gain.value = gainValue();
        const comp = ctx.createDynamicsCompressor();
        sfxBus = ctx.createGain(); sfxBus.gain.value = 0.9;
        musicBus = ctx.createGain(); musicBus.gain.value = 0.32;
        sfxBus.connect(master); musicBus.connect(master);
        master.connect(comp); comp.connect(ctx.destination);
        const len = Math.floor(ctx.sampleRate * 0.5);
        noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
        const d = noiseBuf.getChannelData(0);
        for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      }
      if (ctx.state === 'suspended' && ctx.resume) { const p = ctx.resume(); if (p && p.catch) p.catch(() => {}); }
      syncMusic();
      return true;
    }

    // ---- synthesis helpers ----
    function osc(type, f0, f1, t, dur, vol, bus, counted) {
      if (counted) { if (voices >= MAX_VOICES) return; voices++; }
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = type; o.frequency.setValueAtTime(f0, t);
      if (f1 && f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol, t + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(bus);
      o.onended = () => { try { o.disconnect(); g.disconnect(); } catch (e) {} if (counted) voices--; };
      o.start(t); o.stop(t + dur + 0.03);
    }
    function noise(t, dur, vol, bus, filterType, f0, f1, counted) {
      if (counted) { if (voices >= MAX_VOICES) return; voices++; }
      const s = ctx.createBufferSource(), fl = ctx.createBiquadFilter(), g = ctx.createGain();
      s.buffer = noiseBuf; fl.type = filterType; fl.frequency.setValueAtTime(f0, t);
      if (f1) fl.frequency.exponentialRampToValueAtTime(f1, t + dur);
      g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      s.connect(fl); fl.connect(g); g.connect(bus);
      s.onended = () => { try { s.disconnect(); fl.disconnect(); g.disconnect(); } catch (e) {} if (counted) voices--; };
      s.start(t); s.stop(t + dur + 0.03);
    }

    const SFX = {
      click(t) { osc('triangle', 660, 880, t, 0.07, 0.3, sfxBus, true); },
      start(t) { [392, 523, 659, 784].forEach((f, i) => osc('square', f, f, t + i * 0.07, 0.14, 0.18, sfxBus, true)); },
      jump(t) { osc('square', 300, 780, t, 0.18, 0.2, sfxBus, true); },
      slide(t) { noise(t, 0.28, 0.35, sfxBus, 'bandpass', 2400, 500, true); },
      lane(t) { noise(t, 0.09, 0.22, sfxBus, 'bandpass', 1400, 2600, true); },
      coinBlue(t) { osc('sine', 988, 988, t, 0.1, 0.3, sfxBus, true); osc('sine', 1319, 1319, t + 0.07, 0.18, 0.3, sfxBus, true); },
      coinGold(t) { osc('triangle', 1175, 1175, t, 0.1, 0.3, sfxBus, true); osc('triangle', 1568, 1568, t + 0.07, 0.12, 0.3, sfxBus, true); osc('triangle', 2093, 2093, t + 0.14, 0.25, 0.28, sfxBus, true); },
      crash(t) { noise(t, 0.5, 0.7, sfxBus, 'lowpass', 3000, 120, true); osc('sawtooth', 160, 40, t, 0.4, 0.45, sfxBus, true); },
      gameover(t) { [440, 370, 311, 220].forEach((f, i) => osc('triangle', f, f * 0.97, t + 0.15 + i * 0.2, 0.3, 0.3, sfxBus, true)); },
      skyBike(t) { noise(t, 0.9, 0.35, sfxBus, 'bandpass', 500, 3200, true); [523, 659, 784, 1047].forEach((f, i) => osc('triangle', f, f * 1.02, t + i * 0.08, 0.18, 0.22, sfxBus, true)); },
      land(t) { noise(t, 0.35, 0.3, sfxBus, 'lowpass', 1800, 200, true); osc('sine', 220, 110, t, 0.25, 0.3, sfxBus, true); },
    };
    // minimum gap (s) per effect to avoid stacking duplicates
    const GAP = { click: 0.04, start: 0.3, jump: 0.08, slide: 0.12, lane: 0.05, coinBlue: 0.03, coinGold: 0.03, crash: 0.5, gameover: 0.5, skyBike: 0.5, land: 0.3 };

    function play(name) {
      if (!ctx || !enabled || volume <= 0 || !SFX[name]) return false;
      if (ctx.state !== 'running') return false;
      // no gameplay effects once the run has ended (crash/gameover/UI are allowed)
      if (state === 'over' && name !== 'gameover' && name !== 'click' && name !== 'start' && name !== 'crash') return false;
      if (state === 'pause' && name !== 'click') return false;
      const now = ctx.currentTime;
      if (lastPlayed[name] !== undefined && now - lastPlayed[name] < (GAP[name] || 0)) return false;
      lastPlayed[name] = now;
      SFX[name](now + 0.005);
      return true;
    }

    // ---- music ----
    function scheduleStep(i, t) {
      const bar = Math.floor(i / 16) % 4, s = i % 16, chord = CHORDS[bar];
      if (s % 4 === 0) { osc('sine', 120, 45, t, 0.18, 0.9, musicBus, false); }       // kick
      if (s % 4 === 2) noise(t, 0.04, 0.18, musicBus, 'highpass', 7000, 0, false);   // hat
      if (s === 4 || s === 12) noise(t, 0.12, 0.25, musicBus, 'bandpass', 1800, 0, false); // snare
      if (s % 2 === 0) osc('sawtooth', hz(chord[0] - 24 + (s % 8 === 6 ? 12 : 0)), 0, t, STEP * 1.6, 0.28, musicBus, false); // bass
      osc('square', hz(chord[ARP[s]] + 12), 0, t, STEP * 0.8, 0.09, musicBus, false);   // arp
      if (s === 0) osc('triangle', hz(chord[2] + 24), 0, t, STEP * 6, 0.1, musicBus, false); // lead sparkle
    }
    function tick() {
      if (!ctx || !musicOn) return;
      while (nextTime < ctx.currentTime + LOOKAHEAD) { scheduleStep(step, nextTime); step++; nextTime += STEP; }
    }
    function startMusic() {
      if (!ctx || timer) return;
      musicOn = true; nextTime = ctx.currentTime + 0.05; step = 0;
      musicBus.gain.cancelScheduledValues(ctx.currentTime);
      musicBus.gain.setTargetAtTime(0.32, ctx.currentTime, 0.05);
      timer = setInterval(tick, TICK_MS); tick();
    }
    function stopMusic() {
      musicOn = false;
      if (timer) { clearInterval(timer); timer = null; }
      if (ctx) { musicBus.gain.cancelScheduledValues(ctx.currentTime); musicBus.gain.setTargetAtTime(0, ctx.currentTime, 0.05); }
    }
    function syncMusic() {
      const want = !!ctx && enabled && volume > 0 && state === 'run';
      if (want && !timer) startMusic(); else if (!want && timer) stopMusic();
    }

    function setState(s) { state = s; syncMusic(); }
    function setEnabled(v) {
      enabled = !!v; save(); applyGain(); syncMusic(); emit();
      if (enabled) { if (ctx && ctx.state === 'suspended') init(); }
    }
    function toggle() { setEnabled(!enabled); return enabled; }
    function setVolume(v) {
      v = Number(v); if (!isFinite(v)) return;
      volume = Math.min(1, Math.max(0, v)); save(); applyGain(); syncMusic(); emit();
    }
    function suspend() { if (ctx && ctx.state === 'running' && ctx.suspend) ctx.suspend().catch(() => {}); }
    function resume() { if (ctx && ctx.state === 'suspended' && ctx.resume) ctx.resume().catch(() => {}); }
    function dispose() {
      stopMusic(); listeners.length = 0;
      if (ctx && ctx.close) ctx.close().catch(() => {});
      ctx = null; master = sfxBus = musicBus = noiseBuf = null; voices = 0;
    }

    return {
      init, play, setState, setEnabled, toggle, setVolume, suspend, resume, dispose,
      onChange(fn) { listeners.push(fn); },
      get enabled() { return enabled; }, get volume() { return volume; },
      get ready() { return !!ctx; }, get musicPlaying() { return !!timer; },
      get context() { return ctx; }, get voices() { return voices; },
    };
  }
  return { create, STORE_KEY, MAX_VOICES };
});
