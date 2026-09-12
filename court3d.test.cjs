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
