const {test} = require('node:test');
const assert = require('node:assert/strict');
const {inspectCharacter} = require('./inspect-character.cjs');
function glb(document) {
  const json = JSON.stringify({asset:{version:'2.0'},...document});
  const text = Buffer.from(json + ' '.repeat((4-Buffer.byteLength(json)%4)%4));
  const header = Buffer.alloc(20);header.write('glTF');header.writeUInt32LE(2,4);
  header.writeUInt32LE(20+text.length,8);header.writeUInt32LE(text.length,12);header.writeUInt32LE(0x4e4f534a,16);
  return Buffer.concat([header,text]);
}
test('preflight rejects corrupt, truncated and unsupported GLB containers',()=>{
  assert.throws(()=>inspectCharacter(Buffer.from('not a model')));
  const data=glb({});assert.throws(()=>inspectCharacter(data.subarray(0,data.length-1)));
  const wrong=Buffer.from(data);wrong.writeUInt32LE(1,4);assert.throws(()=>inspectCharacter(wrong));
  const chunk=Buffer.from(data);chunk.writeUInt32LE(99999,12);assert.throws(()=>inspectCharacter(chunk));
});
test('a static textured mesh is never reported as a rigged character',()=>{
  const report=inspectCharacter(glb({nodes:[{mesh:0}],meshes:[{primitives:[{attributes:{POSITION:0}}]}],images:[{uri:'texture.png'}]}));
  assert.equal(report.status,'needs-asset-work');assert.equal(report.skinnedNodes,0);
  assert.ok(report.issues.some(s=>s.includes('External')));assert.ok(report.issues.some(s=>s.includes('No skinned')));
});
test('a bound skeleton without weights fails and valid metadata still requires manual review',()=>{
  const model={nodes:[{mesh:0,skin:0},{name:'hips'}],skins:[{joints:[1]}],meshes:[{primitives:[{attributes:{POSITION:0}}]}]};
  assert.ok(inspectCharacter(glb(model)).issues.some(s=>s.includes('Missing joint')));
  Object.assign(model.meshes[0].primitives[0].attributes,{JOINTS_0:1,WEIGHTS_0:2});
  const report=inspectCharacter(glb(model));assert.equal(report.status,'ready-for-manual-inspection');
  assert.ok(report.review.some(s=>s.includes('No embedded animation')));
  assert.ok(report.review.some(s=>s.includes('fused')));
});
