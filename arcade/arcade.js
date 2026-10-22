"use strict";
/* Cooler Arcade — six quick games in one page. Rules live in logic.js (tested). */
(() => {
const A = window.ArcadeLogic;
const $ = id => document.getElementById(id);
const tg = window.Telegram && window.Telegram.WebApp;
try { tg && tg.ready(); tg && tg.expand(); tg && tg.disableVerticalSwipes && tg.disableVerticalSwipes(); } catch (_) {}
const store = {
  get(k, d) { try { const v = localStorage.getItem("arcade:" + k); return v == null ? d : JSON.parse(v); } catch (_) { return d; } },
  set(k, v) { try { localStorage.setItem("arcade:" + k, JSON.stringify(v)); } catch (_) {} },
};
const haptic = k => { try { if (tg && tg.HapticFeedback) { k === "bad" ? tg.HapticFeedback.notificationOccurred("error") : k === "win" ? tg.HapticFeedback.notificationOccurred("success") : tg.HapticFeedback.impactOccurred("light"); } else if (navigator.vibrate) navigator.vibrate(k === "bad" ? [40, 30, 40] : 12); } catch (_) {} };

// ---------- sound ----------
let ctx = null, soundOn = store.get("sound", true);
function beep(f, d = 0.1, type = "triangle", v = 0.12, to = 0, delay = 0) {
  if (!soundOn) return;
  try {
    ctx = ctx || new (window.AudioContext || window.webkitAudioContext)(); if (ctx.state === "suspended") ctx.resume();
    const t = ctx.currentTime + delay, o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t); if (to) o.frequency.exponentialRampToValueAtTime(to, t + d);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g).connect(ctx.destination); o.start(t); o.stop(t + d + 0.02);
  } catch (_) {}
}
const sfx = {
  tap: () => beep(660, 0.06, "triangle", 0.1, 990),
  good: () => { beep(784, 0.1); beep(1175, 0.14, "triangle", 0.1, 0, 0.06); },
  merge: n => beep(300 + Math.min(12, Math.log2(n)) * 70, 0.12, "square", 0.06),
  bad: () => beep(200, 0.3, "sawtooth", 0.1, 90),
  win: () => [523, 659, 784, 1047, 1319].forEach((n, i) => beep(n, 0.3, "triangle", 0.12, 0, i * 0.08)),
};
const syncSnd = () => { $("snd").textContent = soundOn ? "🔊" : "🔇"; };
$("snd").addEventListener("click", () => { soundOn = !soundOn; store.set("sound", soundOn); syncSnd(); sfx.tap(); });
syncSnd();

// ---------- shared game shell ----------
let current = null, score = 0;
function setScore(v) {
  score = v; $("gScore").textContent = v;
  if (current && v > store.get("best:" + current.key, 0)) { store.set("best:" + current.key, v); $("gBest").textContent = v; }
}
function gameOver(title, text, win) {
  (win ? sfx.win : sfx.bad)(); haptic(win ? "win" : "bad");
  const o = document.createElement("div"); o.className = "over";
  o.innerHTML = `<div class="box"><h2>${title}</h2><div class="num">${score}</div><div>${text || ""}</div><button class="btn" type="button">↻ លេងម្ដងទៀត</button></div>`;
  o.querySelector("button").addEventListener("click", () => open(current.key));
  $("stage").appendChild(o);
}
function swipe(el, cb) {
  let s = null;
  el.addEventListener("pointerdown", e => { s = { x: e.clientX, y: e.clientY }; });
  el.addEventListener("pointerup", e => {
    if (!s) return; const dx = e.clientX - s.x, dy = e.clientY - s.y; s = null;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
    cb(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : (dy > 0 ? "down" : "up"));
  });
}
const keyDir = e => ({ ArrowLeft: "left", ArrowRight: "right", ArrowUp: "up", ArrowDown: "down", a: "left", d: "right", w: "up", s: "down" })[e.key];

