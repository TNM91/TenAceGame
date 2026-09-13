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
