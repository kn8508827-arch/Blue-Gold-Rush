const test = require('node:test');
const assert = require('node:assert/strict');
const P = require('../powerups.js');

test('ranks go above Mythic and are ordered', () => {
  const levels = P.RANKS.map(r => r.level);
  assert.deepEqual(levels, [...levels].sort((a, b) => a - b));
  assert.equal(P.rankForLevel(1).title, 'Rookie');
  assert.equal(P.rankForLevel(25).title, 'Mythic');
  assert.equal(P.rankForLevel(34).title, 'Mythic');
  assert.equal(P.rankForLevel(35).title, 'Sky Rider');
  assert.equal(P.rankForLevel(50).title, 'Blue Titan');
  assert.equal(P.rankForLevel(70).title, 'Gold Emperor');
  assert.equal(P.rankForLevel(100).title, 'Smos Snea Immortal');
  assert.equal(P.rankForLevel(999).title, 'Smos Snea Immortal');
  assert.equal(P.nextRank(25).title, 'Sky Rider');
  assert.equal(P.nextRank(100), null);
});

test('Sky Bike flies between 15 and 20 m while cruising and lands at 0', () => {
  const d = P.skyBikeDuration(1);
  let min = Infinity, max = -Infinity, prev = 0, maxStep = 0;
  for (let t = 0; t <= d; t += 0.005) {
    const a = P.skyBikeAltitude(t, d);
    assert.ok(a >= 0 && a <= P.SKY_BIKE.maxAltitude + 1e-9, 'altitude in range at ' + t);
    if (t > P.SKY_BIKE.riseTime && t < d - P.SKY_BIKE.landTime) { min = Math.min(min, a); max = Math.max(max, a); }
    maxStep = Math.max(maxStep, Math.abs(a - prev)); prev = a;
  }
  assert.ok(min >= 15 - 1e-9 && max <= 20 + 1e-9, `cruise ${min}..${max}`);
  assert.ok(max - min > 4, 'actually waves between 15 and 20 m');
  assert.ok(maxStep < 0.2, 'smooth: no teleporting between frames');
  assert.equal(P.skyBikeAltitude(0, d), 0);
  assert.equal(P.skyBikeAltitude(d, d), 0);
  assert.equal(P.skyBikeAltitude(-1, d), 0);
  assert.equal(P.skyBikeAltitude(1, 0), 0);
});

test('higher rank rides longer, capped', () => {
  assert.equal(P.skyBikeDuration(1), 8);
  assert.ok(P.skyBikeDuration(35) > P.skyBikeDuration(25));
  assert.ok(P.skyBikeDuration(100) <= P.SKY_BIKE.maxDuration);
});

test('obstacle immunity only high in the air', () => {
  assert.equal(P.isAboveObstacles(0), false);
  assert.equal(P.isAboveObstacles(1.5), false);
  assert.equal(P.isAboveObstacles(15), true);
});

test('Sky Bike spawns rarely and respects the cooldown', () => {
  assert.equal(P.shouldSpawnSkyBike(1, 0, 0), false);
  assert.equal(P.shouldSpawnSkyBike(1, P.SKY_BIKE.cooldown, 0), true);
  assert.equal(P.shouldSpawnSkyBike(1, P.SKY_BIKE.cooldown, 0.99), false);
});
