const {test}=require('node:test'),assert=require('node:assert/strict'),P=require('./physics.js');
function shot(options={}){const b={x:.6,y:.9,last:'player'};P.launch(b,{x:.35,y:.25,time:1.15,...options});return b;}
function finish(b,dt=1/60){const events=[];for(let i=0;i<1000&&b.active;i++)events.push(...P.step(b,dt));return events;}
test('in-bounds shots bounce once then award the hitter on the second bounce',()=>{const e=finish(shot());assert.equal(e[0].type,'bounce');assert.equal(e[1].winner,'player');assert.equal(e[1].reason,'double bounce');});
test('net collision awards receiver before the ball can land',()=>{const b=shot({time:.3,z:.04});const e=finish(b);assert.equal(e[0].reason,'net');assert.equal(e[0].winner,'opp');});
test('wide and long are judged at first bounce, with painted lines in',()=>{for(const [x,y,reason] of [[.12,.25,'wide'],[.4,-.1,'long']])assert.equal(finish(shot({x,y,time:1.3}))[0].reason,reason);assert.equal(finish(shot({x:P.LEFT,y:.25}))[0].type,'bounce');});
test('service boxes enforce diagonal placement and depth',()=>{
 for(const side of ['left','right'])for(const aim of ['wide','body','t']){const target=P.serveTarget(aim,side),b=shot({...target,serve:true,serviceSide:side});assert.equal(finish(b)[0].type,'bounce');}
 const invalid=finish(shot({x:.7,y:.32,serve:true,serviceSide:'left'}))[0];assert.equal(invalid.reason,'service box');assert.equal(invalid.fault,true);
 assert.equal(finish(shot({y:.1,serve:true}))[0].reason,'service box');
});
test('line calls and net events are stable across frame sizes',()=>{for(const opts of [{},{x:.1},{time:.3,z:.04}])assert.deepEqual(finish(shot(opts),1/30).map(e=>[e.type,e.reason,e.winner]),finish(shot(opts),1/144).map(e=>[e.type,e.reason,e.winner]));});
test('returns require a bounce and reset flight state',()=>{const b=shot();assert.equal(P.canHit(b,'opp'),false);while(b.bounces===0&&b.active)P.step(b,1/120);P.step(b,.05);assert.equal(P.canHit(b,'opp'),true);assert.equal(P.canHit(b,'player'),false);b.last='opp';P.launch(b,{x:.4,y:.8,time:1.1});assert.equal(b.bounces,0);assert.equal(b.crossed,false);});

function profile(kind,time=1){const b={x:.5,y:.88,last:'player'};P.launchShot(b,{x:.5,y:.22,z:.06,kind,time});return b;}
function flightStats(kind,time=1){const b=profile(kind,time);let apex=b.z,netHeight=0,bounceHeight=0,bounced=false;for(let i=0;i<3000&&b.active;i++){const before=b.crossed,events=P.step(b,1/1000);if(!before&&b.crossed)netHeight=b.z;if(!bounced)apex=Math.max(apex,b.z);if(events.some(e=>e.type==='bounce'))bounced=true;if(bounced)bounceHeight=Math.max(bounceHeight,b.z);}return {apex,netHeight,bounceHeight};}
test('flat and slice stay low, topspin clears higher, and only lob has a high arc',()=>{
 const flat=flightStats('flat'),slice=flightStats('slice'),top=flightStats('topspin'),lob=flightStats('lob');
 assert.ok(slice.apex<flat.apex&&flat.apex<top.apex&&top.apex<lob.apex);
 assert.ok(flat.apex<.12&&slice.apex<.10&&top.apex<.18&&lob.apex>.4);
 for(const s of [flat,slice,top,lob])assert.ok(s.netHeight>P.NET);
 assert.ok(slice.bounceHeight<flat.bounceHeight&&flat.bounceHeight<top.bounceHeight);
});
test('slower flat shots do not grow into lobs; flight prediction and landing remain exact',()=>{
 for(const kind of ['flat','slice','topspin','lob']){
  assert.ok(Math.abs(flightStats(kind,.65).apex-flightStats(kind,1.5).apex)<.00001);
  const b=profile(kind,.85),p=P.landing(b);assert.ok(Math.abs(p.x-.5)<1e-9&&Math.abs(p.y-.22)<1e-9&&Math.abs(p.time-.85)<1e-9);
  const slow=finish(profile(kind),1/30),fast=finish(profile(kind),1/144);assert.deepEqual(slow.map(e=>[e.type,e.reason]),fast.map(e=>[e.type,e.reason]));
 }
});
