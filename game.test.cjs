const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const Progress = require('./progression.js');
const Character = require('./character.js');
const html = fs.readFileSync('index.html', 'utf8');

// Run the shipped game loop with a deterministic clock and a small DOM adapter.
// No test-only entry points or cheats are added to the production game.
function boot(storage = new Map(), blocked = false, random = .5, engine = null) {
  let now = 0, frame;
  const context2d = new Proxy({}, { get: () => () => {} });
  function element(classes = '') {
    const list = new Set(classes.split(' '));
    return { style: {}, dataset: {}, textContent: '', disabled: false, setAttribute(){},
      classList: { add: x => list.add(x), remove: x => list.delete(x), contains: x => list.has(x),
        toggle: (x, on) => on ? list.add(x) : list.delete(x) },
      querySelector: () => ({ textContent: '' }), clientWidth: 390, clientHeight: 500,
      getContext: () => context2d, setPointerCapture() {},getBoundingClientRect:()=>({left:0,top:0,width:390,height:500}) };
  }
  const ids = {};
  for (const match of html.matchAll(/id="([^"]+)"/g)) ids[match[1]] = element();
  const modals = ['intro', 'result', 'career', 'paused', 'creator', 'journey'].map(id => ids[id]);
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
    document, window: {TenAceTechnique:require('./technique.js'),TenAce3D:engine, TenAceProgression: Progress, TenAceRivals:require('./rivals.js'),TenAceCharacter: Character, TenAcePhysics:require('./physics.js'),TenAceSound:{enabled:false,unlock(){},set(){},play(){}}, TenAceGraphics: {person(){},court(){},net(){}} }, Math: math,
    localStorage: { getItem: key => storage.get(key) ?? null,
      setItem: (key, value) => { if (blocked) throw Error('storage blocked'); storage.set(key, value); } },
    performance: { now: () => now }, navigator: {}, devicePixelRatio: 1,
    addEventListener(name,fn) {listeners[name]=fn;}, requestAnimationFrame: fn => { frame = fn; },
    setTimeout: () => 1, clearTimeout() {},
  });
  return { ids, upgrades, storage,
    visibility(hidden){document.hidden=hidden;listeners.visibilitychange();},
    blur(){listeners.blur();},
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
test('3D receives live aiming and pause state; view switches preserve the active drill',()=>{
 let state,disposed=0;
 const engine={create:()=>({resize(){},render(s){state=s},contact(){},dispose(){disposed++}})};
 const game=boot(new Map(),false,.5,engine);assert.equal(game.ids.renderStatus.textContent,'3D court');
 game.ids.rallyPractice.onclick();game.runUntil(()=>game.ids.rallyLabel.textContent.includes('Feed 1/12'));
 game.ids.game.onpointerdown({pointerId:1,clientX:150,clientY:400});game.ids.game.onpointermove({clientX:240,clientY:300});game.tick();
 assert.ok(state.aim.x>.5&&state.aim.x<=.77);assert.ok(Math.abs(state.aim.y-.23)<1e-9);
 game.ids.pauseBtn.onclick();game.tick();const time=state.time;game.tick(10000);assert.equal(state.time,time);assert.equal(state.aim,null);
 game.ids.viewBtn.onclick();assert.equal(disposed,1);assert.equal(game.ids.renderStatus.textContent,'2D court');
 game.ids.viewBtn.onclick();assert.equal(game.ids.renderStatus.textContent,'3D court');assert.ok(game.ids.paused.classList.contains('show'));
});
test('WebGL initialization failure and later render failure retain playable fallback',()=>{
 for(const engine of [{create(){throw Error('unsupported')}},{create(){return {resize(){},render(){throw Error('context lost')},dispose(){}}}}]){
  const game=boot(new Map(),false,.5,engine);game.tick();assert.match(game.ids.renderStatus.textContent,/2D/);
  loseMatch(game);assert.equal(JSON.parse(game.storage.get(Progress.KEY)).matches,1);
 }
});
test('rally drill counts returns, finishes twelve feeds, and awards no career XP',()=>{
 const game=boot();game.ids.rallyPractice.onclick();
 let peak=0;
 game.runUntil(()=>{
   game.press('ArrowUp');
   const count=game.ids.rallyLabel.textContent.match(/(\d+) returns/);if(count)peak=Math.max(peak,Number(count[1]));
   return game.ids.practiceSummary.textContent.includes('Rally drill complete');
 });
 assert.ok(peak>0,'player can return the repeatable feeds');
 assert.match(game.ids.practiceSummary.textContent,/\d+\/12 returns/);
 assert.equal(game.storage.get(Progress.KEY),undefined);
 assert.ok(game.ids.intro.classList.contains('show'));
});
test('rally drill pauses between feeds and leaving cancels all remaining feeds',()=>{
 const game=boot();game.ids.rallyPractice.onclick();game.ids.pauseBtn.onclick();game.tick(60000);
 assert.ok(!game.ids.rallyLabel.textContent.includes('Feed 1/12'));
 game.ids.resumeBtn.onclick();game.runUntil(()=>game.ids.rallyLabel.textContent.includes('Feed 1/12'));
 game.ids.pauseBtn.onclick();game.ids.leaveBtn.onclick();for(let i=0;i<500;i++)game.tick();
 assert.ok(game.ids.intro.classList.contains('show'));assert.equal(game.storage.size,0);
});
test('difficulty persists separately and all difficulties complete playable matches',()=>{
 for(const value of ['relaxed','standard','competitive']){
  const game=boot();game.ids.difficulty.value=value;game.ids.difficulty.onchange();
  assert.equal(game.storage.get('tenace.difficulty'),value);
  assert.equal(boot(game.storage).ids.difficulty.value,value);
  loseMatch(game);assert.equal(JSON.parse(game.storage.get(Progress.KEY)).matches,1);
 }
 const invalid=boot(new Map([['tenace.difficulty','constructor']]));assert.equal(invalid.ids.difficulty.value,'standard');
});
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
test('chapter selection enforces unlocks, loads Mira, and keeps Jax available',()=>{
 const locked=boot();locked.ids.chooseMira.onclick();assert.equal(locked.ids.chooseMira.disabled,true);
 const save=Progress.fresh();Progress.rewardMatch(save,true,5,'jax');
 const game=boot(new Map([[Progress.KEY,JSON.stringify(save)]]));
 game.ids.mapBtn.onclick();assert.ok(game.ids.journey.classList.contains('show'));
 assert.equal(game.ids.chooseMira.disabled,false);game.ids.chooseMira.onclick();
 assert.equal(game.ids.rivalName.textContent,'Mira Sol');assert.match(game.ids.venueLabel.textContent,/Solstice/);
 loseMatch(game);assert.match(game.ids.resultQuote.textContent,/Mira/);
 game.ids.resultMap.onclick();game.ids.chooseJax.onclick();assert.equal(game.ids.rivalName.textContent,'Jax Mercer');
});


test('resume countdown keeps the ball frozen and interruption requires another deliberate resume',()=>{
 let state;const game=boot(new Map(),false,.5,{create:()=>({resize(){},render(s){state={time:s.time,x:s.ball.x,y:s.ball.y}},dispose(){}})});
 game.ids.rallyPractice.onclick();game.runUntil(()=>game.ids.rallyLabel.textContent.includes('Feed 1/12'));game.tick();
 game.visibility(true);game.tick(10000);game.visibility(false);game.tick();const before={...state};
 game.ids.resumeBtn.onclick();assert.ok(game.ids.resumeCue.classList.contains('show'));
 for(let i=0;i<120;i++)game.tick();assert.deepEqual(state,before,'countdown must not move ball or animation');
 game.blur();assert.ok(game.ids.paused.classList.contains('show'));assert.ok(!game.ids.resumeCue.classList.contains('show'));
 for(let i=0;i<100;i++)game.tick();assert.deepEqual(state,before);
 game.ids.resumeBtn.onclick();for(let i=0;i<195;i++)game.tick();assert.ok(!game.ids.resumeCue.classList.contains('show'));assert.ok(state.time>before.time);
});
test('a second finger cannot steal or cancel the active aiming gesture',()=>{
 let state;const game=boot(new Map(),false,.5,{create:()=>({resize(){},render(s){state=s},dispose(){}})});
 game.ids.rallyPractice.onclick();game.runUntil(()=>game.ids.rallyLabel.textContent.includes('Feed 1/12'));
 const c=game.ids.game;c.onpointerdown({pointerId:1,clientX:150,clientY:400});c.onpointermove({pointerId:1,clientX:240,clientY:300});game.tick();const x=state.aim.x;
 c.onpointerdown({pointerId:2,clientX:50,clientY:400});c.onpointermove({pointerId:2,clientX:20,clientY:300});c.onpointercancel({pointerId:2});game.tick();assert.equal(state.aim.x,x);
 c.onlostpointercapture({pointerId:1});game.tick();assert.equal(state.aim,null);
});
test('auto graphics reduce rendering cost after sustained delays; manual selection persists',()=>{
 let quality;const engine={create:()=>({resize(){},render(){},dispose(){},setQuality(q){quality=q}})};
 const game=boot(new Map(),false,.5,engine);assert.equal(quality,'high');game.ids.rallyPractice.onclick();for(let i=0;i<95;i++)game.tick(34);assert.equal(quality,'low');
 game.ids.graphicsQuality.onchange({target:{value:'high'}});assert.equal(quality,'high');for(let i=0;i<100;i++)game.tick(34);assert.equal(quality,'high');
 assert.equal(boot(game.storage,false,.5,engine).ids.graphicsQuality.value,'high');
 game.ids.haptics.onchange({target:{checked:false}});
 const reload=boot(game.storage);assert.equal(reload.ids.haptics.checked,false);
});
test('menus render less often and a long active-frame stall pauses safely',()=>{
 let renders=0;const game=boot(new Map(),false,.5,{create:()=>({resize(){},render(){renders++},dispose(){}})});
 for(let i=0;i<60;i++)game.tick();assert.ok(renders<12,'idle previews do not render at full frame rate');
 game.ids.rallyPractice.onclick();game.tick(400);assert.ok(game.ids.paused.classList.contains('show'));assert.equal(game.ids.oScore.textContent,'0');
});
test('ball travel remains consistent at 60 and 30 fps',()=>{
 function sample(ms){let state;const game=boot(new Map(),false,.5,{create:()=>({resize(){},render(s){state={x:s.ball.x,y:s.ball.y}},dispose(){}})});game.ids.rallyPractice.onclick();for(let t=0;t<1280;t+=ms)game.tick(ms);return state;}
 const fast=sample(16),slow=sample(32);assert.ok(Math.abs(fast.x-slow.x)<.015);assert.ok(Math.abs(fast.y-slow.y)<.025);
});

test('held touch gestures load power and select rally shots without buttons',()=>{
 for(const [dx,dy,kind] of [[90,-140,'topspin'],[160,0,'flat'],[-70,120,'slice']]){
  let state;const game=boot(new Map(),false,.5,{create:()=>({resize(){},render(s){state=s},contact(){},dispose(){}})});
  game.ids.rallyPractice.onclick();game.runUntil(()=>state?.ball.active);
  game.ids.game.onpointerdown({pointerId:1,clientX:180,clientY:300});
  game.runUntil(()=>state.ball.bounces===1&&state.ball.y>=state.player.y-.13);
  assert.equal(game.ids.chargeValue.textContent,'100%');
  game.ids.game.onpointermove({pointerId:1,clientX:180+dx,clientY:300+dy});
  game.ids.game.onpointerup({pointerId:1,clientX:180+dx,clientY:300+dy});
  assert.equal(state.ball.last,'player');assert.equal(state.ball.kind,kind);
  assert.match(game.ids.toast.textContent,new RegExp(kind.toUpperCase()));
 }
});
test('lifting a held touch without swiping cancels without hitting or spending a shot',()=>{
 let state;const game=boot(new Map(),false,.5,{create:()=>({resize(){},render(s){state=s},dispose(){}})});
 game.ids.rallyPractice.onclick();game.runUntil(()=>state?.ball.active);
 game.ids.game.onpointerdown({pointerId:1,clientX:180,clientY:300});
 game.runUntil(()=>state.ball.bounces===1&&state.ball.y>=state.player.y-.13);
 game.ids.game.onpointerup({pointerId:1,clientX:180,clientY:300});assert.equal(state.ball.last,'opp');assert.match(game.ids.toast.textContent,/cancelled/);
});

test('an early swipe keeps its shot shape through the contact buffer',()=>{
 let state;const game=boot(new Map(),false,.5,{create:()=>({resize(){},render(s){state=s},contact(){},dispose(){}})});
 game.ids.rallyPractice.onclick();game.runUntil(()=>state?.ball.active);
 game.ids.game.onpointerdown({pointerId:1,clientX:180,clientY:300});
 game.runUntil(()=>state.ball.bounces===1&&state.ball.y>=state.player.y-.21);
 game.ids.game.onpointerup({pointerId:1,clientX:240,clientY:420});
 game.runUntil(()=>state.ball.last==='player');assert.equal(state.ball.kind,'slice');assert.match(game.ids.toast.textContent,/SLICE/);
});
