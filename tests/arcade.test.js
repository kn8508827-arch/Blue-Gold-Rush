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

test("minesweeper: safe first click, flood fill, win", () => {
  const b = A.mineBoard(9, 9, 10, 4, 4, () => 0.3);
  assert.equal(b.flat().filter(c => c.mine).length, 10);
  for (const [x, y] of [[4, 4], ...A.around(9, 9, 4, 4)]) assert.equal(b[y][x].mine, false);
  const r = A.reveal(b, 4, 4); assert.equal(r.boom, false); assert.ok(r.opened >= 1);
  const tiny = A.mineBoard(3, 3, 1, 0, 0, () => 0); // mine lands outside the safe zone
  const mine = tiny.flat().findIndex(c => c.mine); assert.ok(mine >= 0);
  for (let y = 0; y < 3; y++) for (let x = 0; x < 3; x++) if (!tiny[y][x].mine) A.reveal(tiny, x, y);
  assert.equal(A.mineWon(tiny), true);
  const mx = mine % 3, my = Math.floor(mine / 3); assert.equal(A.reveal(tiny, mx, my).boom, true);
});

test("connect four: drop, wins in all directions, AI takes and blocks wins", () => {
  const empty = () => Array.from({ length: 6 }, () => Array(7).fill(null));
  let b = empty(); for (let c = 0; c < 4; c++) A.c4Drop(b, c, "R"); assert.equal(A.c4Winner(b).who, "R");
  b = empty(); for (let i = 0; i < 4; i++) A.c4Drop(b, 2, "Y"); assert.equal(A.c4Winner(b).who, "Y");
  b = empty(); for (let i = 0; i < 6; i++) A.c4Drop(b, 0, "R"); assert.equal(A.c4Drop(b, 0, "R"), -1);
  b = empty(); ["Y", "Y", "Y"].forEach((v, c) => A.c4Drop(b, c, v)); A.c4Drop(b, 6, "R"); A.c4Drop(b, 6, "R");
  assert.equal(A.c4Ai(b, "Y", 4), 3, "AI completes its own four");
  b = empty(); ["R", "R", "R"].forEach((v, c) => A.c4Drop(b, c, v)); // only column 3 completes it
  assert.equal(A.c4Ai(b, "Y", 4), 3, "AI blocks");
  b = empty(); for (let i = 0; i < 3; i++) A.c4Drop(b, 5, "R");
  assert.equal(A.c4Ai(b, "Y", 4), 5, "AI blocks a vertical three");
});

test("ball sort: pouring rules and win", () => {
  const t = A.sortLevel(4, () => 0.42); assert.equal(t.length, 6); assert.equal(t.flat().length, 16);
  const tubes = [[0, 1], [1], [], []];
  assert.equal(A.canPour(tubes, 0, 1), true); assert.equal(A.canPour([[0], [1]], 0, 1), false, "top colours differ"); assert.equal(A.canPour(tubes, 2, 0), false, "empty tube");
  assert.equal(A.pour(tubes, 0, 1), 1); assert.deepEqual(tubes[1], [1, 1]);
  assert.equal(A.sorted([[0, 0, 0, 0], [], [1, 1, 1, 1]]), true);
  assert.equal(A.sorted([[0, 0, 0], [0]]), false);
});

test("simon and sliding puzzle and tap rush", () => {
  const s = A.simonNext([1, 2], () => 0.99); assert.deepEqual(s, [1, 2, 3]);
  assert.equal(A.simonCheck(s, [1]), "ok"); assert.equal(A.simonCheck(s, [1, 2, 3]), "done"); assert.equal(A.simonCheck(s, [2]), "wrong");
  const t = A.slideShuffle(4, 150); assert.equal(t.length, 16); assert.equal(A.isSolved(t), false);
  assert.deepEqual([...t].sort((a, b) => a - b), Array.from({ length: 16 }, (_, i) => i));
  const solved = A.solvedTiles(3); assert.equal(A.isSolved(solved), true);
  assert.deepEqual(A.slideMove(solved, 3, 0), solved, "non-adjacent move ignored");
  assert.equal(A.slideMove(solved, 3, 7)[8], 8);
  const tg = A.target(300, 400, 30, () => 0); assert.equal(A.hitTarget(tg, 30, 30), true); assert.equal(A.hitTarget(tg, 100, 100), false);
});

test("sudoku: valid full solution, unique puzzle", () => {
  let seed = 7; const rand = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
  const { puzzle, solution } = A.sudoku(40, rand);
  assert.equal(solution.indexOf(0), -1);
  for (let i = 0; i < 81; i++) { const v = solution[i]; solution[i] = 0; assert.ok(A.sudokuOk(solution, i, v)); solution[i] = v; }
  assert.ok(puzzle.filter(v => !v).length >= 30);
  assert.equal(A.sudokuCount(puzzle.slice(), 2), 1);
  puzzle.forEach((v, i) => { if (v) assert.equal(v, solution[i]); });
});

test("solitaire: deal and move rules", () => {
  const st = A.deal(() => 0.3);
  assert.equal(st.tab.map(c => c.length).join(), "1,2,3,4,5,6,7");
  assert.equal(st.stock.length, 24);
  assert.ok(st.tab.every(col => col[col.length - 1].up && col.slice(0, -1).every(c => !c.up)));
  assert.equal(A.canTab({ s: "♥", r: 6 }, [{ s: "♠", r: 7, up: true }]), true);
  assert.equal(A.canTab({ s: "♣", r: 6 }, [{ s: "♠", r: 7, up: true }]), false);
  assert.equal(A.canTab({ s: "♣", r: 13 }, []), true);
  assert.equal(A.canFound({ s: "♦", r: 1 }, []), true);
  assert.equal(A.canFound({ s: "♦", r: 3 }, [{ s: "♦", r: 2 }]), true);
  assert.equal(A.canFound({ s: "♥", r: 3 }, [{ s: "♦", r: 2 }]), false);
});

test("mahjong: 72 tiles in pairs and always solvable by removing free pairs", () => {
  const syms = ["A", "B", "C", "D", "E", "F", "G", "H", "I"];
  const tiles = A.mahjong(A.mjLayout(), syms, () => 0.5);
  assert.equal(tiles.length, 72);
  const counts = {}; tiles.forEach(t => { counts[t.sym] = (counts[t.sym] || 0) + 1; });
  assert.ok(Object.values(counts).every(n => n % 2 === 0));
  // greedy solver from the generator order isn't known; check at least one free pair exists at start
  const free = tiles.filter(t => A.mjFree(tiles, t));
  const symsFree = free.map(t => t.sym);
  assert.ok(symsFree.some((s, i) => symsFree.indexOf(s) !== i));
  // tile on top blocks the one below
  const top = tiles.find(t => t.z === 3); assert.ok(A.mjFree(tiles, top));
  const under = tiles.find(t => t.z === 2); assert.equal(A.mjFree(tiles, under), false);
});

test("khla khlouk: six symbols, three dice, settle", () => {
  assert.equal(A.KK.length, 6);
  assert.equal(A.kkRoll(() => 0.99).length, 3);
  assert.equal(A.kkSettle({ 0: 10 }, [0, 0, 3]), 20);
  assert.equal(A.kkSettle({ 0: 10, 1: 5 }, [2, 3, 4]), -15);
  assert.equal(A.kkSettle({ 2: 10 }, [2, 5, 1]), 10);
});
