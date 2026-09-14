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

test('grip corrective closes all finger-weight regions without changing the source sculpt',async()=>{
 const {createTennisPlayer}=await import('./meshy-tennis.js'),T=await import('./vendor/three.module.min.js'),src=await assets();let original;src.character.scene.traverse(o=>{if(o.isSkinnedMesh)original=o;});const before=original.geometry.attributes.position.array.slice(),normals=original.geometry.attributes.normal.array.slice();
 const rig=createTennisPlayer({},src);let sculpt;rig.root.traverse(o=>{if(o.isSkinnedMesh)sculpt=o;});assert.notEqual(sculpt.geometry,original.geometry);assert.deepEqual(original.geometry.attributes.position.array,before);
 let changed=0;for(let i=0;i<before.length;i+=3){const p=sculpt.geometry.attributes.position.array;if(p[i]!==before[i]||p[i+1]!==before[i+1]||p[i+2]!==before[i+2])changed++;else assert.deepEqual(Array.from(sculpt.geometry.attributes.normal.array.slice(i,i+3)),Array.from(normals.slice(i,i+3)));}
 assert.ok(changed>500&&changed<2000,'corrective must be confined to the full hand');
 const inverse=rig.bones.RightHand.matrixWorld.clone().invert(),indices=new Set();rig.bones.RightHand.traverse(b=>{const i=sculpt.skeleton.bones.indexOf(b);if(i>=0)indices.add(i);});
 for(let i=0;i<sculpt.geometry.attributes.position.count;i++){let weight=0;for(let k=0;k<4;k++)if(indices.has(sculpt.geometry.attributes.skinIndex.getComponent(i,k)))weight+=sculpt.geometry.attributes.skinWeight.getComponent(i,k);if(weight>.95){const point=new T.Vector3().fromBufferAttribute(sculpt.geometry.attributes.position,i).applyMatrix4(sculpt.matrixWorld).applyMatrix4(inverse);assert.ok(point.y<.14,'a fingertip was left extended');}}
 rig.dispose();
});

test('sculpt kits isolate color uniforms and masks while racket frames retain contact',async()=>{
 const {createTennisPlayer}=await import('./meshy-tennis.js'),T=await import('./vendor/three.module.min.js'),src=await assets();
 const rigs=['classic','power','control'].map((frame,i)=>createTennisPlayer({shirt:['#f37968','#778dff','#f4eee1'][i],frame},src));
 const shaders=[];
 for(const rig of rigs){let mesh;rig.root.traverse(o=>{if(o.isSkinnedMesh)mesh=o;});const mask=mesh.geometry.attributes.kitMask.array;assert.ok(mask.some(v=>v>.95));assert.ok(mask.some(v=>v===0));assert.ok([...mask].every(v=>Number.isFinite(v)&&v>=0&&v<1.002));
 const shader={uniforms:{},vertexShader:'#include <begin_vertex>',fragmentShader:'#include <map_fragment>'};mesh.material.onBeforeCompile(shader);shaders.push(shader);
 const point=new T.Vector3(-.42,1.38,.3);rig.pose({x:.5,y:.5,near:false},0,0,{time:0,shot:'flat',point});assert.ok(rig.root.getObjectByName('RacketContact').getWorldPosition(new T.Vector3()).distanceTo(point)<.025);rig.dispose();}
 assert.notEqual(shaders[0].uniforms.kitColor.value,shaders[1].uniforms.kitColor.value);assert.notEqual(shaders[0].uniforms.kitColor.value.getHex(),shaders[1].uniforms.kitColor.value.getHex());
 src.character.scene.traverse(o=>{if(o.isMesh)assert.equal(o.geometry.attributes.kitMask,undefined);});
});

