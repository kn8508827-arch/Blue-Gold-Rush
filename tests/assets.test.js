const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');

test('player GLB is a small binary glTF 2.0 with a skin and an animation', () => {
  const buf = fs.readFileSync(path.join(root, 'assets', 'CesiumMan.glb'));
  assert.strictEqual(buf.toString('ascii', 0, 4), 'glTF');
  assert.strictEqual(buf.readUInt32LE(4), 2);
  assert.ok(buf.length < 1024 * 1024, 'model should stay under 1 MB for mobile');
  const jsonLen = buf.readUInt32LE(12);
  const json = JSON.parse(buf.toString('utf8', 20, 20 + jsonLen));
  assert.ok(json.skins && json.skins[0].joints.length <= 64, 'skinned, limited bone count');
  assert.ok(json.animations && json.animations.length >= 1);
  for (const img of json.images || []) assert.ok(img.bufferView !== undefined);
});

test('emblem PNG is at most 512px', () => {
  const buf = fs.readFileSync(path.join(root, 'assets', 'team-emblem.png'));
  assert.strictEqual(buf.toString('ascii', 1, 4), 'PNG');
  assert.ok(buf.readUInt32BE(16) <= 512 && buf.readUInt32BE(20) <= 512);
});

test('licenses file credits the model and index.html loads the runner module', () => {
  const lic = fs.readFileSync(path.join(root, 'ASSETS_LICENSES.md'), 'utf8');
  assert.match(lic, /CC BY 4\.0/);
  assert.match(lic, /Cesium/);
  assert.match(fs.readFileSync(path.join(root, 'index.html'), 'utf8'), /human-runner\.js/);
});

test('GLB contains every bone that human-runner.js looks up', () => {
  const buf = fs.readFileSync(path.join(root, 'assets', 'CesiumMan.glb'));
  const json = JSON.parse(buf.toString('utf8', 20, 20 + buf.readUInt32LE(12)));
  const names = new Set(json.nodes.map((n) => n.name));
  const src = fs.readFileSync(path.join(root, 'human-runner.js'), 'utf8');
  const wanted = [...src.matchAll(/\bbones\.([A-Za-z_]*joint_[A-Za-z0-9_]+)/g)].map((m) => m[1]);
  assert.ok(wanted.length >= 13);
  for (const n of wanted) assert.ok(names.has(n), 'missing bone ' + n);
});
