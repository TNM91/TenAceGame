const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const Progress = require('./progression.js');
const Character = require('./character.js');
const html = fs.readFileSync('index.html', 'utf8');

// Run the shipped game loop with a deterministic clock and a small DOM adapter.
// No test-only entry points or cheats are added to the production game.
function boot(storage = new Map(), blocked = false, random = .5) {
  let now = 0, frame;
  const context2d = new Proxy({}, { get: () => () => {} });
  function element(classes = '') {
    const list = new Set(classes.split(' '));
    return { style: {}, dataset: {}, textContent: '', disabled: false, setAttribute(){},
      classList: { add: x => list.add(x), remove: x => list.delete(x), contains: x => list.has(x),
        toggle: (x, on) => on ? list.add(x) : list.delete(x) },
      querySelector: () => ({ textContent: '' }), clientWidth: 390, clientHeight: 500,
      getContext: () => context2d, setPointerCapture() {} };
  }
  const ids = {};
  for (const match of html.matchAll(/id="([^"]+)"/g)) ids[match[1]] = element();
  const modals = ['intro', 'result', 'career', 'paused', 'creator'].map(id => ids[id]);
  ids.intro.classList.add('show');
  const upgrades = ['power', 'control', 'speed', 'iq'].map(key => {
    const el = element('stat'); el.dataset.up = key; return el;
  });
  const shots = ['slice', 'topspin', 'flat', 'lob'].map(key => {
    const el = element('shot'); el.dataset.shot = key; return el;
  });
  const listeners={};
  const document = { createElement: () => element(), getElementById: id => ids[id], querySelector: () => element(),
    querySelectorAll: selector => selector === '.modal' ? modals : selector === '.shot' ? shots : upgrades,
    addEventListener(name,fn) {listeners[name]=fn;} };
  const math = Object.create(Math); math.random = () => random;
  vm.runInNewContext(html.match(/<script>([\s\S]*?)<\/script>/)[1], {
    document, window: { TenAceProgression: Progress, TenAceCharacter: Character, TenAcePhysics:require('./physics.js'),TenAceSound:{enabled:false,unlock(){},set(){},play(){}}, TenAceGraphics: {person(){},court(){},net(){}} }, Math: math,
    localStorage: { getItem: key => storage.get(key) ?? null,
      setItem: (key, value) => { if (blocked) throw Error('storage blocked'); storage.set(key, value); } },
    performance: { now: () => now }, navigator: {}, devicePixelRatio: 1,
    addEventListener() {}, requestAnimationFrame: fn => { frame = fn; },
    setTimeout: () => 1, clearTimeout() {},
  });
  return { ids, upgrades, storage,
    press(key){listeners.keydown({key,preventDefault(){}});},
    tick(ms = 16) { now += ms; frame(now); },
    runUntil(predicate, limit = 20000) {
      for (let i = 0; i < limit && !predicate(); i++) { now += 16; frame(now); }
      assert.ok(predicate(), 'game must reach expected state');
    } };
}
function loseMatch(game) {
  game.ids.startBtn.onclick();
  game.runUntil(() => {
    if (game.ids.serveUI.classList.contains('show')) game.ids.tapServe.onclick();
    return game.ids.result.classList.contains('show');
  });
}
test('completed matches pay once, purchases persist, and reload does not pay again', () => {
  const game = boot();
  loseMatch(game);
  const first = JSON.parse(game.storage.get(Progress.KEY));
  assert.equal(first.matches, 1);
  for (let i = 0; i < 200; i++) game.tick();
  assert.equal(JSON.parse(game.storage.get(Progress.KEY)).xp, first.xp);
  loseMatch(game);
  const before = JSON.parse(game.storage.get(Progress.KEY));
  assert.ok(Progress.points(before) >= 1);
  game.upgrades[0].onclick();
  const after = JSON.parse(game.storage.get(Progress.KEY));
  assert.equal(after.stats.power, 1);
  assert.equal(Progress.points(after), Progress.points(before) - 1);
  const reloaded = boot(game.storage);
  assert.match(reloaded.ids.careerDetail.textContent, /Power 1/);
  assert.equal(JSON.parse(game.storage.get(Progress.KEY)).xp, before.xp);
});
test('keyboard returns sustain a rally under the shipped physics and opponent movement',()=>{
 const game=boot();game.ids.startBtn.onclick();
 for(let i=0;i<2400;i++){
  if(game.ids.serveUI.classList.contains('show'))game.ids.tapServe.onclick();
  if(i%6===0)game.press('ArrowUp');
  game.tick();
 }
 game.runUntil(()=>{if(game.ids.serveUI.classList.contains('show'))game.ids.tapServe.onclick();return game.ids.result.classList.contains('show');});
 const save=JSON.parse(game.storage.get(Progress.KEY));
 assert.ok(save.bestRally>=6,`expected a sustained rally, got ${save.bestRally}`);
});
test('first service fault replays without scoring and second fault awards the receiver',()=>{
 const game=boot(new Map(),false,0);game.ids.startBtn.onclick();
 game.runUntil(()=>game.ids.serveUI.classList.contains('show'));game.ids.tapServe.onclick();
 game.runUntil(()=>game.ids.toast.textContent.includes('FAULT'));
 assert.equal(Number(game.ids.oScore.textContent),0);
 game.runUntil(()=>game.ids.serveUI.classList.contains('show'));game.ids.tapServe.onclick();
 game.runUntil(()=>Number(game.ids.oScore.textContent)===1);
 assert.match(game.ids.toast.textContent,/double fault/);
});
test('pause freezes serve input, leave cancels the session, and practice saves its record without XP', () => {
  const game = boot();
  game.ids.startBtn.onclick();
  game.runUntil(() => game.ids.serveUI.classList.contains('show'));
  game.ids.pauseBtn.onclick();
  game.tick(60000);
  game.ids.tapServe.onclick();
  assert.ok(game.ids.serveUI.classList.contains('show'));
  game.ids.leaveBtn.onclick();
  for (let i = 0; i < 300; i++) game.tick();
  assert.equal(game.storage.size, 0);
  game.ids.practiceBtn.onclick();
  for (let i = 0; i < 10; i++) {
    game.runUntil(() => game.ids.serveUI.classList.contains('show'));
    game.ids.tapServe.onclick();
  }
  assert.ok(game.ids.intro.classList.contains('show'));
  const save = JSON.parse(game.storage.get(Progress.KEY));
  assert.equal(save.xp, 0);
  assert.equal(save.matches, 0);
  assert.ok(save.bestServe > 0);
});
test('corrupt and unavailable storage do not prevent play', () => {
  const game = boot(new Map([[Progress.KEY, '{broken']]), true);
  loseMatch(game);
  assert.match(game.ids.saveStatus.textContent, /Saving is unavailable/);
  assert.match(game.ids.careerSummary.textContent, /1L|1W/);
});
test('creator cancellation is reversible and saved identity survives reload without changing career stats', () => {
  const game = boot();
  game.ids.customizeBtn.onclick();
  game.ids.editName.value = 'Discard me';game.ids.creatorForm.oninput();
  game.ids.creatorCancel.onclick();
  assert.equal(game.ids.youName.textContent, 'Rookie');
  assert.equal(game.storage.size, 0);
  game.ids.customizeBtn.onclick();
  game.ids.editName.value = 'Ace';game.ids.editStyle.value='ponytail';game.ids.editShirt.value='#f37968';
  game.ids.creatorForm.onsubmit({preventDefault(){}});
  assert.equal(game.ids.youName.textContent, 'Ace');
  const save = JSON.parse(game.storage.get(Progress.KEY));
  assert.equal(save.character.style, 'ponytail');assert.equal(save.character.shirt, '#f37968');
  assert.equal(save.xp, 0);assert.deepEqual(save.stats, Progress.fresh().stats);
  assert.equal(boot(game.storage).ids.youName.textContent, 'Ace');
});
