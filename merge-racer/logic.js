/* Cooler Merge Racer — pure rules for the idle merge-car game (browser + Node tests). */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.MergeLogic = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  const SLOTS = 12, MAX_TRACK = 8, MAX_LEVEL = 30, OFFLINE_CAP = 2 * 3600;

  // Original names: Khmer street classics to 2050 hyper cars.
  const NAMES = ["តុកតុក", "ម៉ូតូឌុប", "ស៊ីក្លូ", "Remork", "Camry ចាស់", "Lexus 2050", "Pickup Neon", "Jeep ភ្នំ",
    "Sport X", "Turbo GT", "Drift King", "Cyber Coupe", "Hover Taxi", "Mekong Jet", "Angkor Racer", "Bokor Storm",
    "Plasma GT", "Quantum R", "Nova Z", "Solar Wing", "Thunder Naga", "Garuda X", "Galaxy Coupe", "Star Drifter",
    "Comet R", "Nebula GT", "Orbit King", "Hyper Naga", "Cooler One", "Cooler Legend"];

  /** Coins one car earns per lap. Grows ×1.9 per level (rounded). */
  const lapIncome = level => Math.round(4 * Math.pow(1.9, level - 1));
  /** Seconds per lap (higher levels are a bit faster). */
  const lapTime = level => Math.max(2.2, 5.2 - level * 0.1);
  /** Coins per second for a set of running car levels. */
  const incomeRate = (levels, boost = 1) => levels.reduce((s, l) => s + lapIncome(l) / lapTime(l), 0) * boost;

  /** Level the shop sells: a few levels below the best car so far. */
  const shopLevel = best => Math.max(1, best - 4);
  /** Price of a shop car: base grows with level and with how many of that level were bought. */
  const carCost = (level, bought = 0) => Math.round(20 * Math.pow(2.6, level - 1) * Math.pow(1.08, bought));

  /** Drag result for slot a → slot b: "merge" (same level), "swap", or "move" (b empty). Mutates slots. */
  function drop(slots, a, b) {
    if (a === b || slots[a] == null) return { kind: "none" };
    if (slots[b] == null) { slots[b] = slots[a]; slots[a] = null; return { kind: "move" }; }
    if (slots[b] === slots[a] && slots[a] < MAX_LEVEL) { slots[b] = slots[a] + 1; slots[a] = null; return { kind: "merge", level: slots[b] }; }
    [slots[a], slots[b]] = [slots[b], slots[a]]; return { kind: "swap" };
  }
  const freeSlot = slots => slots.findIndex(v => v == null);
  /** Earnings while away, capped. */
  const offline = (rate, seconds) => Math.floor(rate * Math.max(0, Math.min(seconds, OFFLINE_CAP)) * 0.5);

  function fmt(n) {
    n = Math.floor(n);
    const u = ["", "K", "M", "B", "T", "Qa", "Qi"]; let i = 0;
    while (n >= 1000 && i < u.length - 1) { n /= 1000; i++; }
    return (i ? n.toFixed(n < 10 ? 2 : n < 100 ? 1 : 0) : String(n)) + u[i];
  }
  /** Car paint from level: distinct hue per level, darker trim. */
  const paint = level => ({ h: (level * 47) % 360, s: 85, l: 55 - (level % 3) * 6 });

  return { SLOTS, MAX_TRACK, MAX_LEVEL, OFFLINE_CAP, NAMES, lapIncome, lapTime, incomeRate, shopLevel, carCost, drop, freeSlot, offline, fmt, paint };
});
