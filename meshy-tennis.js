import * as T from './vendor/three.module.min.js';
import {createCharacterCandidate,loadCharacterCandidate} from './meshy-character.js';
export {loadCharacterCandidate};
import {applySculptKit} from './sculpt-kit.js';
import {readyPose,strokes,sampleServe} from './tennis-motion.js';
import {closeRacketHand,gripOffset,handGripRotation} from './grip-corrective.js?v=0.22.1';
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


export function createTennisPlayer(look={},source){
 const candidate=createCharacterCandidate(source),root=new T.Group(),model=candidate.root;root.add(model);root.scale.setScalar(1.22);
 // Each court/portrait instance owns the resources disposed by the renderer.
 model.traverse(o=>{if(o.isMesh){o.geometry=o.geometry.clone();o.material=o.material.clone();for(const key of ['map','normalMap','roughnessMap','metalnessMap'])if(o.material[key])o.material[key]=o.material[key].clone();}});
 candidate.setMode('stand');const bones={};model.traverse(o=>{if(o.isBone)bones[o.name]=o;});
 closeRacketHand(model);applySculptKit(model,look);
 const racket=new T.Group();racket.name='Racket';root.add(racket);
 const equipment=new T.Group();equipment.position.copy(gripOffset);racket.add(equipment);
 const material=new T.MeshStandardMaterial({color:look.racket||'#c8ef66',metalness:.25,roughness:.4});
 const frameWidth=look.frame==='power'?1.16:look.frame==='control'?.9:1,frameHeight=look.frame==='control'?1.08:1;
 const head=new T.Group();head.position.y=.38;head.scale.set(frameWidth,frameHeight,1);equipment.add(head);
 const rim=new T.Mesh(new T.TorusGeometry(.16,.013,8,40),material);rim.scale.y=1.3;head.add(rim);
 const contact=new T.Object3D();contact.name='RacketContact';contact.position.y=.38;equipment.add(contact);
 const grip=new T.Mesh(new T.CylinderGeometry(.018,.021,.20,12),new T.MeshStandardMaterial({color:'#132432'}));grip.position.y=.03;equipment.add(grip);
 for(const sign of [-1,1]){const shaft=new T.Mesh(new T.CylinderGeometry(.009,.009,.18,8),material);shaft.position.set(sign*.04,.19,0);shaft.rotation.z=-sign*.45;equipment.add(shaft);}
 const points=[];for(let i=-5;i<=5;i++){const x=i*.026,y=Math.sqrt(.16*.16-x*x)*1.3;points.push(v(x,.38-y,0),v(x,.38+y,0));const yy=i*.034,xx=Math.sqrt(.16*.16-(yy/1.3)**2);points.push(v(-xx,.38+yy,0),v(xx,.38+yy,0));}
 for(const point of points)point.y-=.38;
 head.add(new T.LineSegments(new T.BufferGeometry().setFromPoints(points),new T.LineBasicMaterial({color:'#edf6e5',transparent:true,opacity:.7})));
 const feet={Left:{},Right:{}};
 let priorNear=null,priorX=null,stride=0,lastEvent=null,contactTurn=0,turn=0,lastLoad=0,contactLoad=0,preparation=0;
 // Apply torso turns in model space rather than assuming imported bone axes.
 function twist(bone,amount){
  const axis=v(0,1,0).applyQuaternion(root.getWorldQuaternion(new T.Quaternion())).applyQuaternion(bone.parent.getWorldQuaternion(new T.Quaternion()).invert());
  bone.quaternion.premultiply(new T.Quaternion().setFromAxisAngle(axis,amount));bone.updateWorldMatrix(false,true);
 }
 function pose(p,time,dt,event){
  candidate.setMode('stand');
  if(priorNear!==p.near){priorNear=p.near;priorX=null;stride=0;feet.Left.planted=feet.Right.planted=null;}
  root.position.set((p.x-.5)*10,0,(p.y-.5)*18);root.rotation.y=p.near?Math.PI:0;root.updateMatrixWorld(true);
  const dx=priorX===null?0:p.x-priorX;priorX=p.x;stride+=p.preview==='run'?dt*9:Math.abs(dx)*90;
  const run=p.preview==='run'?1:clamp(Math.abs(dx)/Math.max(dt,.001)*2,0,1),charge=clamp(p.charge||0,0,1),age=event?time-event.time:10;
  const active=event&&age>=0&&age<.85,load=Math.max(charge,p.ready?.22:0);
  const incomingLocal=Number.isFinite(p.incomingX)?(p.incomingX-p.x)*(p.near?-1:1):0;
  const wantsBack=incomingLocal>.015?1:incomingLocal<-.015?0:preparation;
  if(!active&&!p.serve)preparation+=(wantsBack-preparation)*(1-Math.exp(-Math.max(0,dt)*14));
  const point=event?root.worldToLocal(event.point.clone()):v(-.4,1.1,.3),back=point.x>0;
  const follow=active?Math.sin(Math.PI*ease(age/.85)):0,stroke=strokes[event?.shot]||strokes.topspin,servePose=p.serve?sampleServe(p.serveProgress??load):null;
  const readyHand=v(...readyPose.hand),readyDirection=v(...readyPose.racket).normalize();
  if(active&&event!==lastEvent){contactTurn=turn;contactLoad=lastLoad;lastEvent=event;}
  turn=active?contactTurn*(1-ease(age/.25))+(back?-stroke.turn:stroke.turn)*follow:servePose?servePose.turn:load*(-.44+.88*preparation);
  bones.Hips.position.y-=.105+(active?contactLoad*(1-ease(age/.28)):load)*.035;lastLoad=load;
  bones.Hips.position.y+=servePose?servePose.lift:active&&event.shot==='serve'?.075*(1-ease(age/.28)):0;
  bones.Hips.position.x+=(back?-.028:.028)*follow;root.updateMatrixWorld(true);
  twist(bones.Spine02,turn*.3);twist(bones.Spine01,turn*.3);twist(bones.Spine,turn*.4);twist(bones.neck,-turn*.65);
  const world=point=>root.localToWorld(point.clone());
 const wristFor=(point,direction)=>point.clone().sub(gripOffset.clone().add(v(0,.38,0)).applyQuaternion(new T.Quaternion().setFromUnitVectors(v(0,1,0),direction)));
  for(const [side,sign] of [['Left',1],['Right',-1]]){
   const foot=bones[side+'Foot'],footQ=foot.getWorldQuaternion(new T.Quaternion()),state=feet[side];
   const phase=(stride/(Math.PI*2)+(sign>0?.5:0))%1,swing=run>.02&&phase>.58;
   const nominal=world(v(sign*.20,.11,sign*(p.serve?.07:0)));
   if(!state.planted||state.planted.distanceTo(nominal)>.65){state.planted=nominal.clone();state.swing=false;}
   let target=state.planted.clone();
   if(swing){
    if(!state.swing)state.takeoff=state.planted.clone();
    const destination=nominal.clone();destination.x+=Math.sign(dx||1)*.10*run;
    const t=(phase-.58)/.42;target.copy(state.takeoff).lerp(destination,ease(t));
    state.planted.copy(target);target.y+=Math.sin(Math.PI*t)*.075*root.scale.y;
   }else if(run<.02){
    // Settle over time after stopping; paused frames keep their exact support points.
    state.planted.lerp(nominal,1-Math.exp(-Math.max(0,dt)*12));target.copy(state.planted);
   }
   state.swing=swing;
   arm(bones[side+'UpLeg'],bones[side+'Leg'],foot,target,world(v(sign*.25,.4,.4)));
   foot.quaternion.copy(foot.parent.getWorldQuaternion(new T.Quaternion()).invert().multiply(footQ));foot.updateWorldMatrix(false,true);

  }
  let target=readyHand.clone().lerp(v(-.45+.9*preparation,1.18,-.12+.25*preparation),load),left=v(...readyPose.support).lerp(v(.25+.12*preparation,1.18,.38),load),direction=readyDirection.clone();
  if(p.serve){
   const t=clamp(p.serveProgress??load,0,1),drive=ease((t-.65)/.35);
   target.set(...servePose.hand);left.set(...servePose.support);
   // Authored trophy pose flows into the same overhead contact used by the ball.
   const overhead=v(-.025*10/1.22,.158*14/1.22,.015*18/1.22),shoulder=root.worldToLocal(bones.RightArm.getWorldPosition(v()));
   const hitDirection=overhead.clone().sub(shoulder).normalize();
   target.lerp(wristFor(overhead,hitDirection),drive);direction.lerp(hitDirection,drive).normalize();
  }
  if(event&&!p.serve&&age<0&&age>-.18){
   const approach=ease((age+.18)/.18),toward=point.clone().sub(root.worldToLocal(bones.RightArm.getWorldPosition(v()))).normalize();
   target.lerp(wristFor(point,toward),approach);direction.lerp(toward,approach).normalize();
  }
  if(active){
   const shoulder=root.worldToLocal(bones.RightArm.getWorldPosition(v()));
   direction.copy(point).sub(shoulder).normalize();
   const hit=wristFor(point,direction),finish=v(...stroke.finish),arc=v(...stroke.arc);if(back){finish.x=-finish.x;arc.x=-arc.x;}
   const recovery=ease((age-.48)/.37),sweep=ease((age-.065)/.415);
   target.copy(hit).multiplyScalar((1-sweep)**2).addScaledVector(arc,2*(1-sweep)*sweep).addScaledVector(finish,sweep*sweep).lerp(readyHand,recovery);
   const finishDirection=v(...stroke.face);if(back)finishDirection.x=-finishDirection.x;
   const q=new T.Quaternion().setFromUnitVectors(v(0,1,0),direction),endQ=new T.Quaternion().setFromUnitVectors(v(0,1,0),finishDirection.normalize());
   q.slerp(endQ,sweep).slerp(new T.Quaternion().setFromUnitVectors(v(0,1,0),readyDirection),recovery);direction.set(0,1,0).applyQuaternion(q);
   if(back)left.lerp(target.clone().add(v(.05,-.06,0)),1-recovery);
  }
  arm(bones.RightArm,bones.RightForeArm,bones.RightHand,world(target),world(v(-.65,.9,.12)));
  arm(bones.LeftArm,bones.LeftForeArm,bones.LeftHand,world(left),world(v(.65,.9,.15)));
  racket.position.copy(root.worldToLocal(bones.RightHand.getWorldPosition(v())));
  racket.quaternion.setFromUnitVectors(v(0,1,0),direction);
  // Keep the racket anchored at the actual wrist; unreachable balls never detach it.
  const hand=bones.RightHand,desired=root.getWorldQuaternion(new T.Quaternion()).multiply(racket.quaternion).multiply(handGripRotation);
  hand.quaternion.copy(hand.parent.getWorldQuaternion(new T.Quaternion()).invert().multiply(desired));
  root.updateMatrixWorld(true);
 }
 root.userData.release=()=>candidate.dispose();
 return {root,pose,bones,kind:'meshy',dispose:()=>candidate.dispose()};
}
