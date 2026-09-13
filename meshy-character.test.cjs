const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
function unpack(path){const bytes=fs.readFileSync(path);assert.equal(bytes.readUInt32LE(0),0x46546c67);assert.equal(bytes.readUInt32LE(8),bytes.length);const n=bytes.readUInt32LE(12);return {json:JSON.parse(bytes.subarray(20,20+n)),binary:bytes.subarray(28+n)};}
let source;
async function assets(){
 if(source)return source;
 const {GLTFLoader}=await import('./vendor/GLTFLoader.js');
 global.ProgressEvent=class{constructor(type,fields){this.type=type;Object.assign(this,fields)}};
 async function parse(path){const {json:g,binary}=unpack(path);g.buffers[0].uri='data:application/octet-stream;base64,'+binary.toString('base64');
  // Exercise actual skinning, geometry and clips in Node; browsers verify the textures.
  if(g.materials)g.materials=g.materials.map(m=>({name:m.name,pbrMetallicRoughness:{baseColorFactor:m.pbrMetallicRoughness?.baseColorFactor||[1,1,1,1]}}));
  delete g.images;delete g.textures;delete g.samplers;return new GLTFLoader().parseAsync(JSON.stringify(g),'');
 }
 source={character:await parse('assets/meshy/player.glb'),motion:await parse('assets/meshy/player-running.glb')};return source;
}
test('new sculpt has embedded textures and valid normalized skin weights',async()=>{
 const src=await assets();let count=0;
 src.character.scene.traverse(o=>{if(!o.isSkinnedMesh)return;count++;assert.equal(o.skeleton.bones.length,28);
 const w=o.geometry.attributes.skinWeight,j=o.geometry.attributes.skinIndex;
 for(let i=0;i<w.count;i++){let sum=0;for(let k=0;k<4;k++){const weight=w.getComponent(i,k);assert.ok(Number.isFinite(weight)&&weight>=0);sum+=weight;assert.ok(j.getComponent(i,k)<28);}assert.ok(Math.abs(sum-1)<.002);}});
 assert.equal(count,1);const {json:g}=unpack('assets/meshy/player.glb');assert.equal(g.images.length,3);assert.ok(g.images.every(i=>i.bufferView!==undefined));
});
test('running deforms the real mesh without drifting and restores the reference pose',async()=>{
 const {createCharacterCandidate}=await import('./meshy-character.js'),T=await import('./vendor/three.module.min.js'),rig=createCharacterCandidate(await assets());
 rig.setMode('stand');const leg=rig.root.getObjectByName('LeftLeg'),rest=leg.quaternion.clone(),hips=rig.root.getObjectByName('Hips'),origin=hips.position.clone();rig.setMode('run');let changed=false;
 for(let i=0;i<120;i++){rig.update(1/60);changed ||= leg.quaternion.angleTo(rest)>.1;assert.equal(hips.position.x,origin.x);assert.equal(hips.position.z,origin.z);
 rig.root.traverse(o=>{assert.ok(o.matrixWorld.elements.every(Number.isFinite));if(o.isSkinnedMesh){o.skeleton.update();for(let n=0;n<o.geometry.attributes.position.count;n+=31){const p=new T.Vector3().fromBufferAttribute(o.geometry.attributes.position,n);o.applyBoneTransform(n,p);assert.ok(p.toArray().every(Number.isFinite));assert.ok(p.length()<4,'vertex escaped the body');}}});}
 assert.ok(changed);const paused=leg.quaternion.clone();rig.update(0);assert.deepEqual(leg.quaternion.toArray(),paused.toArray());rig.setMode('stand');assert.deepEqual(leg.quaternion.toArray(),rest.toArray());rig.dispose();
});

