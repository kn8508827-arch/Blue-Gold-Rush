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

  // ---------------- minesweeper ----------------
  /** Board of {mine, n, open, flag}; the first clicked cell and its neighbours are always safe. */
  function mineBoard(w, h, mines, safeX, safeY, rand = Math.random) {
    const cells = Array.from({ length: h }, () => Array.from({ length: w }, () => ({ mine: false, n: 0, open: false, flag: false })));
    const spots = [];
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (Math.abs(x - safeX) > 1 || Math.abs(y - safeY) > 1) spots.push([x, y]);
    for (let i = spots.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [spots[i], spots[j]] = [spots[j], spots[i]]; }
    spots.slice(0, Math.min(mines, spots.length)).forEach(([x, y]) => { cells[y][x].mine = true; });
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) cells[y][x].n = around(w, h, x, y).filter(([a, b]) => cells[b][a].mine).length;
    return cells;
  }
  function around(w, h, x, y) {
    const out = [];
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const a = x + dx, b = y + dy; if ((dx || dy) && a >= 0 && b >= 0 && a < w && b < h) out.push([a, b]); }
    return out;
  }
  /** Open a cell (flood-fills zeros). Returns { boom, opened }. */
  function reveal(cells, x, y) {
    const h = cells.length, w = cells[0].length, c = cells[y][x];
    if (c.open || c.flag) return { boom: false, opened: 0 };
    if (c.mine) { c.open = true; return { boom: true, opened: 1 }; }
    let opened = 0; const stack = [[x, y]];
    while (stack.length) {
      const [a, b] = stack.pop(), cell = cells[b][a];
      if (cell.open || cell.flag || cell.mine) continue;
      cell.open = true; opened++;
      if (cell.n === 0) stack.push(...around(w, h, a, b));
    }
    return { boom: false, opened };
  }
  const mineWon = cells => cells.every(r => r.every(c => c.mine || c.open));

  // ---------------- connect four ----------------
  const C4W = 7, C4H = 6;
  function c4Drop(board, col, who) { // board[row][col], row 0 = top
    for (let r = C4H - 1; r >= 0; r--) if (!board[r][col]) { board[r][col] = who; return r; }
    return -1;
  }
  function c4Winner(board) {
    const dirs = [[0, 1], [1, 0], [1, 1], [1, -1]];
    for (let r = 0; r < C4H; r++) for (let c = 0; c < C4W; c++) {
      const v = board[r][c]; if (!v) continue;
      for (const [dr, dc] of dirs) {
        const cells = [[r, c]];
        for (let k = 1; k < 4; k++) { const rr = r + dr * k, cc = c + dc * k; if (rr < 0 || rr >= C4H || cc < 0 || cc >= C4W || board[rr][cc] !== v) break; cells.push([rr, cc]); }
        if (cells.length === 4) return { who: v, cells };
      }
    }
    return board[0].every(Boolean) ? { who: "draw", cells: [] } : null;
  }
  function c4Score(board, me) {
    const opp = me === "R" ? "Y" : "R"; let s = 0;
    for (let r = 0; r < C4H; r++) if (board[r][3] === me) s += 3;
    const win = (cells) => { const m = cells.filter(v => v === me).length, o = cells.filter(v => v === opp).length;
      if (m && o) return 0; if (m === 4) return 1000; if (m === 3) return 5; if (m === 2) return 2; if (o === 3) return -4; return 0; };
    for (let r = 0; r < C4H; r++) for (let c = 0; c < C4W; c++) for (const [dr, dc] of [[0, 1], [1, 0], [1, 1], [1, -1]]) {
      const cells = []; for (let k = 0; k < 4; k++) { const rr = r + dr * k, cc = c + dc * k; if (rr < 0 || rr >= C4H || cc < 0 || cc >= C4W) break; cells.push(board[rr][cc]); }
      if (cells.length === 4) s += win(cells);
    }
    return s;
  }
  function c4Minimax(board, depth, alpha, beta, maxing, me) {
    const w = c4Winner(board), opp = me === "R" ? "Y" : "R";
    if (w) return w.who === "draw" ? 0 : (w.who === me ? 100000 + depth : -100000 - depth);
    if (depth === 0) return c4Score(board, me);
    const order = [3, 2, 4, 1, 5, 0, 6].filter(c => !board[0][c]);
    let best = maxing ? -Infinity : Infinity;
    for (const c of order) {
      const r = c4Drop(board, c, maxing ? me : opp);
      const v = c4Minimax(board, depth - 1, alpha, beta, !maxing, me); board[r][c] = null;
      if (maxing) { best = Math.max(best, v); alpha = Math.max(alpha, v); } else { best = Math.min(best, v); beta = Math.min(beta, v); }
      if (alpha >= beta) break;
    }
    return best;
  }
  function c4Ai(board, me, depth = 4, rand = Math.random) {
    const cols = [3, 2, 4, 1, 5, 0, 6].filter(c => !board[0][c]);
    if (!cols.length) return -1;
    if (depth <= 0) return cols[Math.floor(rand() * cols.length)];
    let best = -Infinity, pick = cols[0];
    for (const c of cols) {
      const b = board.map(r => r.slice()); c4Drop(b, c, me);
      const v = c4Minimax(b, depth - 1, -Infinity, Infinity, false, me);
      if (v > best) { best = v; pick = c; }
    }
    return pick;
  }

  // ---------------- ball sort ----------------
  /** colors × 4 balls shuffled into `colors` tubes plus 2 empty tubes. */
  function sortLevel(colors, rand = Math.random) {
    const balls = []; for (let c = 0; c < colors; c++) for (let k = 0; k < 4; k++) balls.push(c);
    for (let i = balls.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [balls[i], balls[j]] = [balls[j], balls[i]]; }
    const tubes = []; for (let t = 0; t < colors; t++) tubes.push(balls.slice(t * 4, t * 4 + 4));
    if (tubes.every(t => t.every(v => v === t[0]))) return sortLevel(colors, rand);
    return tubes.concat([[], []]);
  }
  function canPour(tubes, from, to) {
    const a = tubes[from], b = tubes[to];
    return from !== to && a.length > 0 && b.length < 4 && (b.length === 0 || b[b.length - 1] === a[a.length - 1]);
  }
  /** Moves every same-coloured top ball that fits. Returns the number moved. */
  function pour(tubes, from, to) {
    let n = 0;
    while (canPour(tubes, from, to)) { tubes[to].push(tubes[from].pop()); n++; }
    return n;
  }
  const sorted = tubes => tubes.every(t => t.length === 0 || (t.length === 4 && t.every(v => v === t[0])));

  // ---------------- simon ----------------
  const simonNext = (seq, rand = Math.random) => seq.concat(Math.floor(rand() * 4));
  /** Check the player's input so far: "ok" (keep going), "done" (round complete) or "wrong". */
  function simonCheck(seq, input) {
    for (let i = 0; i < input.length; i++) if (input[i] !== seq[i]) return "wrong";
    return input.length === seq.length ? "done" : "ok";
  }

  // ---------------- sliding 15 ----------------
  const solvedTiles = n => Array.from({ length: n * n }, (_, i) => (i + 1) % (n * n));
  /** Shuffle by random legal moves from the solved state, so it is always solvable. */
  function slideShuffle(n, steps = 200, rand = Math.random) {
    let t = solvedTiles(n), prev = -1;
    for (let i = 0; i < steps; i++) {
      const z = t.indexOf(0), opts = slideNeighbours(n, z).filter(p => p !== prev);
      const p = opts[Math.floor(rand() * opts.length)]; t = slideMove(t, n, p); prev = z;
    }
    return isSolved(t) ? slideShuffle(n, steps, rand) : t;
  }
  function slideNeighbours(n, z) {
    const r = Math.floor(z / n), c = z % n, out = [];
    if (r > 0) out.push(z - n); if (r < n - 1) out.push(z + n); if (c > 0) out.push(z - 1); if (c < n - 1) out.push(z + 1);
    return out;
  }
  /** Move tile at index i into the gap if adjacent; returns a new array (unchanged if not adjacent). */
  function slideMove(t, n, i) {
    const z = t.indexOf(0); if (!slideNeighbours(n, z).includes(i)) return t;
    const out = t.slice(); [out[z], out[i]] = [out[i], out[z]]; return out;
  }
  const isSolved = t => t.every((v, i) => v === (i + 1) % t.length);

  // ---------------- tap rush ----------------
  function target(w, h, r, rand = Math.random) {
    return { x: r + rand() * (w - 2 * r), y: r + rand() * (h - 2 * r), r };
  }
  const hitTarget = (t, x, y) => (x - t.x) ** 2 + (y - t.y) ** 2 <= t.r * t.r;

  return { mineBoard, around, reveal, mineWon, C4W, C4H, c4Drop, c4Winner, c4Ai, sortLevel, canPour, pour, sorted,
           simonNext, simonCheck, solvedTiles, slideShuffle, slideMove, slideNeighbours, isSolved, target, hitTarget,
           slideRow, move2048, addTile, canMove2048, DIRS, turn, stepSnake, placeFood, LINES, winner, aiMove, deck, memoryScore, bricks, paddleBounce };
});
