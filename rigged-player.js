import * as T from './vendor/three.module.min.js';
import {GLTFLoader} from './vendor/GLTFLoader.js';
import {clone} from './vendor/SkeletonUtils.js';

let assets, pending;
export function loadRigAssets(){
 if(!pending){const loader=new GLTFLoader();pending=Promise.all([
  loader.loadAsync('./assets/rigged/tenace-athlete.glb'),
  loader.loadAsync('./assets/rigged/locomotion.glb')
 ]).then(([character,animation])=>{assets={character,animation};return true;}).catch(error=>{pending=null;throw error;});}
 return pending;
}
const v=(x,y,z)=>new T.Vector3(x,y,z),clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const ease=x=>{x=clamp(x,0,1);return x*x*(3-2*x);};

// Rotate a bone toward a world-space joint target without changing the bind pose.
function aim(bone,child,target){
 const origin=bone.getWorldPosition(v()),current=child.getWorldPosition(v()).sub(origin).normalize();
 const direction=target.clone().sub(origin).normalize();
 const q=new T.Quaternion().setFromUnitVectors(current,direction).multiply(bone.getWorldQuaternion(new T.Quaternion()));
 bone.quaternion.copy(bone.parent.getWorldQuaternion(new T.Quaternion()).invert().multiply(q));
 bone.updateWorldMatrix(false,true);
}
function arm(upper,lower,hand,target,pole){
 const start=upper.getWorldPosition(v()),elbow=lower.getWorldPosition(v()),end=hand.getWorldPosition(v());
 const a=start.distanceTo(elbow),b=elbow.distanceTo(end),direction=target.clone().sub(start);
 const distance=clamp(direction.length(),Math.abs(a-b)+.001,a+b-.001);direction.normalize();
 const normal=pole.clone().sub(start);normal.addScaledVector(direction,-normal.dot(direction));
 if(normal.lengthSq()<1e-8)normal.crossVectors(direction,v(0,1,0));normal.normalize();
 const along=(a*a-b*b+distance*distance)/(2*distance),height=Math.sqrt(Math.max(0,a*a-along*along));
 const joint=start.clone().addScaledVector(direction,along).addScaledVector(normal,height);
 aim(upper,lower,joint);aim(lower,hand,start.clone().addScaledVector(direction,distance));
}

