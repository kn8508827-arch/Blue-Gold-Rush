/* Cooler Arcade — pure game rules (browser + Node tests). */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.ArcadeLogic = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  // ---------------- 2048 ----------------
  /** Slide one row to the left. Returns { row, gained, moved }. */
  function slideRow(row) {
    const tiles = row.filter(v => v), out = [];
    let gained = 0;
    for (let i = 0; i < tiles.length; i++) {
      if (tiles[i] === tiles[i + 1]) { out.push(tiles[i] * 2); gained += tiles[i] * 2; i++; }
      else out.push(tiles[i]);
    }
    while (out.length < row.length) out.push(0);
    return { row: out, gained, moved: out.some((v, i) => v !== row[i]) };
  }
  const transpose = g => g[0].map((_, c) => g.map(r => r[c]));
  /** dir: "left" | "right" | "up" | "down". Returns { grid, gained, moved }. */
  function move2048(grid, dir) {
    let g = grid.map(r => r.slice());
    if (dir === "up" || dir === "down") g = transpose(g);
    if (dir === "right" || dir === "down") g = g.map(r => r.reverse());
    let gained = 0, moved = false;
    g = g.map(r => { const s = slideRow(r); gained += s.gained; moved = moved || s.moved; return s.row; });
    if (dir === "right" || dir === "down") g = g.map(r => r.reverse());
    if (dir === "up" || dir === "down") g = transpose(g);
    return { grid: g, gained, moved };
  }
  function addTile(grid, rand = Math.random) {
    const empty = [];
    grid.forEach((r, y) => r.forEach((v, x) => { if (!v) empty.push([y, x]); }));
    if (!empty.length) return grid;
    const [y, x] = empty[Math.floor(rand() * empty.length)];
    const g = grid.map(r => r.slice()); g[y][x] = rand() < 0.9 ? 2 : 4; return g;
  }
  function canMove2048(grid) {
    return ["left", "right", "up", "down"].some(d => move2048(grid, d).moved);
  }

  // ---------------- snake ----------------
  const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
  const OPP = { up: "down", down: "up", left: "right", right: "left" };
  function turn(current, next) { return next && OPP[current] !== next ? next : current; }
  /** One step. Returns { snake, ate, dead }. snake[0] is the head. Walls wrap around. */
  function stepSnake(snake, dir, food, size) {
    const [dx, dy] = DIRS[dir];
    const head = [(snake[0][0] + dx + size) % size, (snake[0][1] + dy + size) % size];
    const ate = head[0] === food[0] && head[1] === food[1];
    const body = ate ? snake : snake.slice(0, -1);
    const dead = body.some(([x, y]) => x === head[0] && y === head[1]);
    return { snake: [head, ...body], ate, dead };
  }
  function placeFood(snake, size, rand = Math.random) {
    const taken = new Set(snake.map(([x, y]) => x + "," + y));
    const free = [];
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) if (!taken.has(x + "," + y)) free.push([x, y]);
    return free.length ? free[Math.floor(rand() * free.length)] : null;
  }

  // ---------------- tic-tac-toe ----------------
  const LINES = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
  function winner(b) {
    for (const [a, c, d] of LINES) if (b[a] && b[a] === b[c] && b[a] === b[d]) return { who: b[a], line: [a, c, d] };
    return b.every(Boolean) ? { who: "draw", line: [] } : null;
  }
  function minimax(b, me, turnOf, depth = 0) {
    const w = winner(b);
    if (w) return { score: w.who === "draw" ? 0 : (w.who === me ? 10 - depth : depth - 10) };
    const other = turnOf === "X" ? "O" : "X";
    let best = { score: turnOf === me ? -Infinity : Infinity, move: -1 };
    b.forEach((v, i) => {
      if (v) return;
      b[i] = turnOf; const r = minimax(b, me, other, depth + 1); b[i] = null;
      if (turnOf === me ? r.score > best.score : r.score < best.score) best = { score: r.score, move: i };
    });
    return best;
  }
  /** AI move; level 0..1 = chance of the perfect move (else random). */
  function aiMove(b, me, level = 1, rand = Math.random) {
    const free = b.map((v, i) => (v ? -1 : i)).filter(i => i >= 0);
    if (!free.length) return -1;
    if (rand() > level) return free[Math.floor(rand() * free.length)];
    return minimax(b.slice(), me, me).move;
  }

  // ---------------- memory ----------------
  function deck(symbols, pairs, rand = Math.random) {
    const cards = [];
    symbols.slice(0, pairs).forEach((s, i) => { cards.push({ id: i * 2, sym: s }, { id: i * 2 + 1, sym: s }); });
    for (let i = cards.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [cards[i], cards[j]] = [cards[j], cards[i]]; }
    return cards;
  }
  /** Score from moves and seconds: fewer is better, never below 10. */
  function memoryScore(pairs, moves, seconds) {
    return Math.max(10, pairs * 100 - Math.max(0, moves - pairs) * 8 - Math.floor(seconds) * 2);
  }

  // ---------------- breakout ----------------
  function bricks(level, cols = 8) {
    const rows = Math.min(7, 3 + level), out = [];
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      if ((level % 2 === 0) && (r + c) % 5 === 0) continue; // patterns on even levels
      out.push({ r, c, hp: r < Math.floor(level / 2) ? 2 : 1 });
    }
    return out;
  }
  /** Bounce angle from where the ball hits the paddle (-1 left edge … 1 right edge). */
  function paddleBounce(hit, speed) {
    const a = Math.max(-1, Math.min(1, hit)) * (Math.PI / 3);
    return { vx: Math.sin(a) * speed, vy: -Math.cos(a) * speed };
  }

  return { slideRow, move2048, addTile, canMove2048, DIRS, turn, stepSnake, placeFood, LINES, winner, aiMove, deck, memoryScore, bricks, paddleBounce };
});
