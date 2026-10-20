(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.BGRProgression = api;
})(typeof globalThis === 'object' ? globalThis : this, function () {
  'use strict';

  const STORE_KEY = 'blueGoldRush.progress.v1';
  const xpForNextLevel = level => 100 + Math.max(0, level - 1) * 50;

  function create(options) {
    options = options || {};
    const storage = options.storage;
    const onChange = options.onChange || function () {};
    let saved = {};
    try {
      saved = JSON.parse(storage && storage.getItem(STORE_KEY)) || {};
    } catch (_) {}

    const completedStages = Array.isArray(saved.completedStages)
      ? [...new Set(saved.completedStages.map(Number).filter(n => Number.isSafeInteger(n) && n > 0))].sort((a, b) => a - b)
      : [];
    const highestCompleted = completedStages.length ? completedStages[completedStages.length - 1] : 0;
    const data = {
      level: Number.isSafeInteger(saved.level) && saved.level > 0 ? saved.level : 1,
      xp: Number.isFinite(saved.xp) && saved.xp >= 0 ? saved.xp : 0,
      unlockedStages: Math.max(
        Number.isSafeInteger(saved.unlockedStages) && saved.unlockedStages > 0 ? saved.unlockedStages : 1,
        highestCompleted + 1
      ),
      completedStages,
      bestScore: Number.isFinite(saved.bestScore) && saved.bestScore >= 0 ? saved.bestScore : 0
    };
    let changed = false;
    while (data.xp >= xpForNextLevel(data.level)) {
      data.xp -= xpForNextLevel(data.level);
      data.level++;
      changed = true;
    }

    function snapshot() {
      return {
        level: data.level,
        xp: data.xp,
        xpToNextLevel: xpForNextLevel(data.level),
        unlockedStages: data.unlockedStages,
        completedStages: data.completedStages.slice(),
        bestScore: data.bestScore
      };
    }

    function save(event) {
      try {
        if (storage) storage.setItem(STORE_KEY, JSON.stringify(snapshot()));
      } catch (_) {}
      onChange(snapshot(), event || { type: 'progress' });
    }

    function awardXP(amount) {
      if (!Number.isFinite(amount) || amount <= 0) return { levels: [], bonusXP: 0 };
      data.xp += amount;
      const levels = [];
      let bonusXP = 0;
      while (data.xp >= xpForNextLevel(data.level)) {
        data.xp -= xpForNextLevel(data.level);
        data.level++;
        levels.push(data.level);
        const reward = data.level * 10;
        bonusXP += reward;
        data.xp += reward;
      }
      return { levels, bonusXP };
    }

    if (changed) {
      try {
        if (storage) storage.setItem(STORE_KEY, JSON.stringify(snapshot()));
      } catch (_) {}
    }

    return {
      storeKey: STORE_KEY,
      snapshot,
      addXP(amount) {
        const result = awardXP(amount);
        if (amount > 0 && Number.isFinite(amount)) save({ type: 'xp', ...result });
        return result;
      },
      completeStage(stage, rewardXP) {
        if (!Number.isSafeInteger(stage) || stage < 1 || stage >= data.unlockedStages ||
            data.completedStages.includes(stage)) return false;
        data.completedStages.push(stage);
        data.completedStages.sort((a, b) => a - b);
        data.unlockedStages = Math.max(data.unlockedStages, stage + 1);
        const result = awardXP(rewardXP);
        save({ type: 'stageComplete', stage, ...result });
        return true;
      },
      recordBestScore(score) {
        if (!Number.isFinite(score) || score <= data.bestScore) return false;
        data.bestScore = score;
        save({ type: 'bestScore' });
        return true;
      }
    };
  }

  return { STORE_KEY, xpForNextLevel, create };
});