// ---------- games ----------
const GAMES = [
  { key: "2048", icon: "🔢", name: "2048 Neon", sub: "អូសបូកលេខ", c1: "#ff8a1f", c2: "#b33d00", hint: "អូស ឬចុចព្រួញ ដើម្បីបូកលេខដូចគ្នា · គោលដៅ 2048!", start: g2048 },
  { key: "snake", icon: "🐍", name: "ពស់ Neon", sub: "ស៊ីផ្លែឈើ ឲ្យវែង", c1: "#2ee6a0", c2: "#0b6b4f", hint: "អូសដើម្បីបត់ · កុំខាំខ្លួនឯង!", start: gSnake },
  { key: "memory", icon: "🃏", name: "ផ្គូផ្គងកាត", sub: "ចងចាំរូបដូចគ្នា", c1: "#a46bff", c2: "#4b1fa8", hint: "បើកកាត ២ ដូចគ្នា · កាន់តែលឿន ពិន្ទុកាន់តែច្រើន", start: gMemory },
  { key: "whack", icon: "🔨", name: "វាយ Cooler", sub: "ល្បឿនដៃ ៣០ វិនាទី", c1: "#ffd23f", c2: "#b37b00", hint: "វាយ Cooler Bot ឲ្យបានច្រើន · កុំវាយគ្រាប់បែក 💣", start: gWhack },
  { key: "ttt", icon: "❌", name: "XO ប្រកួត AI", sub: "ឈ្នះ AI បានទេ?", c1: "#2bd0ff", c2: "#0b4f8f", hint: "អ្នកជា X · ជ្រើសកម្រិត ហើយប្រកួត AI", start: gTtt },
  { key: "brick", icon: "🧱", name: "បំបែកឥដ្ឋ", sub: "បាល់ Neon", c1: "#ff4fd8", c2: "#8a1f78", hint: "អូសក្ដារ ឲ្យបាល់បុកឥដ្ឋ · ឡើងកម្រិតជាបន្តបន្ទាប់", start: gBrick },
];

function renderHub() {
  $("hub").innerHTML = GAMES.map(g => `<button class="card" type="button" data-k="${g.key}" style="--c1:${g.c1};--c2:${g.c2}">
    <span class="best">🏆 ${store.get("best:" + g.key, 0)}</span><span class="ic">${g.icon}</span><b>${g.name}</b><small>${g.sub}</small></button>`).join("");
}
$("hub").addEventListener("click", e => { const c = e.target.closest(".card"); if (c) { sfx.tap(); location.hash = c.dataset.k; } });
$("back").addEventListener("click", () => { sfx.tap(); history.length > 1 ? history.back() : (location.hash = ""); });

let cleanup = null;
function open(key) {
  if (cleanup) { cleanup(); cleanup = null; }
  const g = GAMES.find(x => x.key === key);
  if (!g) { $("game").hidden = true; current = null; renderHub(); return; }
  current = g; $("game").hidden = false; $("gTitle").textContent = `${g.icon} ${g.name}`; $("hint").textContent = g.hint;
  $("gBest").textContent = store.get("best:" + key, 0); $("stage").innerHTML = ""; setScore(0);
  cleanup = g.start($("stage")) || null;
}
window.addEventListener("hashchange", () => open(location.hash.slice(1)));

// ===== 2048 =====
function g2048(stage) {
  const colors = { 2: "#1f3b8f", 4: "#2a52c9", 8: "#ff8a1f", 16: "#ff6a1f", 32: "#ff3d5a", 64: "#ff1f6a", 128: "#ffd23f", 256: "#ffc21f", 512: "#2ee6a0", 1024: "#2bd0ff", 2048: "#ff4fd8" };
  let grid = A.addTile(A.addTile([[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]])), total = 0, won = false;
  const el = document.createElement("div"); el.className = "g2048"; stage.appendChild(el);
  const draw = (fresh) => { el.innerHTML = grid.flat().map((v, i) => `<div class="${fresh === i ? "n" : ""}" style="${v ? `background:${colors[v] || "#fff"};box-shadow:0 0 14px ${colors[v] || "#fff"}88;color:${v >= 128 && v <= 256 ? "#2a1a00" : "#fff"}` : ""}">${v || ""}</div>`).join(""); };
  const go = dir => {
    const r = A.move2048(grid, dir); if (!r.moved) return;
    const before = r.grid.flat(); grid = A.addTile(r.grid); const after = grid.flat();
    const fresh = after.findIndex((v, i) => v !== before[i]);
    total += r.gained; setScore(total); r.gained ? sfx.merge(r.gained) : sfx.tap(); haptic("tap"); draw(fresh);
    if (!won && grid.flat().includes(2048)) { won = true; gameOver("🎉 2048!", "អស្ចារ្យ!", true); }
    else if (!A.canMove2048(grid)) gameOver("អស់ផ្លូវហើយ", "ព្យាយាមម្ដងទៀត 💪");
  };
  swipe(stage, go); const k = e => { const d = keyDir(e); if (d) { e.preventDefault(); go(d); } };
  window.addEventListener("keydown", k); draw();
  return () => window.removeEventListener("keydown", k);
}

