"use strict";
/* Cooler Merge Racer — idle merge-car game (original art, drawn in code). */
(() => {
const M = window.MergeLogic;
const $ = id => document.getElementById(id);
const tg = window.Telegram && window.Telegram.WebApp;
try { tg && tg.ready(); tg && tg.expand(); tg && tg.disableVerticalSwipes && tg.disableVerticalSwipes(); } catch (_) {}
const KEY = "mergeRacer:v1";
const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || null; } catch (_) { return null; } };
const save = () => { try { localStorage.setItem(KEY, JSON.stringify({ ...S, t: Date.now() })); } catch (_) {} };
const haptic = k => { try { if (tg && tg.HapticFeedback) k === "win" ? tg.HapticFeedback.notificationOccurred("success") : tg.HapticFeedback.impactOccurred(k === "heavy" ? "heavy" : "light"); else if (navigator.vibrate) navigator.vibrate(k === "win" ? [40, 30, 80] : 10); } catch (_) {} };

let S = load() || { coins: 60, slots: [1, 1, null, null, null, null, null, null, null, null, null, null], track: [], best: 1, bought: {}, sound: true };
S.slots = Array.from({ length: M.SLOTS }, (_, i) => S.slots[i] ?? null);

// ---------- sound ----------
let ac = null;
function tone(f, d = 0.1, type = "triangle", v = 0.1, to = 0, delay = 0) {
  if (!S.sound) return;
  try {
    ac = ac || new (window.AudioContext || window.webkitAudioContext)(); if (ac.state === "suspended") ac.resume();
    const t = ac.currentTime + delay, o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t); if (to) o.frequency.exponentialRampToValueAtTime(to, t + d);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g).connect(ac.destination); o.start(t); o.stop(t + d + 0.02);
  } catch (_) {}
}
const sfx = {
  pick: () => tone(500, 0.06, "triangle", 0.08, 700),
  merge: lv => { [0, 4, 7, 12].forEach((n, i) => tone(392 * Math.pow(2, (n + Math.min(lv, 12)) / 12), 0.18, "triangle", 0.12, 0, i * 0.05)); tone(120, 0.25, "sine", 0.3, 50); },
  coin: () => tone(1320, 0.06, "square", 0.03),
  buy: () => { tone(660, 0.08); tone(990, 0.1, "triangle", 0.1, 0, 0.06); },
  no: () => tone(200, 0.18, "sawtooth", 0.08, 120),
  unlock: () => [523, 659, 784, 1047, 1319, 1568].forEach((n, i) => tone(n, 0.35, "triangle", 0.12, 0, i * 0.08)),
};
$("snd").textContent = S.sound ? "🔊" : "🔇";
$("snd").addEventListener("click", () => { S.sound = !S.sound; $("snd").textContent = S.sound ? "🔊" : "🔇"; save(); });

