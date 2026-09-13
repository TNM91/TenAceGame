const {test}=require('node:test'),assert=require('node:assert/strict');
test('original characters support every saved hairstyle with finite geometry and motion',async()=>{
 const {createOriginal}=await import('./original-player.js');
 for(const style of ['crop','curls','ponytail','bun','shaved']){
  const rig=createOriginal({style});
  for(const preview of ['ready','run','serve'])for(let i=0;i<20;i++){
   rig.pose({x:.5+i*.001,y:.8,near:true,tx:.6,preview,charge:i/20,serve:preview==='serve'},i/60,1/60,null);rig.root.updateMatrixWorld(true);
   rig.root.traverse(o=>{assert.ok(o.matrixWorld.elements.every(Number.isFinite));if(o.geometry){assert.ok(Array.from(o.geometry.attributes.position.array).every(Number.isFinite));if(o.geometry.attributes.normal)assert.ok(Array.from(o.geometry.attributes.normal.array).every(Number.isFinite));}});
  }
 }
});
test('original racket meets the ball for forehands, backhands and serves on both sides',async()=>{
 const {createOriginal}=await import('./original-player.js'),T=await import('./vendor/three.module.min.js');
 for(const near of [true,false])for(const side of [-1,1])for(const shot of ['topspin','flat','slice','lob','serve']){
  const rig=createOriginal(),point=new T.Vector3(side*.4,shot==='serve'?2.1:1.3,near?5.4:-5.4),event={point,shot,time:1};
  rig.pose({x:.5,y:near?.8:.2,near,tx:.5},1.02,.016,event);rig.root.updateMatrixWorld(true);
  assert.ok(rig.root.getObjectByName('RacketContact').getWorldPosition(new T.Vector3()).distanceTo(point)<.001);
 }
});
test('original follow-through has continuous contact and recovery boundaries',async()=>{
 const {createOriginal}=await import('./original-player.js'),T=await import('./vendor/three.module.min.js');
 for(const shot of ['flat','slice','topspin','lob']){
  const rig=createOriginal(),event={point:new T.Vector3(-.4,1.3,0),time:0,shot};
  function at(t){rig.pose({x:.5,y:.5,tx:.5,near:false},t,0,event);rig.root.updateMatrixWorld(true);return rig.root.getObjectByName('RacketContact').getWorldPosition(new T.Vector3());}
  for(const boundary of [.07,.48,.85])assert.ok(at(boundary-.0001).distanceTo(at(boundary+.0001))<.002,shot+' '+boundary);
 }
});