// ===== snake =====
function gSnake(stage) {
  const N = 18, cv = document.createElement("canvas"); cv.className = "play"; stage.appendChild(cv);
  const size = Math.floor(Math.min(stage.clientWidth - 24, stage.clientHeight - 24, 460)); const dpr = Math.min(devicePixelRatio || 1, 2);
  cv.width = cv.height = size * dpr; cv.style.width = cv.style.height = size + "px"; const g = cv.getContext("2d"); g.scale(dpr, dpr);
  const cell = size / N, fruits = ["🥭", "🍉", "🍌", "🍍", "🥥", "🍒"];
  let snake = [[8, 9], [7, 9], [6, 9]], dir = "right", next = "right", food = A.placeFood(snake, N), fruit = fruits[0], pts = 0, alive = true, timer = 0, speed = 150;
  const draw = () => {
    g.fillStyle = "#050816"; g.fillRect(0, 0, size, size);
    g.strokeStyle = "rgba(43,208,255,.06)"; for (let i = 0; i <= N; i++) { g.beginPath(); g.moveTo(i * cell, 0); g.lineTo(i * cell, size); g.moveTo(0, i * cell); g.lineTo(size, i * cell); g.stroke(); }
    g.font = `${cell * 0.85}px sans-serif`; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(fruit, food[0] * cell + cell / 2, food[1] * cell + cell / 2 + 1);
    snake.forEach(([x, y], i) => { const t = i / snake.length; g.fillStyle = `hsl(${160 + t * 60},90%,${60 - t * 25}%)`; g.shadowColor = "#2ee6a0"; g.shadowBlur = i ? 6 : 16;
      g.beginPath(); g.roundRect ? g.roundRect(x * cell + 1.5, y * cell + 1.5, cell - 3, cell - 3, cell * 0.35) : g.rect(x * cell + 1.5, y * cell + 1.5, cell - 3, cell - 3); g.fill(); });
    g.shadowBlur = 0; const [hx, hy] = snake[0]; g.fillStyle = "#04122a"; g.beginPath(); g.arc(hx * cell + cell * 0.35, hy * cell + cell * 0.38, cell * 0.08, 0, 7); g.arc(hx * cell + cell * 0.65, hy * cell + cell * 0.38, cell * 0.08, 0, 7); g.fill();
  };
  const tick = () => {
    if (!alive) return; dir = A.turn(dir, next);
    const r = A.stepSnake(snake, dir, food, N); snake = r.snake;
    if (r.dead) { alive = false; draw(); gameOver("ពស់ខាំខ្លួនឯង 🐍", `ប្រវែង ${snake.length}`); return; }
    if (r.ate) { pts += 10; setScore(pts); sfx.good(); haptic("tap"); food = A.placeFood(snake, N); fruit = fruits[Math.floor(Math.random() * fruits.length)]; speed = Math.max(70, speed - 4); }
    draw(); timer = setTimeout(tick, speed);
  };
  swipe(stage, d => { next = d; }); const k = e => { const d = keyDir(e); if (d) { e.preventDefault(); next = d; } };
  window.addEventListener("keydown", k); draw(); timer = setTimeout(tick, 600);
  return () => { alive = false; clearTimeout(timer); window.removeEventListener("keydown", k); };
}