// ---------- car art (procedural, top-down) ----------
const carCache = {};
function drawCar(g, level, w, h) {
  const p = M.paint(level), body = `hsl(${p.h},${p.s}%,${p.l}%)`, dark = `hsl(${p.h},${p.s}%,${p.l - 22}%)`, lite = `hsl(${p.h},90%,${Math.min(85, p.l + 25)}%)`;
  const rr = (x, y, ww, hh, r) => { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + ww, y, x + ww, y + hh, r); g.arcTo(x + ww, y + hh, x, y + hh, r); g.arcTo(x, y + hh, x, y, r); g.arcTo(x, y, x + ww, y, r); g.closePath(); };
  g.save(); g.translate(w / 2, h / 2);
  const L = w * 0.86, W = h * 0.56 + Math.min(level, 20) * 0.004 * h;
  if (level >= 13) { const ug = g.createRadialGradient(0, 0, 4, 0, 0, L * 0.6); ug.addColorStop(0, lite); ug.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = ug; g.globalAlpha = 0.55; g.fillRect(-L * 0.7, -W, L * 1.4, W * 2); g.globalAlpha = 1; }
  g.fillStyle = "#0d0f1a"; // wheels
  for (const [x, y] of [[-L * 0.3, -W / 2], [L * 0.3, -W / 2], [-L * 0.3, W / 2], [L * 0.3, W / 2]]) { rr(x - L * 0.09, y - W * 0.12, L * 0.18, W * 0.24, 4); g.fill(); }
  if (level <= 3) { // tuk-tuk / moto / cyclo shapes: narrower with a canopy
    g.fillStyle = body; rr(-L * 0.42, -W * 0.38, L * 0.84, W * 0.76, W * 0.25); g.fill();
    g.fillStyle = lite; rr(-L * 0.05, -W * 0.42, L * 0.42, W * 0.84, 6); g.fill();
  } else {
    const grd = g.createLinearGradient(0, -W / 2, 0, W / 2); grd.addColorStop(0, lite); grd.addColorStop(0.5, body); grd.addColorStop(1, dark);
    g.fillStyle = grd; rr(-L / 2, -W / 2, L, W, W * (level >= 18 ? 0.5 : 0.32)); g.fill();
    g.fillStyle = "rgba(10,20,40,.85)"; rr(-L * 0.06, -W * 0.34, L * 0.26, W * 0.68, 6); g.fill();      // windshield
    g.fillStyle = "rgba(10,20,40,.7)"; rr(-L * 0.32, -W * 0.3, L * 0.16, W * 0.6, 5); g.fill();        // rear window
    g.fillStyle = "rgba(255,255,255,.35)"; rr(-L * 0.44, -W * 0.08, L * 0.8, W * 0.16, 4); g.fill();    // racing stripe
  }
  g.fillStyle = "#fff8c8"; g.fillRect(L * 0.44, -W * 0.36, L * 0.05, W * 0.18); g.fillRect(L * 0.44, W * 0.18, L * 0.05, W * 0.18); // headlights
  g.fillStyle = "#ff3d5a"; g.fillRect(-L * 0.5, -W * 0.34, L * 0.03, W * 0.16); g.fillRect(-L * 0.5, W * 0.18, L * 0.03, W * 0.16);
  if (level >= 8) { g.fillStyle = dark; rr(-L * 0.56, -W * 0.48, L * 0.08, W * 0.96, 3); g.fill(); }            // spoiler
  if (level >= 20) { g.fillStyle = lite; g.beginPath(); g.moveTo(-L * 0.1, -W / 2); g.lineTo(-L * 0.35, -W * 0.95); g.lineTo(L * 0.05, -W / 2); g.fill(); g.beginPath(); g.moveTo(-L * 0.1, W / 2); g.lineTo(-L * 0.35, W * 0.95); g.lineTo(L * 0.05, W / 2); g.fill(); } // wings
  if (level >= 28) { g.font = `${W * 0.6}px sans-serif`; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("👑", -L * 0.12, 0); }
  g.restore();
}
function carImage(level) {
  if (carCache[level]) return carCache[level];
  const c = document.createElement("canvas"); c.width = 220; c.height = 140; drawCar(c.getContext("2d"), level, 220, 140);
  return (carCache[level] = { canvas: c, url: c.toDataURL() });
}

