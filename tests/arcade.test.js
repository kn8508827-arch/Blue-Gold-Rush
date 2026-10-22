const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const A = require("../arcade/logic.js");

test("2048: merges once per move, scores, detects stuck boards", () => {
  assert.deepEqual(A.slideRow([2, 2, 2, 2]), { row: [4, 4, 0, 0], gained: 8, moved: true });
  assert.deepEqual(A.slideRow([0, 2, 0, 2]).row, [4, 0, 0, 0]);
  assert.equal(A.slideRow([2, 4, 8, 16]).moved, false);
  const g = [[2, 0, 0, 2], [0, 0, 0, 0], [4, 0, 0, 4], [0, 0, 0, 0]];
  assert.deepEqual(A.move2048(g, "right").grid[0], [0, 0, 0, 4]);
  assert.deepEqual(A.move2048(g, "down").grid.map(r => r[0]), [0, 0, 2, 4]);
  assert.equal(A.move2048(g, "left").gained, 12);
  assert.equal(A.canMove2048([[2, 4], [4, 2]]), false);
  const filled = A.addTile([[0, 2], [2, 2]], () => 0);
  assert.equal(filled[0][0], 2);
});

test("snake: moves, grows, wraps, dies on itself, never turns back", () => {
  const s = [[2, 2], [1, 2], [0, 2]];
  let r = A.stepSnake(s, "right", [9, 9], 10);
  assert.deepEqual(r.snake, [[3, 2], [2, 2], [1, 2]]); assert.equal(r.ate, false);
  r = A.stepSnake(s, "right", [3, 2], 10); assert.equal(r.ate, true); assert.equal(r.snake.length, 4);
  assert.deepEqual(A.stepSnake([[9, 0], [8, 0]], "right", [5, 5], 10).snake[0], [0, 0]);
  assert.equal(A.stepSnake([[1, 1], [1, 2], [2, 2], [2, 1], [2, 0]], "right", [9, 9], 10).dead, true);
  assert.equal(A.turn("right", "left"), "right"); assert.equal(A.turn("right", "up"), "up");
  const food = A.placeFood([[0, 0], [1, 0]], 2, () => 0); assert.deepEqual(food, [0, 1]);
});

test("tic-tac-toe: winner detection and a perfect AI never loses", () => {
  assert.equal(A.winner(["X", "X", "X", null, "O", "O", null, null, null]).who, "X");
  assert.equal(A.winner(["X", "O", "X", "X", "O", "O", "O", "X", "X"]).who, "draw");
  assert.equal(A.aiMove(["X", "X", null, "O", null, null, null, null, null], "O", 1), 2, "blocks");
  assert.equal(A.aiMove(["O", "O", null, "X", "X", null, null, null, null], "O", 1), 2, "wins");
  // random human vs perfect AI: AI (O) never loses
  for (let game = 0; game < 60; game++) {
    const b = Array(9).fill(null); let t = "X", seed = game + 1;
    const rand = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
    while (!A.winner(b)) {
      const i = t === "O" ? A.aiMove(b, "O", 1) : A.aiMove(b, "X", 0, rand);
      b[i] = t; t = t === "X" ? "O" : "X";
    }
    assert.notEqual(A.winner(b).who, "X");
  }
});

test("memory deck, score and breakout helpers", () => {
  const d = A.deck(["a", "b", "c"], 3, () => 0.5);
  assert.equal(d.length, 6);
  assert.deepEqual([...new Set(d.map(c => c.sym))].sort(), ["a", "b", "c"]);
  assert.equal(new Set(d.map(c => c.id)).size, 6);
  assert.ok(A.memoryScore(6, 6, 10) > A.memoryScore(6, 20, 60));
  assert.equal(A.memoryScore(2, 999, 999), 10);
  assert.ok(A.bricks(1).length > 0 && A.bricks(4).length > A.bricks(1).length * 0.9);
  const b = A.paddleBounce(0, 10); assert.ok(Math.abs(b.vx) < 1e-9 && b.vy === -10);
  assert.ok(A.paddleBounce(1, 10).vx > 8);
});

test("arcade page ships its files", () => {
  const dir = path.join(__dirname, "..", "arcade");
  for (const f of ["index.html", "logic.js", "arcade.js"]) assert.ok(fs.existsSync(path.join(dir, f)), f);
  const html = fs.readFileSync(path.join(dir, "index.html"), "utf8");
  assert.match(html, /<script src="logic\.js"><\/script>/);
  assert.match(html, /<script src="arcade\.js"><\/script>/);
});
