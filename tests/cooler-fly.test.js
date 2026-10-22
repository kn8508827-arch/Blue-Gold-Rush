const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const L = require("../cooler-fly/logic.js");

test("ranks and stages follow the score", () => {
  assert.equal(L.rankFor(0).en, "Rookie");
  assert.equal(L.rankFor(10).en, "Rapper");
  assert.equal(L.rankFor(99).en, "Legend");
  assert.equal(L.rankFor(100).en, "Cooler King");
  assert.equal(L.stageFor(0).number, 1);
  assert.equal(L.stageFor(10).key, "angkor");
  assert.equal(L.stageFor(500).number, L.STAGES.length);
  for (let i = 1; i < L.STAGES.length; i++) assert.ok(L.STAGES[i].min > L.STAGES[i - 1].min);
});

test("difficulty ramps up and stays playable", () => {
  const easy = L.difficulty(0), hard = L.difficulty(1000);
  assert.ok(hard.speed > easy.speed && hard.gap < easy.gap);
  assert.ok(hard.gap >= 150 && hard.speed <= 330 && hard.spacing >= 235);
  assert.ok(hard.gap > L.PLAYER_R * 4, "gap always fits the player");
});

test("physics: flap goes up, gravity pulls down, fall speed is capped", () => {
  const p = { x: 140, y: 300, vy: 0 };
  L.flap(p); L.stepPlayer(p, 0.016); assert.ok(p.y < 300);
  for (let i = 0; i < 200; i++) L.stepPlayer(p, 0.016);
  assert.equal(p.vy, L.MAX_FALL);
});

test("collision with pillars, ground and sky", () => {
  const ground = L.WORLD_H - 70;
  const pillar = { x: 120, gapY: 200, gap: 200 };
  assert.equal(L.collides({ x: 140, y: 300 }, pillar, ground), false, "middle of the gap is safe");
  assert.equal(L.collides({ x: 140, y: 150 }, pillar, ground), true, "top pillar");
  assert.equal(L.collides({ x: 140, y: 450 }, pillar, ground), true, "bottom pillar");
  assert.equal(L.collides({ x: 20, y: 150 }, pillar, ground), false, "before the pillar");
  assert.equal(L.collides({ x: 140, y: ground }, { x: 900, gapY: 0, gap: 600 }, ground), true, "ground");
  for (let i = 0; i < 200; i++) {
    const gy = L.newGapY(Math.random, 180, ground);
    assert.ok(gy >= 70 && gy + 180 <= ground - 60);
  }
});

test("page ships its assets and loads three.js with a fallback", () => {
  const dir = path.join(__dirname, "..", "cooler-fly");
  const html = fs.readFileSync(path.join(dir, "index.html"), "utf8");
  for (const f of ["logic.js", "cooler.png", "coin.png"]) assert.ok(fs.existsSync(path.join(dir, f)), f);
  assert.match(html, /three@0\.160\.0\/build\/three\.min\.js/);
  assert.match(html, /unpkg\.com\/three@0\.160\.0/);
  assert.match(html, /telegram-web-app\.js/);
  assert.match(html, /<script src="logic\.js"><\/script>/);
});