// ---------- track ----------
const cv = $("track"), g = cv.getContext("2d");
let TW = 0, TH = 0, dpr = 1;
function resize() { const r = cv.getBoundingClientRect(); dpr = Math.min(devicePixelRatio || 1, 2); TW = r.width; TH = r.height; cv.width = TW * dpr; cv.height = TH * dpr; g.setTransform(dpr, 0, 0, dpr, 0, 0); }
function stadium(u) { // point + angle on a stadium-shaped loop, u in [0,1)
  // Works for wide and tall canvases: the straights run along the longer side.
  const pad = 26, tall = TH > TW, W = (tall ? TH : TW) - pad * 2, H = (tall ? TW : TH) - pad * 2;
  const r = Math.max(10, H / 2), s = Math.max(1, W - 2 * r), per = 2 * s + 2 * Math.PI * r;
  let d = (u % 1) * per, p;
  if (d < s) p = { x: -s / 2 + d, y: -r, a: 0 };
  else if ((d -= s) < Math.PI * r) { const t = -Math.PI / 2 + d / r; p = { x: s / 2 + Math.cos(t) * r, y: Math.sin(t) * r, a: t + Math.PI / 2 }; }
  else if ((d -= Math.PI * r) < s) p = { x: s / 2 - d, y: r, a: Math.PI };
  else { d -= s; const t = Math.PI / 2 + d / r; p = { x: -s / 2 + Math.cos(t) * r, y: Math.sin(t) * r, a: t + Math.PI / 2 }; }
  // tall: rotate the loop 90° so it runs clockwise down the right side
  return tall ? { x: TW / 2 - p.y, y: TH / 2 + p.x, a: p.a + Math.PI / 2 } : { x: TW / 2 + p.x, y: TH / 2 + p.y, a: p.a };
}
let runners = [], pops = [], boostUntil = 0, boostReady = 0;
function syncRunners() { // one runner per car on track, spread out
  runners = S.track.map((lv, i) => runners[i] && runners[i].lv === lv ? runners[i] : { lv, u: i / Math.max(1, S.track.length) });
}
function drawTrack(dt, now) {
  const boost = now < boostUntil ? 2 : 1;
  g.clearRect(0, 0, TW, TH);
  const pad = 26, r = (TH - pad * 2) / 2;
  // asphalt + neon edges
  g.lineCap = "round"; g.lineJoin = "round";
  const path = () => { g.beginPath(); for (let i = 0; i <= 120; i++) { const p = stadium(i / 120); i ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y); } g.closePath(); };
  path(); g.strokeStyle = "#141a3a"; g.lineWidth = 44; g.stroke();
  path(); g.strokeStyle = boost > 1 ? "#ff4fd8" : "#2bd0ff"; g.lineWidth = 2; g.shadowColor = g.strokeStyle; g.shadowBlur = 14; g.setLineDash([]);
  g.save(); g.lineWidth = 46; g.globalAlpha = 0.25; g.stroke(); g.restore();
  path(); g.strokeStyle = "rgba(255,255,255,.25)"; g.lineWidth = 2; g.setLineDash([14, 14]); g.lineDashOffset = -now / 20 * boost; g.stroke(); g.setLineDash([]); g.shadowBlur = 0;
  // finish line
  const f = stadium(0); g.save(); g.translate(f.x, f.y); g.rotate(f.a); for (let k = 0; k < 6; k++) { g.fillStyle = k % 2 ? "#fff" : "#111"; g.fillRect(-3, -22 + k * 7.3, 6, 7.3); } g.restore();
  // center billboard
  g.fillStyle = "rgba(255,255,255,.06)"; g.font = "900 22px Orbitron, sans-serif"; g.textAlign = "center"; g.textBaseline = "middle";
  g.fillText(runners.length ? `${M.fmt(M.incomeRate(S.track, boost))}/s` : "អូសឡានមកទីនេះ ⬇", TW / 2, TH / 2);
  // cars
  for (const c of runners) {
    const before = c.u; c.u += dt / M.lapTime(c.lv) / 1 * boost * 0.6; // 0.6: one lap ≈ lapTime/0.6 s looks calmer
    if (Math.floor(c.u) > Math.floor(before)) { const gain = M.lapIncome(c.lv) * boost; S.coins += gain; const p = stadium(c.u); pops.push({ x: p.x, y: p.y - 18, t: 1, txt: "+" + M.fmt(gain) }); sfx.coin(); }
    const p = stadium(c.u), img = carImage(c.lv).canvas;
    g.save(); g.translate(p.x, p.y); g.rotate(p.a); g.drawImage(img, -30, -19, 60, 38); g.restore();
  }
  for (const p of pops) { p.y -= dt * 30; p.t -= dt; g.globalAlpha = Math.max(0, p.t); g.fillStyle = "#ffd23f"; g.font = "900 15px Orbitron, sans-serif"; g.fillText(p.txt, p.x, p.y); }
  g.globalAlpha = 1; pops = pops.filter(p => p.t > 0);
}

