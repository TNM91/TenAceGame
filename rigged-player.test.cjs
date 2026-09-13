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
 source={character:await parse('assets/rigged/tenace-athlete.glb'),animation:await parse('assets/rigged/locomotion.glb')};return source;
}
test('delivered character is an authored skinned asset with embedded textures and normalized weights',()=>{
 const {json:g,binary}=unpack('assets/rigged/tenace-athlete.glb');assert.ok(g.skins[0].joints.length>50);assert.ok(g.images.length>=3);assert.equal(g.buffers[0].uri,undefined);
 assert.ok(g.materials.some(m=>m.name==='TenAce_Jersey'));assert.ok(g.meshes.some(m=>m.name==='TenAce_AuthoredHair'));
 const seen=new Set();for(const mesh of g.meshes)for(const p of mesh.primitives){const ai=p.attributes.WEIGHTS_0;if(ai===undefined||seen.has(ai))continue;seen.add(ai);const a=g.accessors[ai],v=g.bufferViews[a.bufferView],start=(v.byteOffset||0)+(a.byteOffset||0);for(let i=0;i<a.count;i++){const offset=start+i*(v.byteStride||16);let sum=0;for(let k=0;k<4;k++)sum+=binary.readFloatLE(offset+k*4);assert.ok(Math.abs(sum-1)<.002);}}
});
test('imported locomotion and tennis arm poses keep the skinned mesh finite',async()=>{
 const {createRig}=await import('./rigged-player.js'),src=await assets(),rig=createRig({shirt:'#f37968'},src);
 assert.ok(rig.bones.hand_r&&rig.bones.hand_l);let count=0;rig.root.traverse(o=>{if(o.isSkinnedMesh)count++});assert.ok(count>=4);
 for(const mode of ['ready','run','serve'])for(let i=0;i<45;i++){rig.pose({x:.5,y:.5,tx:.5,near:false,ready:true,preview:mode,serve:mode==='serve'},i/60,1/60,null);rig.root.updateMatrixWorld(true);rig.root.traverse(o=>assert.ok(o.matrixWorld.elements.every(Number.isFinite)));}
 assert.ok(src.animation.animations.some(a=>a.name==='Jog_Fwd_Loop'));rig.dispose();
});
test('two rigged players own independent skeletons and kit materials',async()=>{
 const {createRig}=await import('./rigged-player.js'),src=await assets(),a=createRig({shirt:'#f37968'},src),b=createRig({shirt:'#163b55'},src);
 assert.notEqual(a.bones.hand_r,b.bones.hand_r);let ma,mb;a.root.traverse(o=>{if(o.material?.name==='TenAce_Jersey')ma=o.material});b.root.traverse(o=>{if(o.material?.name==='TenAce_Jersey')mb=o.material});assert.notEqual(ma,mb);assert.notEqual(ma.color.getHex(),mb.color.getHex());a.dispose();b.dispose();
});

test('garment shells deform with the skeleton and retain finite vertices through both swings',async()=>{
 const {createRig}=await import('./rigged-player.js'),T=await import('./vendor/three.module.min.js'),src=await assets(),rig=createRig({},src);
 const garments=[];rig.root.traverse(o=>{if(o.isSkinnedMesh&&/ShirtShell|ShortsShell|Sleeve/.test(o.name))garments.push(o)});assert.ok(garments.length>=5);
 for(const x of [-.42,.42])for(const shot of ['topspin','slice','flat','lob','serve'])for(let frame=0;frame<55;frame++){
  const event={time:0,point:new T.Vector3(x,1.38,.3),shot};rig.pose({x:.5,y:.5,tx:.5,near:false},frame/60,1/60,event);rig.root.updateMatrixWorld(true);
  for(const mesh of garments){mesh.skeleton.update();const positions=mesh.geometry.attributes.position;for(let n=0;n<positions.count;n+=17){const p=new T.Vector3().fromBufferAttribute(positions,n);mesh.applyBoneTransform(n,p);assert.ok(p.toArray().every(Number.isFinite));assert.ok(p.length()<3,'garment vertex escaped the character');}}
 }
 rig.dispose();
});

test('loaded torso continues through contact and recovers without a snap',async()=>{
 const {createRig}=await import('./rigged-player.js'),T=await import('./vendor/three.module.min.js'),rig=createRig({},await assets());
 const p={x:.5,y:.5,tx:.5,near:false,charge:1};rig.pose(p,0,0,null);const loaded=rig.bones.spine_03.getWorldQuaternion(new T.Quaternion());
 const event={time:0,point:new T.Vector3(-.42,1.38,.3),shot:'topspin'};rig.pose({...p,charge:0},0,0,event);assert.ok(loaded.angleTo(rig.bones.spine_03.getWorldQuaternion(new T.Quaternion()))<.01);
 rig.pose({...p,charge:0},.8499,0,event);const before=rig.bones.spine_03.getWorldQuaternion(new T.Quaternion());rig.pose({...p,charge:0},.85,0,event);assert.ok(before.angleTo(rig.bones.spine_03.getWorldQuaternion(new T.Quaternion()))<.01);
 rig.dispose();
});
