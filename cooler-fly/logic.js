/* Cooler Fly — pure game rules (shared by the page and the Node tests). */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.CoolerFlyLogic = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  const WORLD_H = 640;          // logical height; width follows the screen
  const GRAVITY = 1500;         // px / s²
  const FLAP_V = -470;          // px / s
  const MAX_FALL = 720;
  const PLAYER_R = 24;
  const PILLAR_W = 78;

  const RANKS = [
    { min: 0, km: "អ្នកហ្វឹកហាត់", en: "Rookie", icon: "🎧" },
    { min: 10, km: "Rapper ថ្មី", en: "Rapper", icon: "🎤" },
    { min: 25, km: "តារា", en: "Star", icon: "⭐" },
    { min: 50, km: "កំពូល", en: "Legend", icon: "🔥" },
    { min: 100, km: "ស្ដេច Cooler", en: "Cooler King", icon: "👑" },
  ];

  // Scenes ("វគ្គ") change as the score grows; after the last one they loop, faster.
  const STAGES = [
    { min: 0, key: "city", km: "ភ្នំពេញ 2050", en: "Neo Phnom Penh", sky: 0x060b24, fog: 0x1a0b3d, a: 0x2bd0ff, b: 0xff3df0, bpm: 112 },
    { min: 10, key: "angkor", km: "អង្គរ Hologram", en: "Cyber Angkor", sky: 0x03141a, fog: 0x0b3a3a, a: 0xffc847, b: 0x29ffc6, bpm: 118 },
    { min: 22, key: "ocean", km: "ទន្លេពន្លឺ", en: "Mekong of Light", sky: 0x190826, fog: 0x4a1450, a: 0xff8a3d, b: 0x8a5cff, bpm: 124 },
    { min: 36, key: "orbit", km: "ស្ថានីយ៍អវកាស", en: "Orbit Station", sky: 0x000006, fog: 0x050a1e, a: 0x7fd7ff, b: 0xffffff, bpm: 128 },
    { min: 52, key: "galaxy", km: "នគរកាឡាក់ស៊ី", en: "Galaxy Kingdom", sky: 0x0a0018, fog: 0x2a0a40, a: 0xff5ec4, b: 0x5effe0, bpm: 134 },
  ];

  function stageFor(score) {
    let idx = 0;
    for (let i = 0; i < STAGES.length; i++) if (score >= STAGES[i].min) idx = i;
    return { index: idx, number: idx + 1, ...STAGES[idx] };
  }

  function rankFor(score) {
    let r = RANKS[0];
    for (const x of RANKS) if (score >= x.min) r = x;
    return r;
  }

  /** Difficulty from the score: speed grows, the gap shrinks, both capped. */
  function difficulty(score) {
    const s = Math.max(0, score);
    return {
      speed: Math.min(330, 190 + s * 3.2),             // px / s
      gap: Math.max(150, 215 - s * 1.3),              // vertical opening
      spacing: Math.max(235, 300 - s * 1.2),          // px between pillars
    };
  }

  function stepPlayer(p, dt) {
    p.vy = Math.min(MAX_FALL, p.vy + GRAVITY * dt);
    p.y += p.vy * dt;
    return p;
  }

  function flap(p) {
    p.vy = FLAP_V;
    return p;
  }

  /** Circle (player) vs axis-aligned rectangle. */
  function hitsRect(cx, cy, r, x, y, w, h) {
    const nx = Math.max(x, Math.min(cx, x + w));
    const ny = Math.max(y, Math.min(cy, y + h));
    const dx = cx - nx, dy = cy - ny;
    return dx * dx + dy * dy < r * r;
  }

  /** True when the player touches the pillar pair (top and bottom) or leaves the world. */
  function collides(p, pillar, groundY) {
    if (p.y - PLAYER_R < -40 || p.y + PLAYER_R > groundY) return true;
    const r = PLAYER_R * 0.82; // forgiving hit box
    return hitsRect(p.x, p.y, r, pillar.x, -1000, PILLAR_W, 1000 + pillar.gapY) ||
      hitsRect(p.x, p.y, r, pillar.x, pillar.gapY + pillar.gap, PILLAR_W, 4000);
  }

  /** Gap position for a new pillar, kept away from the ceiling and the ground. */
  function newGapY(rand, gap, groundY) {
    const top = 70, bottom = groundY - 60 - gap;
    return Math.round(top + rand() * Math.max(1, bottom - top));
  }

  return { WORLD_H, GRAVITY, FLAP_V, MAX_FALL, PLAYER_R, PILLAR_W, RANKS, STAGES, stageFor, rankFor, difficulty,
           stepPlayer, flap, hitsRect, collides, newGapY };
});
