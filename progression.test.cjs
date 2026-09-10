const { test } = require('node:test');
const assert = require('node:assert/strict');
const career = require('./progression.js');

test('match rewards carry through levels and purchases survive save round trips', () => {
  const save = career.fresh();
  assert.equal(career.reward(save, false, 4), 60);
  assert.equal(career.points(save), 0);
  career.reward(save, true, 9);
  assert.equal(career.points(save), 1);
  assert.equal(career.upgrade(save, 'speed'), true);
  assert.equal(career.upgrade(save, 'iq'), false);
  assert.deepEqual(career.normalize(JSON.parse(JSON.stringify(save))), save);
  assert.equal(save.wins, 1);
  assert.equal(save.bestRally, 9);
});
test('untrusted save values cannot create negative balances or unearned upgrades', () => {
  const save = career.normalize({ version: 1, xp: 100, matches: 2, wins: 99,
    bestServe: Infinity, stats: { power: 10, speed: -2, control: '5', iq: 10 } });
  assert.equal(save.wins, 2);
  assert.equal(save.bestServe, 0);
  assert.equal(career.points(save), 0);
  assert.deepEqual(save.stats, { power: 1, control: 0, speed: 0, iq: 0 });
  assert.deepEqual(career.normalize({ version: 99 }), career.fresh());
});
test('all four upgrades change their intended gameplay effects and cap at ten', () => {
  const save = career.fresh(); save.xp = 10000;
  const base = career.effects(save);
  for (const key of ['power', 'control', 'speed', 'iq']) {
    for (let i = 0; i < 10; i++) assert.equal(career.upgrade(save, key), true);
    assert.equal(career.upgrade(save, key), false);
  }
  const upgraded = career.effects(save);
  assert.ok(upgraded.power > base.power);
  assert.ok(upgraded.timing > base.timing && upgraded.risk < base.risk);
  assert.ok(upgraded.movement > base.movement);
  assert.ok(upgraded.anticipation > base.anticipation);
  assert.ok(upgraded.serveWindow > base.serveWindow);
  assert.equal(career.upgrade(save, 'unknown'), false);
});