// ===== memory =====
function gMemory(stage) {
  const symbols = ["🛕", "🐘", "🎤", "🥭", "🛺", "🌶️", "🐟", "🌾", "🪷", "🎧"];
  const cards = A.deck(symbols.sort(() => Math.random() - 0.5), 8);
  const el = document.createElement("div"); el.className = "mem"; stage.appendChild(el);
  el.innerHTML = cards.map((c, i) => `<button type="button" data-i="${i}" aria-label="កាត ${i + 1}"><span>${c.sym}</span></button>`).join("");
  let open1 = null, lock = false, moves = 0, found = 0; const t0 = performance.now();
  el.addEventListener("click", e => {
    const b = e.target.closest("button"); if (!b || lock || b.classList.contains("open") || b.classList.contains("done")) return;
    sfx.tap(); b.classList.add("open");
    if (!open1) { open1 = b; return; }
    moves++; const a = open1; open1 = null;
    if (cards[a.dataset.i].sym === cards[b.dataset.i].sym) {
      a.classList.replace("open", "done"); b.classList.replace("open", "done"); found++; sfx.good(); haptic("tap");
      setScore(A.memoryScore(found, moves, (performance.now() - t0) / 1000));
      if (found === 8) { setScore(A.memoryScore(8, moves, (performance.now() - t0) / 1000)); gameOver("🎉 ផ្គូផ្គងគ្រប់!", `${moves} ជំហាន · ${Math.round((performance.now() - t0) / 1000)} វិនាទី`, true); }
    } else { lock = true; setTimeout(() => { a.classList.remove("open"); b.classList.remove("open"); lock = false; }, 650); }
  });
}

// ===== whack-a-cooler =====
function gWhack(stage) {
  const el = document.createElement("div"); el.className = "whack"; stage.appendChild(el);
  el.innerHTML = Array.from({ length: 9 }, (_, i) => `<div class="hole"><button class="mole" type="button" data-i="${i}" aria-label="វាយ"><img src="../cooler-fly/cooler.png" alt=""></button></div>`).join("");
  const moles = [...el.querySelectorAll(".mole")];
  let pts = 0, left = 30, alive = true, timers = [];
  const bar = document.createElement("div"); bar.style.cssText = "position:absolute;top:0;left:12px;right:12px;height:6px;border-radius:9px;background:rgba(255,255,255,.1);overflow:hidden";
  bar.innerHTML = '<div style="height:100%;width:100%;background:linear-gradient(90deg,#2bd0ff,#ffd23f);transition:width 1s linear"></div>'; stage.appendChild(bar);
  const pop = () => {
    if (!alive) return;
    const free = moles.filter(m => !m.classList.contains("up")); if (!free.length) return;
    const m = free[Math.floor(Math.random() * free.length)], bomb = Math.random() < 0.18;
    m.classList.toggle("bomb", bomb); m.innerHTML = bomb ? '<span class="bombface">💣</span>' : '<img src="../cooler-fly/cooler.png" alt="">';
    m.classList.add("up"); m.dataset.bomb = bomb ? "1" : "";
    const stay = Math.max(450, 1000 - (30 - left) * 18);
    timers.push(setTimeout(() => m.classList.remove("up"), stay));
    timers.push(setTimeout(pop, Math.max(280, 700 - (30 - left) * 14)));
  };
  el.addEventListener("pointerdown", e => {
    const m = e.target.closest(".mole"); if (!m || !m.classList.contains("up") || !alive) return;
    m.classList.remove("up");
    if (m.dataset.bomb) { pts = Math.max(0, pts - 30); sfx.bad(); haptic("bad"); } else { pts += 10; sfx.good(); haptic("tap"); }
    m.classList.add("hit"); setTimeout(() => m.classList.remove("hit"), 150); setScore(pts);
  });
  const clock = setInterval(() => { left--; bar.firstChild.style.width = (left / 30 * 100) + "%"; if (left <= 0) { alive = false; clearInterval(clock); gameOver("⏰ អស់ម៉ោង!", `វាយបាន ${pts / 10 | 0}+ ដង`, pts >= 200); } }, 1000);
  pop(); setTimeout(pop, 400);
  return () => { alive = false; clearInterval(clock); timers.forEach(clearTimeout); };
}

