(function (root, factory) {
  const api = factory(typeof module === 'object' && module.exports ? require('./character.js') : root.TenAceCharacter);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.TenAceProgression = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (Character) {
  'use strict';
  const KEY = 'tenace.career.v1';
  const names = ['power', 'control', 'speed', 'iq'];
  const integer = (n, max = 1000000) => Number.isSafeInteger(n) && n >= 0 ? Math.min(n, max) : 0;
  function fresh() {
    return { version: 1, xp: 0, matches: 0, wins: 0, bestRally: 0, bestServe: 0, character: Character.fresh(), stats: { power: 0, control: 0, speed: 0, iq: 0 } };
  }
  function normalize(value) {
    const data = fresh();
    if (!value || value.version !== 1) return data;
    data.character = Character.normalize(value.character);
    for (const key of ['xp', 'matches', 'wins', 'bestRally', 'bestServe']) data[key] = integer(value[key]);
    data.wins = Math.min(data.wins, data.matches);
    data.bestServe = Math.min(100, data.bestServe);
    let budget = Math.floor(data.xp / 100);
    for (const key of names) {
      data.stats[key] = Math.min(integer(value.stats?.[key], 10), budget);
      budget -= data.stats[key];
    }
    return data;
  }
  function points(data) { return Math.floor(data.xp / 100) - names.reduce((sum, key) => sum + data.stats[key], 0); }
  function upgrade(data, key) {
    if (!names.includes(key) || points(data) < 1 || data.stats[key] >= 10) return false;
    data.stats[key]++;
    return true;
  }
  function reward(data, won, rally) {
    const earned = won ? 120 : 60;
    data.xp += earned; data.matches++; data.wins += won ? 1 : 0;
    data.bestRally = Math.max(data.bestRally, integer(rally));
    return earned;
  }
  function effects(data) {
    const s = data.stats;
    return { power: 1 + s.power * .025, timing: .05 + s.control * .004,
      risk: 1 - s.control * .045, movement: 1.8 + s.speed * .14,
      anticipation: .5 + s.iq * .05, serveWindow: .08 + s.control * .004 };
  }
  return { KEY, fresh, normalize, points, upgrade, reward, effects };
});