test('tennis strokes keep the racket attached and skinning finite on both court sides',async()=>{
 const {createTennisPlayer}=await import('./meshy-tennis.js'),T=await import('./vendor/three.module.min.js'),rig=createTennisPlayer({},await assets());
 for(const near of [true,false])for(const side of [-1,1])for(const shot of ['topspin','slice','flat','serve']){
  const p={x:.5,y:.5,tx:.5,near},event={time:0,shot,point:new T.Vector3(side*.42,shot==='serve'?2.05:1.38,near?-.3:.3)};
  for(let i=0;i<60;i++){rig.pose(p,i/60,1/60,event);if(i===0)assert.ok(rig.root.getObjectByName('RacketContact').getWorldPosition(new T.Vector3()).distanceTo(event.point)<.025,'racket missed '+shot+' '+near+' '+side);const wrist=rig.bones.RightHand.getWorldPosition(new T.Vector3()),grip=rig.root.getObjectByName('Racket').getWorldPosition(new T.Vector3());assert.ok(wrist.distanceTo(grip)<1e-5);
   rig.root.traverse(o=>{assert.ok(o.matrixWorld.elements.every(Number.isFinite));if(o.isSkinnedMesh){o.skeleton.update();for(let j=0;j<o.geometry.attributes.position.count;j+=73){const v=new T.Vector3().fromBufferAttribute(o.geometry.attributes.position,j);o.applyBoneTransform(j,v);assert.ok(v.toArray().every(Number.isFinite));assert.ok(v.length()<4);}}});
  }
 }
 rig.dispose();
});

test('lateral support foot remains planted while the body moves',async()=>{
 const {createTennisPlayer}=await import('./meshy-tennis.js'),T=await import('./vendor/three.module.min.js'),rig=createTennisPlayer({},await assets());
 for(const near of [false,true]){
  rig.pose({x:.5,y:.5,tx:.55,near},0,1/60,null);
  const before=rig.bones.RightFoot.getWorldPosition(new T.Vector3());
  for(let i=1;i<=8;i++)rig.pose({x:.5+i*.001,y:.5,tx:.55,near},i/60,1/60,null);
  assert.ok(before.distanceTo(rig.bones.RightFoot.getWorldPosition(new T.Vector3()))<.003,'support foot slid '+near+' '+before.distanceTo(rig.bones.RightFoot.getWorldPosition(new T.Vector3())));
 }
 rig.dispose();
});
test('swing recovery is continuous and paused poses remain stable',async()=>{
 const {createTennisPlayer}=await import('./meshy-tennis.js'),T=await import('./vendor/three.module.min.js'),rig=createTennisPlayer({},await assets()),p={x:.5,y:.5,tx:.5,near:false};
 for(const shot of ['topspin','slice','flat','serve']){
  const event={time:0,shot,point:new T.Vector3(-.42,shot==='serve'?2.05:1.38,.3)};
  for(const boundary of [.065,.48,.85]){
   rig.pose(p,boundary-.0001,0,event);const before=rig.root.getObjectByName('RacketContact').getWorldPosition(new T.Vector3());
   rig.pose(p,boundary+.0001,0,event);assert.ok(before.distanceTo(rig.root.getObjectByName('RacketContact').getWorldPosition(new T.Vector3()))<.003);
  }
  rig.pose(p,.3,0,event);const before=rig.bones.RightHand.matrixWorld.clone();rig.pose(p,.3,0,event);assert.deepEqual(rig.bones.RightHand.matrixWorld.elements,before.elements);
 }
 rig.dispose();
});

test('serve windup meets the same overhead contact used at ball launch',async()=>{
 const {createTennisPlayer}=await import('./meshy-tennis.js'),T=await import('./vendor/three.module.min.js'),rig=createTennisPlayer({},await assets()),p={x:.62,y:.86,tx:.62,near:true};
 for(let i=0;i<=60;i++)rig.pose({...p,serve:true,serveProgress:i/60},i/100,1/100,null);
 const before=rig.root.getObjectByName('RacketContact').getWorldPosition(new T.Vector3());
 const event={time:.6,shot:'serve',point:new T.Vector3((p.x+.025-.5)*10,.158*14,(p.y-.015-.5)*18)};
 rig.pose(p,.6,0,event);const contact=rig.root.getObjectByName('RacketContact').getWorldPosition(new T.Vector3());
 assert.ok(contact.distanceTo(event.point)<.025);assert.ok(before.distanceTo(contact)<.005,'serve snapped at release');rig.dispose();
});