// ===== tic-tac-toe =====
function gTtt(stage) {
  const wrap = document.createElement("div"); stage.appendChild(wrap);
  let level = store.get("tttLevel", 0.6), b = Array(9).fill(null), wins = store.get("tttWins", 0), busy = false;
  const levels = [["ងាយ", 0.25], ["មធ្យម", 0.6], ["ពិបាក", 1]];
  wrap.innerHTML = `<div class="levels">${levels.map(([n, v]) => `<button type="button" data-l="${v}" aria-pressed="${v === level}">${n}</button>`).join("")}</div><div class="ttt"></div>`;
  const grid = wrap.querySelector(".ttt"); setScore(wins);
  const draw = (line = []) => { grid.innerHTML = b.map((v, i) => `<button type="button" data-i="${i}" class="${v || ""}${line.includes(i) ? " win" : ""}" aria-label="ក្រឡា ${i + 1}">${v || ""}</button>`).join(""); };
  const finish = w => {
    draw(w.line);
    if (w.who === "X") { wins += 3; store.set("tttWins", wins); setScore(wins); gameOver("🏆 អ្នកឈ្នះ AI!", "+3", true); }
    else if (w.who === "O") gameOver("🤖 AI ឈ្នះ", "សាកកម្រិតងាយសិន 😉");
    else { wins += 1; store.set("tttWins", wins); setScore(wins); gameOver("🤝 ស្មើ", "+1"); }
  };
  grid.addEventListener("click", e => {
    const c = e.target.closest("button"); if (!c || busy || b[c.dataset.i]) return;
    b[c.dataset.i] = "X"; sfx.tap(); draw(); let w = A.winner(b); if (w) return finish(w);
    busy = true; setTimeout(() => { b[A.aiMove(b, "O", level)] = "O"; beep(440, 0.08); busy = false; draw(); const w2 = A.winner(b); if (w2) finish(w2); }, 350);
  });
  wrap.querySelector(".levels").addEventListener("click", e => { const l = e.target.closest("button"); if (!l) return; level = Number(l.dataset.l); store.set("tttLevel", level); open("ttt"); });
  draw();
}

