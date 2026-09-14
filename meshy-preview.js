import * as T from './vendor/three.module.min.js';
import {loadCharacterCandidate,createTennisPlayer} from './meshy-tennis.js?v=0.25';
const canvas=document.getElementById('stage'),status=document.getElementById('status');
const scene=new T.Scene();scene.background=new T.Color('#203844');
scene.add(new T.HemisphereLight('#f5f7ff','#657770',2.1));
const key=new T.DirectionalLight('#ffedd5',2.1);key.position.set(-3,5,4);key.castShadow=true;key.shadow.mapSize.set(1024,1024);key.shadow.normalBias=.02;Object.assign(key.shadow.camera,{near:.1,far:16,left:-3,right:3,top:4,bottom:-3});scene.add(key);
const rim=new T.DirectionalLight('#b9ddff',2.2);rim.position.set(2,3,-3);scene.add(rim);
const floor=new T.Mesh(new T.PlaneGeometry(30,30),new T.MeshStandardMaterial({color:'#203844',roughness:1}));floor.rotation.x=-Math.PI/2;floor.position.y=-.012;floor.receiveShadow=true;scene.add(floor);
const camera=new T.PerspectiveCamera(38,1,.05,50);
let angle=.22,pitch=0,close=false,gripView=false,slow=false,paused=false,drag=null,last=0,renderer,rig,mode='run',time=0,event=null;
function cameraPose(){if(gripView&&rig){const center=rig.bones.RightHand.getWorldPosition(new T.Vector3());camera.position.copy(center).add(new T.Vector3(Math.sin(angle)*.85,.12+pitch,Math.cos(angle)*.85));camera.lookAt(center);return;}const radius=close?1.6:4.2,focus=close?1.8:1.08;camera.position.set(Math.sin(angle)*radius,focus+.12+pitch,Math.cos(angle)*radius);camera.lookAt(0,focus,0);}
function resize(){renderer.setSize(canvas.clientWidth,canvas.clientHeight,false);camera.aspect=canvas.clientWidth/canvas.clientHeight;camera.updateProjectionMatrix();}
canvas.onpointerdown=e=>{canvas.setPointerCapture(e.pointerId);drag={id:e.pointerId,x:e.clientX,y:e.clientY};};
canvas.onpointermove=e=>{if(!drag||drag.id!==e.pointerId)return;angle+=(e.clientX-drag.x)*.009;pitch=T.MathUtils.clamp(pitch+(e.clientY-drag.y)*.003,-.35,.45);drag={id:e.pointerId,x:e.clientX,y:e.clientY};cameraPose();};
canvas.onpointerup=canvas.onpointercancel=()=>{drag=null;};
try{
 renderer=new T.WebGLRenderer({canvas,antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1;resize();cameraPose();addEventListener('resize',resize);
 rig=createTennisPlayer({},await loadCharacterCandidate());scene.add(rig.root);
 const demoBall=new T.Mesh(new T.SphereGeometry(.055,16,12),new T.MeshStandardMaterial({color:'#e1fa4d',roughness:.7}));scene.add(demoBall);
 const skeleton=new T.SkeletonHelper(rig.root);skeleton.visible=false;scene.add(skeleton);
 const pause=document.getElementById('pause'),phase=document.getElementById('phase');
 phase.oninput=()=>{time=Number(phase.value)/1000;paused=true;pause.textContent='Play motion';pause.setAttribute('aria-pressed','true');};
 for(const next of ['run','stand','forehand','backhand','flat','slice','serve'])document.getElementById(next).onclick=()=>{mode=next;time=0;event=null;phase.value=0;phase.disabled=!['forehand','backhand','flat','slice','serve'].includes(mode);for(const id of ['run','stand','forehand','backhand','flat','slice','serve'])document.getElementById(id).setAttribute('aria-pressed',String(id===mode));paused=false;pause.textContent='Pause motion';pause.setAttribute('aria-pressed','false');};
 document.getElementById('slow').onclick=e=>{slow=!slow;e.currentTarget.setAttribute('aria-pressed',String(slow));};
 pause.onclick=()=>{paused=!paused;pause.textContent=paused?'Play motion':'Pause motion';pause.setAttribute('aria-pressed',String(paused));};
 document.getElementById('grip').onclick=e=>{gripView=!gripView;e.currentTarget.setAttribute('aria-pressed',String(gripView));cameraPose();};
 document.getElementById('face').onclick=e=>{gripView=false;document.getElementById('grip').setAttribute('aria-pressed','false');close=!close;e.currentTarget.setAttribute('aria-pressed',String(close));cameraPose();};
 document.getElementById('skeleton').onclick=e=>{skeleton.visible=!skeleton.visible;e.currentTarget.setAttribute('aria-pressed',String(skeleton.visible));};
 document.querySelectorAll('.tools button').forEach(b=>b.disabled=false);status.textContent='Rig ready · Drag to inspect';
 function frame(now){const dt=last?Math.min(.05,(now-last)/1000):0;last=now;if(!document.hidden){const step=paused?0:dt*(slow?.35:1);time+=step;if(!paused)phase.value=Math.round(time*1000);if(time>2.2){time=0;event=null;}if(['forehand','backhand','flat','slice','serve'].includes(mode)&&!event)event={time:.55,point:new T.Vector3(mode==='backhand'?.42:mode==='serve'?-.25:-.42,mode==='serve'?2.212:1.38,mode==='serve'?.27:.3),shot:mode==='serve'?'serve':mode==='flat'?'flat':mode==='slice'?'slice':'topspin'};rig.pose({x:.5,y:.5,tx:.5,near:false,preview:mode,incomingX:mode==='backhand'?.7:.3,ready:mode==='stand',charge:event&&mode!=='serve'&&time<.55?Math.min(1,time/.4):0,serve:mode==='serve'&&time<.55,serveProgress:Math.min(1,time/.55)},time,step,event);demoBall.visible=!!event&&time<1.15;if(event){demoBall.position.copy(event.point);if(time<.55){if(mode==='serve')demoBall.position.set(.20-.45*time/.55,(.09+Math.sin(time/.55*Math.PI*.65)*.076)*14,.27);else demoBall.position.z+=Math.max(0,.55-time)*2;}else demoBall.position.z+=(time-.55)*4;}if(gripView)cameraPose();renderer.render(scene,camera);}requestAnimationFrame(frame);}requestAnimationFrame(frame);
}catch(error){status.textContent='Character preview could not load. Reload to retry.';console.error(error);}
