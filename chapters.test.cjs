const {test}=require('node:test'),assert=require('node:assert/strict'),P=require('./progression.js'),R=require('./rivals.js');
test('first wins unlock chapters and bonuses exactly once',()=>{
 const save=P.fresh();assert.equal(P.unlocked(save,'mira'),false);
 assert.equal(P.rewardMatch(save,true,5,'mira').earned,0);assert.equal(save.matches,0);
 assert.deepEqual(P.rewardMatch(save,true,5,'jax'),{earned:200,bonus:80,first:true,technique:0});
 assert.equal(P.unlocked(save,'mira'),true);
 assert.equal(P.rewardMatch(save,true,5,'jax').earned,120);
 assert.equal(P.rewardMatch(save,false,5,'mira').earned,60);
 assert.deepEqual(P.rewardMatch(save,true,5,'mira'),{earned:220,bonus:100,first:true,technique:0});
 assert.equal(P.rewardMatch(save,true,5,'mira').earned,120);
 save.character.shirt='#edc76d';assert.deepEqual(P.normalize(JSON.parse(JSON.stringify(save))),save);
});
test('legacy wins unlock Mira without awarding retroactive XP; gold stays gated',()=>{
 const legacy={version:1,xp:120,matches:1,wins:1};const save=P.normalize(legacy);
 assert.equal(save.xp,120);assert.equal(P.unlocked(save,'mira'),true);
 assert.equal(P.rewardMatch(save,true,1,'jax').bonus,0);
 const fresh=P.fresh();fresh.character.shirt='#edc76d';assert.notEqual(P.normalize(fresh).character.shirt,'#edc76d');
 assert.equal(P.unlocked(save,'unknown'),false);
});
test('Mira has a distinct defensive profile',()=>{assert.ok(R.mira.movement>R.jax.movement);assert.ok(R.mira.error<R.jax.error);assert.ok(R.mira.pace<R.jax.pace);assert.notEqual(R.mira.theme,R.jax.theme);});