// ---------- garage ----------
const garage = $("garage");
function renderGarage(highlight = null) {
  garage.innerHTML = S.slots.map((lv, i) => `<div class="slot${highlight != null && lv === highlight ? " match" : ""}" data-i="${i}">${lv ? `<span class="lv">${lv}</span><img src="${carImage(lv).url}" alt="Lv ${lv}">` : ""}</div>`).join("");
}
function renderUI() {
  $("coins").textContent = M.fmt(S.coins);
  $("rate").textContent = `${M.fmt(M.incomeRate(S.track, performance.now() < boostUntil ? 2 : 1))} / វិនាទី`;
  const lv = M.shopLevel(S.best), cost = M.carCost(lv, S.bought[lv] || 0);
  $("buyImg").src = carImage(lv).url; $("buyCost").textContent = M.fmt(cost);
  $("buy").disabled = S.coins < cost || M.freeSlot(S.slots) < 0;
  $("onTrack").textContent = `🏁 លើផ្លូវ ${S.track.length}/${M.MAX_TRACK} · ចុចឡានលើផ្លូវដើម្បីយកចុះ`;
  $("best").textContent = `🏆 Lv ${S.best} · ${M.NAMES[S.best - 1]}`;
  const now = performance.now();
  $("boost").disabled = now < boostReady; $("boost").textContent = now < boostUntil ? `🚀 ${Math.ceil((boostUntil - now) / 1000)}s` : now < boostReady ? `⏳ ${Math.ceil((boostReady - now) / 1000)}s` : "🚀 x2";
}
function toast(t) { const el = $("toast"); el.textContent = t; el.classList.add("show"); clearTimeout(toast.h); toast.h = setTimeout(() => el.classList.remove("show"), 1800); }
function popup(level, title, text) { $("popImg").src = carImage(level).url; $("popTitle").textContent = title; $("popText").textContent = text; $("pop").hidden = false; }
$("popOk").addEventListener("click", () => { $("pop").hidden = true; });

function unlockCheck(level) {
  if (level > S.best) { S.best = level; sfx.unlock(); haptic("win"); popup(level, `🎉 ឡានថ្មី! Lv ${level}`, `${M.NAMES[level - 1]} · ${M.fmt(M.lapIncome(level))} 🪙 ក្នុងមួយជុំ`); }
}

// drag & drop between slots and onto the track
let drag = null; const ghost = $("ghost");
garage.addEventListener("pointerdown", e => {
  const s = e.target.closest(".slot"); if (!s) return; const i = Number(s.dataset.i); if (S.slots[i] == null) return;
  drag = { i, lv: S.slots[i], x: e.clientX, y: e.clientY, moved: false }; s.setPointerCapture?.(e.pointerId);
  ghost.src = carImage(drag.lv).url; sfx.pick(); renderGarage(drag.lv);
});
window.addEventListener("pointermove", e => {
  if (!drag) return; if (Math.hypot(e.clientX - drag.x, e.clientY - drag.y) > 6) drag.moved = true;
  ghost.style.display = "block"; ghost.style.left = e.clientX + "px"; ghost.style.top = e.clientY + "px";
  garage.querySelectorAll(".slot").forEach(el => el.classList.remove("over"));
  const over = document.elementFromPoint(e.clientX, e.clientY)?.closest(".slot"); if (over) over.classList.add("over");
});
window.addEventListener("pointerup", e => {
  if (!drag) return; const d = drag; drag = null; ghost.style.display = "none";
  const el = document.elementFromPoint(e.clientX, e.clientY);
  const slot = el && el.closest(".slot"), onTrack = el === cv;
  if (!d.moved || onTrack) { // tap or drop on track = send to track
    if (S.track.length >= M.MAX_TRACK) { toast("ផ្លូវពេញហើយ — បញ្ចូលឡានឲ្យខ្លាំងជាងមុន"); sfx.no(); }
    else { S.track.push(d.lv); S.slots[d.i] = null; syncRunners(); sfx.buy(); haptic("tap"); }
  } else if (slot) {
    const r = M.drop(S.slots, d.i, Number(slot.dataset.i));
    if (r.kind === "merge") { sfx.merge(r.level); haptic("heavy"); unlockCheck(r.level); }
  }
  renderGarage(); renderUI(); save();
});
cv.addEventListener("pointerdown", e => { // tap a running car to bring it back
  const r = cv.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
  let best = -1, dist = 40;
  runners.forEach((c, i) => { const p = stadium(c.u), dd = Math.hypot(p.x - x, p.y - y); if (dd < dist) { dist = dd; best = i; } });
  if (best < 0) return; const free = M.freeSlot(S.slots); if (free < 0) { toast("យានដ្ឋានពេញ"); return; }
  S.slots[free] = S.track.splice(best, 1)[0]; runners.splice(best, 1); syncRunners(); sfx.pick(); renderGarage(); renderUI(); save();
});

