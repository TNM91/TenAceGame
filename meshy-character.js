import * as T from './vendor/three.module.min.js';
import {GLTFLoader} from './vendor/GLTFLoader.js';
import {clone} from './vendor/SkeletonUtils.js';

export async function loadCharacterCandidate(){
 const loader=new GLTFLoader();
 const [character,motion]=await Promise.all([loader.loadAsync('./assets/meshy/player.glb'),loader.loadAsync('./assets/meshy/player-running.glb')]);
 return {character,motion};
}

export function createCharacterCandidate(source){
 const root=clone(source.character.scene),mixer=new T.AnimationMixer(root),bones=[];
 root.traverse(o=>{if(o.isBone)bones.push({bone:o,position:o.position.clone(),quaternion:o.quaternion.clone(),scale:o.scale.clone()});if(o.isMesh){o.castShadow=o.receiveShadow=true;o.frustumCulled=false;}});
 const clip=source.motion.animations.find(c=>c.name==='retarget_clip')||source.motion.animations[0];
 if(!clip)throw Error('Running animation is missing.');
 const action=mixer.clipAction(clip),hips=root.getObjectByName('Hips'),origin=hips.position.clone();
 let mode='run';action.play();
 function setMode(next){mode=next;action.stop();for(const r of bones){r.bone.position.copy(r.position);r.bone.quaternion.copy(r.quaternion);r.bone.scale.copy(r.scale);}if(mode==='run')action.reset().play();root.updateMatrixWorld(true);}
 function update(dt){if(mode==='run'){mixer.update(Math.max(0,Math.min(.05,dt)));hips.position.x=origin.x;hips.position.z=origin.z;}root.updateMatrixWorld(true);}
 return {root,setMode,update,clipName:clip.name,dispose(){mixer.stopAllAction();mixer.uncacheRoot(root);}};
}
