const {test}=require('node:test'),assert=require('node:assert/strict'),S=require('./technique.js'),P=require('./progression.js');
const base={dx:.3,shot:'topspin',error:.02,timing:.05,reach:.1,stamina:90,power:1,control:0};
test('clean contacts retain pace and intent; pressured safe shots get weaker rather than random outs',()=>{
 const clean=S.resolve(base),weak=S.resolve({...base,error:.18,reach:.22,stamina:15});
 assert.ok(clean.speed>weak.speed);assert.ok(clean.x>weak.x);assert.equal(clean.clean,true);
 for(const shot of ['topspin','slice','lob']){const safe=S.resolve({...base,shot,error:.3,reach:.23,stamina:14});assert.ok(safe.x>=.18&&safe.x<=.82&&safe.y<.5);assert.equal(safe.miss,false);}
 assert.deepEqual(S.resolve(base),clean);
});
test('flat shots punish forced timing but a clean contact can overcome pressure',()=>{
 assert.equal(S.resolve({...base,shot:'flat',error:.22,reach:.23,stamina:14}).miss,true);
 assert.equal(S.resolve({...base,shot:'flat',error:.01,reach:.23,stamina:14}).miss,false);
});
test('specializations require level three, persist safely, and change their advertised effects',()=>{
 const s=P.fresh();assert.equal(P.choosePath(s,'striker'),false);s.xp=200;const baseline=P.effects(s);
 P.choosePath(s,'striker');assert.ok(P.effects(s).power>baseline.power);
 P.choosePath(s,'tactician');assert.ok(P.effects(s).timing>baseline.timing);
 P.choosePath(s,'retriever');assert.ok(P.effects(s).movement>baseline.movement);assert.equal(P.effects(s).staminaCost,.85);
 assert.equal(P.normalize(s).path,'retriever');assert.equal(P.normalize({...s,xp:0}).path,'balanced');assert.equal(P.choosePath(s,'unknown'),false);
});
test('technique rewards are capped and stack with first-win rewards without a second payout',()=>{
 const s=P.fresh(),first=P.rewardMatch(s,true,9,'jax',100);assert.equal(first.technique,45);assert.equal(first.earned,245);
 const rematch=P.rewardMatch(s,false,2,'jax',2);assert.equal(rematch.technique,6);assert.equal(rematch.earned,66);
 assert.equal(P.rewardMatch(P.fresh(),true,20,'mira',50).earned,0);
});
