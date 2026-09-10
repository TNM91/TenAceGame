const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
test('sound is opt-in, persists mute state, and never plays while muted',()=>{
 let starts=0;const saved=new Map(),param={setValueAtTime(){},exponentialRampToValueAtTime(){}};
 class Audio{constructor(){this.state='running';this.currentTime=0;}resume(){return Promise.resolve();}createOscillator(){return {connect(){},frequency:param,start(){starts++},stop(){}};}createGain(){return {connect(){},gain:param};}}
 const window={AudioContext:Audio};vm.runInNewContext(fs.readFileSync('sound.js','utf8'),{window,localStorage:{getItem:k=>saved.get(k),setItem:(k,v)=>saved.set(k,v)}});
 const sound=window.TenAceSound;sound.play('hit');assert.equal(starts,0);sound.set(true);sound.play('hit');assert.equal(starts,1);sound.set(false);sound.play('bounce');assert.equal(starts,1);assert.equal(saved.get('tenace.sound'),'off');
});
