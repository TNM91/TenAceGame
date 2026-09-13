import * as T from './vendor/three.module.min.js';
import {loadCharacterCandidate,createCharacterCandidate} from './meshy-character.js';
const canvas=document.getElementById('stage'),status=document.getElementById('status');
const scene=new T.Scene();scene.background=new T.Color('#203844');
scene.add(new T.HemisphereLight('#f5f7ff','#657770',2.1));
const key=new T.DirectionalLight('#ffedd5',2.1);key.position.set(-3,5,4);key.castShadow=true;key.shadow.mapSize.set(1024,1024);key.shadow.normalBias=.02;Object.assign(key.shadow.camera,{near:.1,far:16,left:-3,right:3,top:4,bottom:-3});scene.add(key);
const rim=new T.DirectionalLight('#b9ddff',2.2);rim.position.set(2,3,-3);scene.add(rim);
const floor=new T.Mesh(new T.PlaneGeometry(30,30),new T.MeshStandardMaterial({color:'#203844',roughness:1}));floor.rotation.x=-Math.PI/2;floor.position.y=-.012;floor.receiveShadow=true;scene.add(floor);
const camera=new T.PerspectiveCamera(38,1,.05,50);
let angle=.22,pitch=0,close=false,paused=false,drag=null,last=0,renderer,rig;
function cameraPose(){const radius=close?1.35:3.25,focus=close?1.5:.88;camera.position.set(Math.sin(angle)*radius,focus+.12+pitch,Math.cos(angle)*radius);camera.lookAt(0,focus,0);}
function resize(){renderer.setSize(canvas.clientWidth,canvas.clientHeight,false);camera.aspect=canvas.clientWidth/canvas.clientHeight;camera.updateProjectionMatrix();}
canvas.onpointerdown=e=>{canvas.setPointerCapture(e.pointerId);drag={id:e.pointerId,x:e.clientX,y:e.clientY};};
canvas.onpointermove=e=>{if(!drag||drag.id!==e.pointerId)return;angle+=(e.clientX-drag.x)*.009;pitch=T.MathUtils.clamp(pitch+(e.clientY-drag.y)*.003,-.35,.45);drag={id:e.pointerId,x:e.clientX,y:e.clientY};cameraPose();};
canvas.onpointerup=canvas.onpointercancel=()=>{drag=null;};
try{
 renderer=new T.WebGLRenderer({canvas,antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1;resize();cameraPose();addEventListener('resize',resize);
 rig=createCharacterCandidate(await loadCharacterCandidate());scene.add(rig.root);
 const skeleton=new T.SkeletonHelper(rig.root);skeleton.visible=false;scene.add(skeleton);
 const pause=document.getElementById('pause');
 for(const mode of ['run','stand'])document.getElementById(mode).onclick=()=>{rig.setMode(mode);document.getElementById('run').setAttribute('aria-pressed',String(mode==='run'));document.getElementById('stand').setAttribute('aria-pressed',String(mode==='stand'));paused=false;pause.textContent='Pause motion';pause.setAttribute('aria-pressed','false');};
 pause.onclick=()=>{paused=!paused;pause.textContent=paused?'Play motion':'Pause motion';pause.setAttribute('aria-pressed',String(paused));};
 document.getElementById('face').onclick=e=>{close=!close;e.currentTarget.setAttribute('aria-pressed',String(close));cameraPose();};
 document.getElementById('skeleton').onclick=e=>{skeleton.visible=!skeleton.visible;e.currentTarget.setAttribute('aria-pressed',String(skeleton.visible));};
 document.querySelectorAll('.tools button').forEach(b=>b.disabled=false);status.textContent='Rig ready · Drag to inspect';
 function frame(now){const dt=last?Math.min(.05,(now-last)/1000):0;last=now;if(!document.hidden){rig.update(paused?0:dt);renderer.render(scene,camera);}requestAnimationFrame(frame);}requestAnimationFrame(frame);
}catch(error){status.textContent='Character preview could not load. Reload to retry.';console.error(error);}
