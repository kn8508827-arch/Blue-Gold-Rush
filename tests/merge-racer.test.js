const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const M = require("../merge-racer/logic.js");

test("merging, moving and swapping cars", () => {
  const s = [1, 1, null, 2, 3];
  assert.deepEqual(M.drop(s, 0, 1), { kind: "merge", level: 2 }); assert.deepEqual(s, [null, 2, null, 2, 3]);
  assert.equal(M.drop(s, 1, 3).kind, "merge"); assert.equal(s[3], 3); assert.equal(s[1], null);
  assert.equal(M.drop(s, 3, 2).kind, "move"); assert.deepEqual(s, [null, null, 3, null, 3]);
  const t = [2, 5]; assert.equal(M.drop(t, 0, 1).kind, "swap"); assert.deepEqual(t, [5, 2]);
  assert.equal(M.drop([null, 1], 0, 1).kind, "none");
  const top = [30, 30]; assert.equal(M.drop(top, 0, 1).kind, "swap", "max level cannot merge further");
  assert.equal(M.freeSlot([1, null, 2]), 1); assert.equal(M.freeSlot([1, 2]), -1);
});

test("economy grows and stays sane", () => {
  for (let l = 1; l < 30; l++) assert.ok(M.lapIncome(l + 1) > M.lapIncome(l));
  assert.ok(M.lapTime(30) >= 2.2 && M.lapTime(1) > M.lapTime(20));
  assert.ok(M.carCost(1, 1) > M.carCost(1, 0) && M.carCost(2) > M.carCost(1));
  assert.equal(M.shopLevel(1), 1); assert.equal(M.shopLevel(10), 6);
  assert.ok(Math.abs(M.incomeRate([1, 1], 2) - 2 * 2 * M.lapIncome(1) / M.lapTime(1)) < 1e-9);
  assert.equal(M.offline(10, 99999), Math.floor(10 * M.OFFLINE_CAP * 0.5));
  assert.equal(M.offline(10, -5), 0);
  assert.equal(M.NAMES.length, M.MAX_LEVEL);
});

test("number formatting", () => {
  assert.equal(M.fmt(999), "999"); assert.equal(M.fmt(1500), "1.50K"); assert.equal(M.fmt(25000), "25.0K");
  assert.equal(M.fmt(3200000), "3.20M"); assert.equal(M.fmt(7.5e9), "7.50B");
});

test("page ships its files", () => {
  const dir = path.join(__dirname, "..", "merge-racer");
  for (const f of ["index.html", "logic.js", "game.js"]) assert.ok(fs.existsSync(path.join(dir, f)), f);
});
