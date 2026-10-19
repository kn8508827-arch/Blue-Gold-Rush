const test = require('node:test');
const assert = require('node:assert');
const { create, STORE_KEY, MAX_VOICES } = require('../audio.js');

function param() { return { value: 0, setValueAtTime() {}, exponentialRampToValueAtTime() {}, setTargetAtTime(v) { this.value = v; }, cancelScheduledValues() {} }; }
function node() { return { gain: param(), frequency: param(), connect() {}, disconnect() {}, start() {}, stop() {}, type: '' }; }
function makeCtx(initial) {
  const c = {
    state: initial || 'running', currentTime: 0, sampleRate: 8000, destination: {}, created: 0,
    createGain: () => { c.created++; return node(); }, createOscillator: () => { c.created++; return node(); },
    createBufferSource: () => { c.created++; return node(); }, createBiquadFilter: () => { c.created++; return node(); },
    createDynamicsCompressor: node, createBuffer: (n, l) => ({ getChannelData: () => new Float32Array(l) }),
    resume() { c.state = 'running'; return Promise.resolve(); }, suspend() { c.state = 'suspended'; return Promise.resolve(); },
    close() { c.state = 'closed'; return Promise.resolve(); },
  };
  return c;
}
function mk(extra) {
  const store = {}; let ctx;
  const storage = { getItem: k => store[k] || null, setItem: (k, v) => { store[k] = v; } };
  function Ctor() { ctx = makeCtx(extra && extra.initial); return ctx; }
  const a = create(Object.assign({ AudioContext: Ctor, storage, window: {} }, {}));
  return { a, store, ctx: () => ctx };
}
const advance = (m, dt) => { m.ctx().currentTime += dt; };

test('no context until init; play is a no-op before init', () => {
  const m = mk(); assert.equal(m.a.ready, false); assert.equal(m.a.play('jump'), false);
  assert.equal(m.a.init(), true); assert.equal(m.a.ready, true);
  m.a.dispose();
});
test('init resumes a suspended context', () => {
  const m = mk({ initial: 'suspended' }); m.a.init(); assert.equal(m.ctx().state, 'running'); m.a.dispose();
});
test('unsupported browsers fail gracefully', () => {
  const a = create({ AudioContext: null, storage: null, window: {} }); assert.equal(a.init(), false); assert.equal(a.play('jump'), false);
});
test('mute / volume persist and are clamped', () => {
  const m = mk(); m.a.init(); m.a.setVolume(2); assert.equal(m.a.volume, 1); m.a.setVolume(0.25); m.a.toggle();
  assert.deepEqual(JSON.parse(m.store[STORE_KEY]), { enabled: false, volume: 0.25 });
  const m2 = create({ AudioContext: function () {}, storage: { getItem: () => m.store[STORE_KEY], setItem() {} }, window: {} });
  assert.equal(m2.enabled, false); assert.equal(m2.volume, 0.25); m.a.dispose();
});
test('muted or zero volume plays nothing', () => {
  const m = mk(); m.a.init(); m.a.setEnabled(false); assert.equal(m.a.play('jump'), false);
  m.a.setEnabled(true); m.a.setVolume(0); assert.equal(m.a.play('jump'), false);
  m.a.setVolume(0.5); assert.equal(m.a.play('jump'), true); m.a.dispose();
});
test('duplicate triggers within the gap are dropped', () => {
  const m = mk(); m.a.init(); assert.equal(m.a.play('jump'), true); assert.equal(m.a.play('jump'), false);
  advance(m, 0.2); assert.equal(m.a.play('jump'), true); m.a.dispose();
});
test('music only while running; stops on pause/over, resumes on run', () => {
  const m = mk(); m.a.init(); assert.equal(m.a.musicPlaying, false);
  m.a.setState('run'); assert.equal(m.a.musicPlaying, true);
  m.a.setState('pause'); assert.equal(m.a.musicPlaying, false);
  m.a.setState('run'); assert.equal(m.a.musicPlaying, true);
  m.a.setState('over'); assert.equal(m.a.musicPlaying, false);
  m.a.setState('run'); m.a.setEnabled(false); assert.equal(m.a.musicPlaying, false);
  m.a.setEnabled(true); assert.equal(m.a.musicPlaying, true); m.a.dispose();
});
test('no gameplay effects after the game has ended or while paused', () => {
  const m = mk(); m.a.init(); m.a.setState('over');
  for (const n of ['jump', 'slide', 'lane', 'coinBlue', 'coinGold']) assert.equal(m.a.play(n), false, n);
  assert.equal(m.a.play('gameover'), true); assert.equal(m.a.play('click'), true);
  m.a.setState('pause'); assert.equal(m.a.play('jump'), false); advance(m, 1); assert.equal(m.a.play('click'), true);
  m.a.dispose();
});
test('every gameplay effect triggers when running', () => {
  const m = mk(); m.a.init(); m.a.setState('run');
  for (const n of ['click', 'start', 'jump', 'slide', 'lane', 'coinBlue', 'coinGold', 'crash', 'gameover']) { assert.equal(m.a.play(n), true, n); advance(m, 1); }
  m.a.dispose();
});
test('simultaneous voices are capped', () => {
  const m = mk(); m.a.init(); m.a.setState('run');
  for (let i = 0; i < 40; i++) { m.a.play('crash'); advance(m, 1); }
  assert.ok(m.a.voices <= MAX_VOICES);
  m.a.dispose();
});
test('dispose closes the context and stops music', () => {
  const m = mk(); m.a.init(); m.a.setState('run'); const c = m.ctx(); m.a.dispose();
  assert.equal(c.state, 'closed'); assert.equal(m.a.musicPlaying, false); assert.equal(m.a.ready, false);
});