$("buy").addEventListener("click", () => {
  const lv = M.shopLevel(S.best), cost = M.carCost(lv, S.bought[lv] || 0), free = M.freeSlot(S.slots);
  if (free < 0) { toast("យានដ្ឋានពេញ — បញ្ចូលឡានដូចគ្នា"); sfx.no(); return; }
  if (S.coins < cost) { toast("លុយមិនគ្រប់"); sfx.no(); return; }
  S.coins -= cost; S.bought[lv] = (S.bought[lv] || 0) + 1; S.slots[free] = lv; sfx.buy(); haptic("tap");
  renderGarage(); renderUI(); save();
});
$("sortBtn").addEventListener("click", () => { // merge every pair it can, lowest first
  let merged = 0, top = 0;
  for (let changed = true; changed;) {
    changed = false;
    const order = S.slots.map((v, i) => [v, i]).filter(([v]) => v != null).sort((a, b) => a[0] - b[0]);
    for (let k = 0; k + 1 < order.length; k++) if (order[k][0] === order[k + 1][0] && order[k][0] < M.MAX_LEVEL) {
      const r = M.drop(S.slots, order[k][1], order[k + 1][1]); if (r.kind === "merge") { merged++; top = Math.max(top, r.level); changed = true; break; }
    }
  }
  if (merged) { sfx.merge(top); haptic("heavy"); unlockCheck(top); toast(`🔀 បញ្ចូល ${merged} ដង`); } else { toast("គ្មានឡានដូចគ្នា"); }
  renderGarage(); renderUI(); save();
});
$("boost").addEventListener("click", () => { const now = performance.now(); if (now < boostReady) return; boostUntil = now + 30000; boostReady = now + 120000; sfx.unlock(); haptic("win"); toast("🚀 ល្បឿន និងលុយ x2 រយៈពេល 30 វិនាទី!"); });

// ---------- loop ----------
let last = performance.now(), uiTimer = 0, saveTimer = 0;
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  drawTrack(dt, now);
  if ((uiTimer += dt) > 0.25) { uiTimer = 0; renderUI(); }
  if ((saveTimer += dt) > 5) { saveTimer = 0; save(); }
  requestAnimationFrame(frame);
}
window.addEventListener("resize", resize);
document.addEventListener("visibilitychange", () => { if (document.hidden) save(); });

resize(); syncRunners(); renderGarage(); renderUI();
const saved = load();
if (saved && saved.t && S.track.length) {
  const away = (Date.now() - saved.t) / 1000, earned = M.offline(M.incomeRate(S.track), away);
  if (earned > 0 && away > 60) { S.coins += earned; setTimeout(() => popup(S.best, "👋 សូមស្វាគមន៍ត្រឡប់មកវិញ!", `ឡានរបស់អ្នករត់រកបាន ${M.fmt(earned)} 🪙 ពេលអ្នកមិននៅ`), 300); }
} else if (!saved) {
  setTimeout(() => popup(1, "🏎️ Cooler Merge Racer", "អូសឡានដូចគ្នាបញ្ចូលគ្នា → បានឡានខ្លាំងជាង · ដាក់ឡានលើផ្លូវ ដើម្បីរកលុយ"), 300);
}
requestAnimationFrame(frame);
window.__merge = { get state() { return S; }, M };
})();
