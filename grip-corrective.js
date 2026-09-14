import * as T from './vendor/three.module.min.js';
const smooth=(a,b,x)=>{const t=T.MathUtils.clamp((x-a)/(b-a),0,1);return t*t*(3-2*t);};
// A reversible bind-space corrective for this sculpt's open right hand.
// UVs and skin weights stay intact; only the instance's cloned geometry changes.
export function closeRacketHand(model,side='RightHand'){
 model.updateMatrixWorld(true);const hand=model.getObjectByName(side),inverse=hand.matrixWorld.clone().invert();let changed=0;
 model.traverse(mesh=>{
  if(!mesh.isSkinnedMesh)return;const geometry=mesh.geometry,p=geometry.attributes.position,w=geometry.attributes.skinWeight,j=geometry.attributes.skinIndex,handIndices=new Set();hand.traverse(b=>{const i=mesh.skeleton.bones.indexOf(b);if(i>=0)handIndices.add(i);});
  const originalNormals=geometry.attributes.normal.clone(),originalTangents=geometry.attributes.tangent?.clone(),edited=new Set();
  const toHand=inverse.clone().multiply(mesh.matrixWorld),fromHand=toHand.clone().invert();
  for(let i=0;i<p.count;i++){
   let weight=0;for(let k=0;k<4;k++)if(handIndices.has(j.getComponent(i,k)))weight+=w.getComponent(i,k);
   if(weight<.5)continue;const source=new T.Vector3().fromBufferAttribute(p,i),local=source.clone().applyMatrix4(toHand),original=local.clone();
   const mirror=side==='LeftHand'?-1:1;local.x*=mirror;original.copy(local);
   const thumb=smooth(.018,.045,local.z)*(1-smooth(.11,.14,local.y));
   if(local.y>.075){const length=local.y-.075,radius=.027,angle=Math.min(3.8,length/radius);
    const curl=local.clone();curl.y=.075+radius*Math.sin(angle);curl.z+=radius*(1-Math.cos(angle));curl.x=-.013+(curl.x+.013)*(1-.22*smooth(.075,.15,local.y));
    local.lerp(curl,1-thumb);
   }
   const oppose=smooth(.035,.09,original.y)*thumb;
   local.lerp(new T.Vector3(original.x*.45-.014,.08+(original.y-.08)*.3,.04+(original.z-.04)*.25),oppose);
   local.lerp(original,1-smooth(.5,.9,weight));
   if(local.distanceToSquared(original)>1e-10){local.x*=mirror;local.applyMatrix4(fromHand);p.setXYZ(i,local.x,local.y,local.z);changed++;edited.add(i);}
  }
  p.needsUpdate=true;geometry.computeVertexNormals();geometry.computeTangents();for(let i=0;i<p.count;i++)if(!edited.has(i)){geometry.attributes.normal.setXYZ(i,originalNormals.getX(i),originalNormals.getY(i),originalNormals.getZ(i));if(originalTangents)geometry.attributes.tangent.setXYZW(i,originalTangents.getX(i),originalTangents.getY(i),originalTangents.getZ(i),originalTangents.getW(i));}geometry.computeBoundingBox();geometry.computeBoundingSphere();
 });return changed;
}
export const gripOffset=new T.Vector3(-.075,-.013,.027);
export const handGripRotation=new T.Quaternion().setFromAxisAngle(new T.Vector3(0,0,1),Math.PI/2);

// Blend the supporting hand closed only while it is holding the handle.
// The open source pose remains available for the ball toss and free-arm swings.
export function createSupportGrip(model){
 const saved=[];model.traverse(mesh=>{if(mesh.isSkinnedMesh)saved.push({mesh,position:mesh.geometry.attributes.position.clone(),normal:mesh.geometry.attributes.normal.clone(),tangent:mesh.geometry.attributes.tangent?.clone()});});
 closeRacketHand(model,'LeftHand');
 for(const entry of saved){const g=entry.mesh.geometry;g.morphAttributes.position=[g.attributes.position.clone()];g.morphAttributes.normal=[g.attributes.normal.clone()];g.morphAttributes.position[0].name='SupportGrip';g.setAttribute('position',entry.position);g.setAttribute('normal',entry.normal);if(entry.tangent)g.setAttribute('tangent',entry.tangent);g.morphTargetsRelative=false;entry.mesh.updateMorphTargets();entry.mesh.morphTargetInfluences[0]=0;g.computeBoundingBox();g.computeBoundingSphere();}
 return weight=>{for(const {mesh} of saved)mesh.morphTargetInfluences[0]=T.MathUtils.clamp(weight,0,1);};
}