test('incoming ball selects a smooth forehand or backhand preparation on both sides',async()=>{
 const {createTennisPlayer}=await import('./meshy-tennis.js'),T=await import('./vendor/three.module.min.js');
 for(const near of [false,true]){
 const rig=createTennisPlayer({},await assets()),p={x:.5,y:.5,near,ready:true,charge:1};
 const wrist=()=>rig.root.worldToLocal(rig.bones.RightHand.getWorldPosition(new T.Vector3()));
 const frontX=near?.7:.3,backX=near?.3:.7;
 for(let i=0;i<50;i++)rig.pose({...p,incomingX:frontX},i/60,1/60,null);
 const fore=wrist();rig.pose({...p,incomingX:backX},1,1/60,null);assert.ok(wrist().distanceTo(fore)<.22,'preparation snaps on direction change');
 for(let i=0;i<50;i++)rig.pose({...p,incomingX:backX},1+i/60,1/60,null);
 const back=wrist();assert.ok(back.x-fore.x>.45,'backhand never crosses the body');
 rig.pose({...p,incomingX:frontX},2,0,null);assert.ok(wrist().distanceTo(back)<1e-6,'paused preparation moved');rig.dispose();
 }
});

for(const file of ['player-serve.glb','player-serve-v2.glb','player-footwork.glb'])test(file+' binds to the sculpt and supports deterministic paused review',async t=>{
 const {GLTFLoader}=await import('./vendor/GLTFLoader.js'),{createCharacterCandidate}=await import('./meshy-character.js'),T=await import('./vendor/three.module.min.js');
 const bytes=fs.readFileSync('assets/meshy/'+file),motion=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
 const src=await assets(),rig=createCharacterCandidate({character:src.character,motion}),hips=rig.root.getObjectByName('Hips'),hand=rig.root.getObjectByName('RightHand'),head=rig.root.getObjectByName('Head');
 assert.ok(rig.duration>2&&rig.duration<5);for(const track of motion.animations[0].tracks)assert.ok(rig.root.getObjectByName(track.name.split('.')[0]),'missing animated joint');
 rig.sample(0);const origin=hips.position.clone(),start=hips.quaternion.clone();let maxTurn=0,maxHandAboveHead=-Infinity;
 for(let i=0;i<90;i++){rig.sample(rig.duration*i/90);maxTurn=Math.max(maxTurn,start.angleTo(hips.quaternion));maxHandAboveHead=Math.max(maxHandAboveHead,hand.getWorldPosition(new T.Vector3()).y-head.getWorldPosition(new T.Vector3()).y);assert.equal(hips.position.x,origin.x);assert.equal(hips.position.z,origin.z);rig.root.traverse(o=>assert.ok(o.matrixWorld.elements.every(Number.isFinite)));}
 rig.sample(.8);const pose=hand.matrixWorld.clone();rig.sample(.8);assert.deepEqual(hand.matrixWorld.elements,pose.elements);rig.dispose();
 t.diagnostic(JSON.stringify({duration:rig.duration,maxHipRotationDegrees:maxTurn*180/Math.PI,maxHandAboveHead}));
});

test('backhand top hand tracks the racket through contact and early follow-through',async()=>{
 const {createTennisPlayer}=await import('./meshy-tennis.js'),T=await import('./vendor/three.module.min.js');
 for(const near of [false,true]){const rig=createTennisPlayer({},await assets()),p={x:.5,y:.5,near};
 const event={time:0,shot:'topspin',point:new T.Vector3(near?-.42:.42,1.38,near?-.3:.3)};
 for(let i=0;i<=28;i++){rig.pose(p,i/60,1/60,event);const actual=rig.bones.LeftHand.getWorldPosition(new T.Vector3()),target=rig.root.getObjectByName('SupportWristTarget').getWorldPosition(new T.Vector3());assert.ok(actual.distanceTo(target)<.025,'top hand missed grip at '+i+' by '+actual.distanceTo(target));}
 rig.pose(p,.8499,0,event);const before=rig.bones.LeftHand.getWorldPosition(new T.Vector3());rig.pose(p,.8501,0,event);assert.ok(before.distanceTo(rig.bones.LeftHand.getWorldPosition(new T.Vector3()))<.003,'support hand snapped at recovery');rig.dispose();}
});
