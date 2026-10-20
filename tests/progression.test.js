const test = require('node:test');
const assert = require('node:assert/strict');
const { create, STORE_KEY, xpForNextLevel } = require('../progression.js');

function makeProgression(initial) {
  const store = initial ? { [STORE_KEY]: JSON.stringify(initial) } : {};
  const storage = {
    getItem: key => store[key] || null,
    setItem: (key, value) => { store[key] = value; }
  };
  return { progression: create({ storage }), store, storage };
}

test('XP thresholds grow and level-ups award bonus XP', () => {
  const { progression } = makeProgression();
  assert.equal(xpForNextLevel(1), 100);
  assert.equal(xpForNextLevel(2), 150);
  assert.deepEqual(progression.addXP(100), { levels: [2], bonusXP: 20 });
  assert.deepEqual(progression.snapshot(), {
    level: 2, xp: 20, xpToNextLevel: 150, unlockedStages: 1,
    completedStages: [], bestScore: 0
  });
  assert.deepEqual(progression.addXP(130), { levels: [3], bonusXP: 30 });
  assert.equal(progression.snapshot().level, 3);
  assert.equal(progression.snapshot().xp, 30);
});

test('stage completion unlocks the next stage and duplicate completion pays once', () => {
  const { progression } = makeProgression();
  assert.equal(progression.completeStage(1, 30), true);
  assert.equal(progression.completeStage(1, 30), false);
  assert.equal(progression.snapshot().unlockedStages, 2);
  assert.deepEqual(progression.snapshot().completedStages, [1]);
  assert.equal(progression.snapshot().xp, 30);
  assert.equal(progression.completeStage(3, 30), false);
});

test('level, XP, stages, and best score restore from localStorage', () => {
  const first = makeProgression();
  first.progression.addXP(140);
  first.progression.completeStage(1, 20);
  first.progression.recordBestScore(456.7);
  const restored = create({ storage: first.storage });
  assert.deepEqual(restored.snapshot(), {
    level: 2, xp: 80, xpToNextLevel: 150, unlockedStages: 2,
    completedStages: [1], bestScore: 456.7
  });
  assert.equal(restored.recordBestScore(400), false);
});

test('stage progression has no Stage 10 limit', () => {
  const { progression } = makeProgression();
  for (let stage = 1; stage <= 101; stage++) {
    assert.equal(progression.completeStage(stage, 1), true);
  }
  assert.equal(progression.snapshot().unlockedStages, 102);
  assert.equal(progression.snapshot().completedStages.length, 101);
  assert.equal(progression.snapshot().completedStages[99], 100);
  assert.equal(progression.snapshot().completedStages[100], 101);
});
