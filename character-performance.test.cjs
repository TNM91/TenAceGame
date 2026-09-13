const {test}=require('node:test'),assert=require('node:assert/strict');
test('loaded swing transfers weight without moving either planted foot',async()=>{
 const {createOriginal}=await import('./original-player.js'),T=await import('./vendor/three.module.min.js');
 for(const near of [false,true]){
  const rig=createOriginal(),p={x:.5,y:.5,near,charge:1},event={point:new T.Vector3(-.4,1.3,0),time:1,shot:'topspin'};
  rig.pose(p,.9,.016,null);rig.root.updateMatrixWorld(true);
  const feet=['LeftFoot','RightFoot'].map(name=>rig.root.getObjectByName(name).getWorldPosition(new T.Vector3()));
  for(const age of [0,.07,.2,.48,.84,1]){
   rig.pose({...p,charge:0},1+age,.016,event);rig.root.updateMatrixWorld(true);
   ['LeftFoot','RightFoot'].forEach((name,i)=>assert.ok(rig.root.getObjectByName(name).getWorldPosition(new T.Vector3()).distanceTo(feet[i])<1e-6));
  }
 }
});
test('run cycle keeps a support foot down and celebration raises the free hand',async()=>{
 const {createOriginal}=await import('./original-player.js'),T=await import('./vendor/three.module.min.js'),rig=createOriginal();
 for(let i=0;i<120;i++){
  rig.pose({x:.5,y:.5,preview:'run'},i/60,1/60,null);
  const feet=['LeftFoot','RightFoot'].map(name=>rig.root.getObjectByName(name).position.y);
  assert.ok(feet.every(y=>y>=.025-1e-6));assert.ok(Math.min(...feet)<=.025+1e-6,'one foot supports the stride');
 }
 rig.pose({x:.5,y:.5,celebrate:true},3,.016,null);
 rig.pose({x:.5,y:.5,celebrate:true},3.4,.016,null);
 assert.ok(rig.root.getObjectByName('SupportHand').position.y>1.7);
 rig.pose({x:.5,y:.5,celebrate:false},4,.016,null);
 assert.ok(rig.root.getObjectByName('SupportHand').position.y<1.4);
});

test('a supporting foot stays at the same court position while the player travels',async()=>{
 const {createOriginal}=await import('./original-player.js'),T=await import('./vendor/three.module.min.js');
 for(const near of [false,true]){
  const rig=createOriginal();let initial;
  for(let i=0;i<10;i++){
   rig.pose({x:.5+i*.001,y:.5,near},i/60,1/60,null);rig.root.updateMatrixWorld(true);
   const foot=rig.root.getObjectByName('RightFoot').getWorldPosition(new T.Vector3());
   if(i===1)initial=foot;
   if(i>1)assert.ok(foot.distanceTo(initial)<1e-6,'planted foot must not skate across the court');
  }
 }
});
