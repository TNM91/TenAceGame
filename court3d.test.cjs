const {test}=require('node:test');
const assert=require('node:assert/strict');
const Character=require('./character.js');
// Real Three.js scene graphs; a small canvas adapter provides only label textures.
global.document={createElement:()=>({width:0,height:0,getContext:()=>({fillRect(){},fillText(){}})})};
test('3D projection shares court bounds and net height with the physics model',async()=>{
 const {world}=await import('./court3d.js');
 assert.deepEqual(world(0,0,0).toArray(),[-5,0,-9]);
 assert.deepEqual(world(1,1,0).toArray(),[5,0,9]);
 assert.equal(world(.5,.5,.065).y,.91);
});
test('customizable 3D athletes support all silhouettes and animated shot states',async()=>{
 const {athlete}=await import('./court3d.js');
 for(const style of ['crop','curls','bun','ponytail','shaved'])for(const frame of ['classic','power','control']){
  const rig=athlete({...Character.fresh(),style,frame});
  for(const shot of ['flat','slice','topspin','lob'])for(const swing of [0,.25,.5,.9]){
   rig.pose({x:.6,y:.86,tx:.4,near:true,swing,shot},1,.016,null);rig.root.updateMatrixWorld(true);
   rig.root.traverse(o=>assert.ok(o.matrixWorld.elements.every(Number.isFinite),'valid transform for '+style+' '+shot));
  }
 }
});
test('3D racket head reaches the actual contact point for forehand and backhand',async()=>{
 const {athlete,world}=await import('./court3d.js');
 for(const near of [true,false])for(const x of [.4,.6]){
  const rig=athlete(Character.fresh()),y=near?.84:.16,point=world(x,y,.10),event={point,time:2};
  rig.pose({x:.5,y,tx:.5,near,swing:1,shot:'topspin'},2,.016,event);rig.root.updateMatrixWorld(true);
  let rim;rig.root.traverse(o=>{if(o.geometry?.type==='TorusGeometry')rim=o});
  const actual=point.clone();rim.getWorldPosition(actual);assert.ok(actual.distanceTo(point)<1e-6,'racket head and ball share contact position');
 }
});

test('graphics presets change the real renderer resolution and shadow state without replacing the scene',async()=>{
 global.devicePixelRatio=3;
 const {create}=await import('./court3d.js');let ratio,disposed=false;
 const renderer={shadowMap:{},setPixelRatio(v){ratio=v},setSize(){},dispose(){disposed=true}};
 const canvas={addEventListener(){},removeEventListener(){}};
 const court=create(canvas,()=>{},()=>renderer);court.resize(390,500);
 court.setQuality('low');assert.equal(ratio,1);assert.equal(renderer.shadowMap.enabled,false);
 court.setQuality('high');assert.equal(ratio,1.5);assert.equal(renderer.shadowMap.enabled,true);
 court.dispose();assert.equal(disposed,true);delete global.devicePixelRatio;
});

test('authored body contours have finite positions and normals',async()=>{
 const {athlete}=await import('./court3d.js');const rig=athlete(Character.fresh());let contours=0;
 rig.root.traverse(o=>{if(o.geometry?.type==='BufferGeometry'&&o.isMesh){contours++;assert.ok(Array.from(o.geometry.attributes.position.array).every(Number.isFinite));assert.ok(Array.from(o.geometry.attributes.normal.array).every(Number.isFinite));}});
 assert.ok(contours>=10,'head, torso and limbs use body contours');
});
test('racket follow-through does not snap when contact lock ends or recovery finishes',async()=>{
 const {athlete,world}=await import('./court3d.js');
 for(const shot of ['flat','topspin','slice','lob']){
  const rig=athlete(Character.fresh()),event={point:world(.55,.84,.10),time:2,shot};
  function at(age){rig.pose({x:.5,y:.84,tx:.5,near:true,swing:Math.max(0,1-age*3),shot,ready:true},2+age,.001,event);rig.root.updateMatrixWorld(true);let rim;rig.root.traverse(o=>{if(o.geometry?.type==='TorusGeometry')rim=o});return rim.getWorldPosition(world(0,0));}
  for(const boundary of [.1,.48,.8])assert.ok(at(boundary-.0001).distanceTo(at(boundary+.0001))<.02,shot+' has a continuous racket path');
 }
});