// ===== brick breaker =====
function gBrick(stage) {
  const cv = document.createElement("canvas"); cv.className = "play"; stage.appendChild(cv);
  const W = Math.floor(Math.min(stage.clientWidth - 24, 460)), H = Math.floor(Math.min(stage.clientHeight - 24, W * 1.45)), dpr = Math.min(devicePixelRatio || 1, 2);
  cv.width = W * dpr; cv.height = H * dpr; cv.style.width = W + "px"; cv.style.height = H + "px"; const g = cv.getContext("2d"); g.scale(dpr, dpr);
  const COLS = 8, bw = (W - 20) / COLS, bh = 18, colors = ["#ff4fd8", "#ff8a1f", "#ffd23f", "#2ee6a0", "#2bd0ff", "#a46bff", "#ff3d5a"];
  let level = 1, list = A.bricks(level), pts = 0, lives = 3, paddle = { x: W / 2, w: Math.max(70, W * 0.22) }, ball, raf = 0, alive = true, launched = false;
  const reset = () => { launched = false; ball = { x: paddle.x, y: H - 46, vx: 0, vy: 0, r: 7 }; };
  const speed = () => Math.min(9, 5 + level * 0.6);
  reset();
  const move = e => { const r = cv.getBoundingClientRect(); paddle.x = Math.max(paddle.w / 2, Math.min(W - paddle.w / 2, (e.clientX - r.left) * (W / r.width))); };
  cv.addEventListener("pointermove", move); cv.addEventListener("pointerdown", e => { move(e); if (!launched) { launched = true; const b = A.paddleBounce((Math.random() - 0.5) * 0.6, speed()); ball.vx = b.vx; ball.vy = b.vy; sfx.tap(); } });
  const k = e => { if (e.key === "ArrowLeft") paddle.x = Math.max(paddle.w / 2, paddle.x - 30); if (e.key === "ArrowRight") paddle.x = Math.min(W - paddle.w / 2, paddle.x + 30); if (e.key === " " && !launched) cv.dispatchEvent(new PointerEvent("pointerdown", { clientX: cv.getBoundingClientRect().left + paddle.x })); };
  window.addEventListener("keydown", k);
  const loop = () => {
    if (!alive) return;
    if (!launched) { ball.x = paddle.x; ball.y = H - 46; }
    else {
      ball.x += ball.vx; ball.y += ball.vy;
      if (ball.x < ball.r || ball.x > W - ball.r) { ball.vx *= -1; ball.x = Math.max(ball.r, Math.min(W - ball.r, ball.x)); beep(500, 0.03); }
      if (ball.y < ball.r) { ball.vy = Math.abs(ball.vy); beep(500, 0.03); }
      if (ball.vy > 0 && ball.y > H - 40 && ball.y < H - 24 && Math.abs(ball.x - paddle.x) < paddle.w / 2 + ball.r) {
        const b = A.paddleBounce((ball.x - paddle.x) / (paddle.w / 2), speed()); ball.vx = b.vx; ball.vy = b.vy; beep(330, 0.05, "square", 0.06); haptic("tap");
      }
      if (ball.y > H + 20) { lives--; sfx.bad(); haptic("bad"); if (lives <= 0) { alive = false; gameOver("💥 អស់ជីវិត", `កម្រិត ${level}`); return; } reset(); }
      for (const br of list) {
        const x = 10 + br.c * bw, y = 50 + br.r * (bh + 6);
        if (ball.x > x - ball.r && ball.x < x + bw - 4 + ball.r && ball.y > y - ball.r && ball.y < y + bh + ball.r) {
          br.hp--; ball.vy *= -1; pts += 10 * level; setScore(pts); beep(600 + br.r * 60, 0.05, "square", 0.05); break;
        }
      }
      list = list.filter(b => b.hp > 0);
      if (!list.length) { level++; list = A.bricks(level); sfx.win(); haptic("win"); reset(); }
    }
    g.fillStyle = "#050816"; g.fillRect(0, 0, W, H);
    g.font = "700 13px Orbitron, sans-serif"; g.fillStyle = "#9fb3d8"; g.fillText(`LV ${level}`, 12, 26); g.fillText("❤️".repeat(lives), W - 70, 26);
    for (const br of list) { const x = 10 + br.c * bw, y = 50 + br.r * (bh + 6), c = colors[br.r % colors.length];
      g.fillStyle = c; g.shadowColor = c; g.shadowBlur = br.hp > 1 ? 16 : 8; g.globalAlpha = br.hp > 1 ? 1 : 0.85;
      g.beginPath(); g.roundRect ? g.roundRect(x, y, bw - 4, bh, 6) : g.rect(x, y, bw - 4, bh); g.fill(); }
    g.globalAlpha = 1; g.shadowColor = "#2bd0ff"; g.shadowBlur = 16; g.fillStyle = "#2bd0ff";
    g.beginPath(); g.roundRect ? g.roundRect(paddle.x - paddle.w / 2, H - 32, paddle.w, 12, 6) : g.rect(paddle.x - paddle.w / 2, H - 32, paddle.w, 12); g.fill();
    g.shadowColor = "#ffd23f"; g.fillStyle = "#fff"; g.beginPath(); g.arc(ball.x, ball.y, ball.r, 0, 7); g.fill(); g.shadowBlur = 0;
    if (!launched) { g.fillStyle = "#cfe6ff"; g.textAlign = "center"; g.font = "700 15px 'Kantumruy Pro', sans-serif"; g.fillText("ចុចដើម្បីបាញ់បាល់ 🚀", W / 2, H * 0.62); g.textAlign = "start"; }
    raf = requestAnimationFrame(loop);
  };
  loop();
  return () => { alive = false; cancelAnimationFrame(raf); window.removeEventListener("keydown", k); };
}

renderHub();
if (location.hash) open(location.hash.slice(1));
window.__arcade = { open, GAMES };
})();
