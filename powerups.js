(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.BGRPowerups = api;
})(typeof globalThis === 'object' ? globalThis : this, function () {
  'use strict';

  // ---------- ranks (Level -> title). Higher ranks were added above Mythic. ----------
  const RANKS = [
    { level: 1, title: 'Rookie', badge: '🏃' },
    { level: 3, title: 'Blue Scout', badge: '🔷' },
    { level: 5, title: 'Gold Runner', badge: '🪙' },
    { level: 8, title: 'Rush Ace', badge: '⚡' },
    { level: 12, title: 'Champion', badge: '🏆' },
    { level: 18, title: 'Legend', badge: '🌟' },
    { level: 25, title: 'Mythic', badge: '👑' },
    { level: 35, title: 'Sky Rider', badge: '🚲' },
    { level: 50, title: 'Blue Titan', badge: '💎' },
    { level: 70, title: 'Gold Emperor', badge: '🔱' },
    { level: 100, title: 'Smos Snea Immortal', badge: '🫶' }
  ];
  const rankIndexForLevel = level => {
    let index = 0;
    for (let i = 0; i < RANKS.length; i++) if (level >= RANKS[i].level) index = i;
    return index;
  };
  const rankForLevel = level => RANKS[rankIndexForLevel(level)];
  const nextRank = level => RANKS[rankIndexForLevel(level) + 1] || null;

  // ---------- Sky Bike: a flying bike that lifts the runner 15–20 m up ----------
  const SKY_BIKE = {
    minAltitude: 15,       // metres (1 world unit = 1 m)
    maxAltitude: 20,
    riseTime: 1.1,         // seconds to climb from the ground
    landTime: 1.3,         // seconds to glide back down
    baseDuration: 8,       // seconds of flight at rank Rookie
    perRankBonus: 0.5,     // +0.5 s for every rank above Rookie
    maxDuration: 13,
    landingGrace: 1.2,     // seconds of obstacle immunity after touchdown
    firstStage: 1,         // stage where Sky Bikes can start appearing
    spawnChance: 0.07,     // chance per spawned row once off cooldown
    cooldown: 220          // metres of track between two Sky Bike pickups
  };

  // Higher rank = longer ride (rank reward).
  function skyBikeDuration(level) {
    const d = SKY_BIKE.baseDuration + rankIndexForLevel(level) * SKY_BIKE.perRankBonus;
    return Math.min(SKY_BIKE.maxDuration, d);
  }

  const smooth = x => x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x);

  // Altitude (m) at time t of a flight lasting `duration` seconds.
  // Climbs to 15 m, cruises in a gentle wave between 15 and 20 m, then glides down to 0.
  function skyBikeAltitude(t, duration) {
    if (!(t >= 0) || !(duration > 0) || t >= duration) return 0;
    const mid = (SKY_BIKE.minAltitude + SKY_BIKE.maxAltitude) / 2;
    const amp = (SKY_BIKE.maxAltitude - SKY_BIKE.minAltitude) / 2;
    const cruise = mid - amp * Math.cos(Math.max(0, t - SKY_BIKE.riseTime) * 1.4);
    const rise = smooth(t / SKY_BIKE.riseTime);
    const land = smooth((duration - t) / SKY_BIKE.landTime);
    const lift = Math.min(rise, land);
    // While rising/landing blend from the ground to the cruise height.
    return lift * (lift < 1 ? SKY_BIKE.minAltitude + (cruise - SKY_BIKE.minAltitude) * lift : cruise);
  }

  // Whether the runner is high enough that ground obstacles cannot touch them.
  const isAboveObstacles = altitude => altitude >= 3;

  function shouldSpawnSkyBike(stage, metresSinceLast, random) {
    if (stage < SKY_BIKE.firstStage || metresSinceLast < SKY_BIKE.cooldown) return false;
    return (random === undefined ? Math.random() : random) < SKY_BIKE.spawnChance;
  }

  return {
    RANKS, rankForLevel, rankIndexForLevel, nextRank,
    SKY_BIKE, skyBikeDuration, skyBikeAltitude, isAboveObstacles, shouldSpawnSkyBike
  };
});