export function createRig(look={},source=assets){
 if(!source)throw Error('Character assets have not loaded');
 const root=new T.Group(),model=clone(source.character.scene);root.add(model);root.scale.setScalar(1.22);
 const bones={};model.traverse(o=>{if(o.isBone)bones[o.name]=o;if(o.isMesh){
  o.geometry=o.geometry.clone();o.material=o.material.clone();
  for(const key of ['map','normalMap','roughnessMap'])if(o.material[key])o.material[key]=o.material[key].clone();
  if(o.material.name==='MI_Hair_1')o.material.color.set('#5c4435');
  if(o.material.name==='TenAce_Jersey')o.material.color.set(look.shirt||'#248d9b');
  if(o.material.name==='TenAce_Shorts')o.material.color.set(look.shorts||'#142d3e');
  o.castShadow=true;o.receiveShadow=true;
 }});
 const rest={};for(const [name,b] of Object.entries(bones))rest[name]=b.quaternion.clone();
 const mixer=new T.AnimationMixer(model),actions={};
 for(const clipSource of source.animation.animations){
  const tracks=clipSource.tracks.filter(t=>t.name.endsWith('.quaternion')&&bones[t.name.slice(0,-11)]).map(t=>t.clone());
  const clip=new T.AnimationClip(clipSource.name,clipSource.duration,tracks);actions[clipSource.name]=mixer.clipAction(clip).play();
 }
 const racket=new T.Group();root.add(racket);
 const rim=new T.Mesh(new T.TorusGeometry(.16,.013,8,36),new T.MeshStandardMaterial({color:look.racket||'#c8ef66',metalness:.25,roughness:.42}));rim.position.y=.34;rim.scale.y=1.35;racket.add(rim);
 const grip=new T.Mesh(new T.CylinderGeometry(.016,.019,.22,10),new T.MeshStandardMaterial({color:'#192b36'}));grip.position.y=.07;racket.add(grip);
 const strings=[];for(let i=-5;i<=5;i++){const x=i*.025,y=Math.sqrt(.16*.16-x*x)*1.35;strings.push(v(x,.34-y,0),v(x,.34+y,0));const yy=i*.034,xx=Math.sqrt(.16*.16-(yy/1.35)**2);strings.push(v(-xx,.34+yy,0),v(xx,.34+yy,0));}
 racket.add(new T.LineSegments(new T.BufferGeometry().setFromPoints(strings),new T.LineBasicMaterial({color:'#cedad7',transparent:true,opacity:.65})));
 const shoes=['l','r'].map(side=>{const group=new T.Group();root.add(group);const upper=new T.Mesh(new T.CapsuleGeometry(.062,.115,5,14),new T.MeshStandardMaterial({color:'#e9eee9',roughness:.8}));upper.rotation.x=Math.PI/2;upper.scale.x=1.12;upper.position.y=.035;group.add(upper);const sole=new T.Mesh(new T.BoxGeometry(.14,.022,.245),new T.MeshStandardMaterial({color:'#bdc8c3',roughness:1}));sole.position.y=-.012;group.add(sole);return {group,foot:bones['foot_'+side],toe:bones['ball_'+side]};});
 const hand=bones.hand_r;let priorX=null,runWeight=0;
 function pose(p,time,dt,event){
  root.position.set((p.x-.5)*10,0,(p.y-.5)*18);root.rotation.y=p.near?Math.PI:0;
  const speed=priorX===null?0:Math.abs(p.x-priorX)/Math.max(.001,dt);priorX=p.x;
  const running=p.preview==='run'?1:clamp(speed*2+Math.abs((p.tx??p.x)-p.x)*7,0,1);
  runWeight+=(running-runWeight)*Math.min(1,Math.max(dt,0)*12);
  for(const [name,b] of Object.entries(bones))b.quaternion.copy(rest[name]);
  for(const [name,action] of Object.entries(actions))action.setEffectiveWeight(name==='Jog_Fwd_Loop'?runWeight:name==='Idle_Loop'?1-runWeight:0);
  mixer.update(Math.max(0,Math.min(dt,.1)));
  const charge=p.charge||0,age=event?time-event.time:10;
  let right=v(-.27,1.07,.35),left=v(.23,1.08,.30);
  if(charge)right.lerp(v(-.42,1.28,-.12),charge);
  if(p.serve){right=v(-.12,1.62,.06);left=v(.19,1.68,.22);}
  if(p.celebrate){right=v(-.22,1.66,.05);left=v(.22,1.66,.05);}
  root.updateMatrixWorld(true);
  if(event&&age>=0&&age<.85){
   const start=root.worldToLocal(event.point.clone());start.y-=.34;
   const back=start.x>0,finish=event.shot==='serve'?v(.30,.92,.3):p.shot==='lob'?v(.12,1.48,.34):p.shot==='slice'?v(.3,.87,.36):p.shot==='flat'?v(.34,1.15,.33):v(.31,1.43,.30);
   if(back)finish.x=-finish.x;
   const recover=ease((age-.48)/.37);right=start.clone().lerp(finish,ease((age-.08)/.40)).lerp(right,recover);
   if(back)left.lerp(start.clone().add(v(-.06,.04,0)),1-recover);
  }
  const worldTarget=point=>root.localToWorld(point.clone());
  arm(bones.upperarm_r,bones.lowerarm_r,bones.hand_r,worldTarget(right),worldTarget(v(-.6,.97,.2)));
  arm(bones.upperarm_l,bones.lowerarm_l,bones.hand_l,worldTarget(left),worldTarget(v(.6,.97,.2)));
  root.updateMatrixWorld(true);racket.position.copy(root.worldToLocal(hand.getWorldPosition(v())));
  for(const s of shoes){const foot=root.worldToLocal(s.foot.getWorldPosition(v())),toe=root.worldToLocal(s.toe.getWorldPosition(v())),direction=toe.sub(foot);s.group.position.copy(foot).add(v(0,-.045,.035));s.group.rotation.y=Math.atan2(direction.x,direction.z);}
  racket.rotation.z=age>=.08&&age<.85?-.30*Math.sin((age-.08)/.77*Math.PI):0;
 }
 function dispose(){mixer.stopAllAction();mixer.uncacheRoot(model);}
 root.userData.release=dispose;
 return {root,pose,dispose,bones,kind:'rigged'};
}
