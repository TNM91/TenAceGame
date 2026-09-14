import * as T from './vendor/three.module.min.js';

// Tint only the teal fabric on torso/sleeve bones. Preserve baked folds,
// normal maps, skin, hair, navy trim and lime piping in the source texture.
export function applySculptKit(model,look){
 if(!/^#[0-9a-f]{6}$/i.test(look.shirt||''))return;
 model.traverse(mesh=>{
  if(!mesh.isSkinnedMesh)return;
  const {skinIndex,skinWeight}=mesh.geometry.attributes,mask=new Float32Array(skinIndex.count);
  const eligible=new Set(mesh.skeleton.bones.map((b,i)=>/^(Spine\d*|LeftShoulder|RightShoulder|LeftArm|RightArm)$/.test(b.name)?i:-1));
  for(let i=0;i<mask.length;i++)for(let j=0;j<4;j++)if(eligible.has(skinIndex.getComponent(i,j)))mask[i]+=skinWeight.getComponent(i,j);
  mesh.geometry.setAttribute('kitMask',new T.BufferAttribute(mask,1));
  const tint=new T.Color(look.shirt);
  mesh.material.onBeforeCompile=shader=>{
   shader.uniforms.kitColor={value:tint};
   shader.vertexShader='attribute float kitMask; varying float vKitMask;\n'+shader.vertexShader;
   shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvKitMask = kitMask;');
   shader.fragmentShader='uniform vec3 kitColor; varying float vKitMask;\n'+shader.fragmentShader;
   shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
    vec3 fabric = diffuseColor.rgb;
    float teal = smoothstep(1.3,1.8,fabric.g/max(fabric.r,0.001)) * smoothstep(0.55,0.75,fabric.b/max(fabric.g,0.001));
    float region = smoothstep(0.6,0.95,vKitMask) * teal;
    float folds = clamp(dot(fabric,vec3(0.2126,0.7152,0.0722))/0.16,0.15,1.6);
    diffuseColor.rgb = mix(fabric,kitColor*folds,region);
   `);
  };
  mesh.material.customProgramCacheKey=()=> 'tenace-sculpt-kit-1';
 });
}
