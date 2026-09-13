import * as T from './vendor/three.module.min.js';
import {createOriginal as createRig} from './original-player.js';
const canvas=document.getElementById('stage'),status=document.getElementById('status');
let renderer,rig,mode='ready',close=false,angle=.15,pitch=0,event=null,eventAt=0,last=performance.now(),time=0,drag=null,paused=false;
const phase=document.getElementById('phase'),motion=document.getElementById('motion');
function setPaused(value){paused=value;motion.textContent=paused?'Play motion':'Pause motion';motion.setAttribute('aria-pressed',String(paused));}
motion.onclick=()=>setPaused(!paused);
phase.oninput=()=>{setPaused(true);time=eventAt+Number(phase.value)/1000;};
const scene=new T.Scene();scene.background=new T.Color('#bac9c9');
scene.add(new T.HemisphereLight('#f5f7ff','#667573',2.0));
const key=new T.DirectionalLight('#fff0d5',1.8);key.position.set(-3,5,4);key.castShadow=true;key.shadow.mapSize.set(1024,1024);key.shadow.normalBias=.025;Object.assign(key.shadow.camera,{near:1,far:15,left:-4,right:4,top:4,bottom:-4});scene.add(key);
const fill=new T.DirectionalLight('#b2d8ff',1.0);fill.position.set(4,3,-2);scene.add(fill);
const rimLight=new T.DirectionalLight('#d3eaff',1.8);rimLight.position.set(2,3,-4);scene.add(rimLight);
const floor=new T.Mesh(new T.PlaneGeometry(40,40),new T.MeshStandardMaterial({color:'#bac9c9',roughness:1}));floor.rotation.x=-Math.PI/2;floor.position.y=-.015;floor.receiveShadow=true;scene.add(floor);
const camera=new T.PerspectiveCamera(36,1,.1,60);
function resize(){const w=canvas.clientWidth,h=canvas.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();}
function cameraPose(){const radius=close?2.2:5.0,focus=close?2.08:1.26;camera.position.set(Math.sin(angle)*radius,focus+.3+pitch,Math.cos(angle)*radius);camera.lookAt(0,focus,0);}
function startPose(next){mode=next;eventAt=time;event=next==='forehand'||next==='backhand'||next==='serve'?{point:new T.Vector3(next==='backhand'?.42:-.42,next==='serve'?2.18:1.38,.30),time:time+.55,shot:next==='serve'?'serve':'topspin'}:null;phase.disabled=!event;phase.value=0;document.querySelectorAll('[data-pose]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.pose===next)));}
for(const b of document.querySelectorAll('[data-pose]'))b.onclick=()=>{setPaused(false);startPose(b.dataset.pose);};
document.getElementById('closeup').onclick=e=>{close=!close;e.currentTarget.setAttribute('aria-pressed',String(close));cameraPose();};
function disposeRig(){if(!rig)return;rig.dispose();scene.remove(rig.root);rig.root.traverse(o=>{o.geometry?.dispose();if(o.material){for(const k of ['map','normalMap','roughnessMap'])o.material[k]?.dispose();o.material.dispose();}});}
const studioLook={shirt:'#248d9b',skin:'#e6ac7e',style:'crop'};
for(const [id,key] of [['kit','shirt'],['hairStyle','style'],['skinTone','skin']])document.getElementById(id).onchange=e=>{studioLook[key]=e.target.value;if(!rig)return;disposeRig();rig=createRig(studioLook);scene.add(rig.root);};
canvas.onpointerdown=e=>{canvas.setPointerCapture(e.pointerId);drag={x:e.clientX,y:e.clientY,id:e.pointerId};};
canvas.onpointermove=e=>{if(!drag||e.pointerId!==drag.id)return;angle+=(e.clientX-drag.x)*.009;pitch=T.MathUtils.clamp(pitch+(e.clientY-drag.y)*.003,-.4,.6);drag.x=e.clientX;drag.y=e.clientY;cameraPose();};
canvas.onpointerup=canvas.onpointercancel=()=>{drag=null;};
try{
 renderer=new T.WebGLRenderer({canvas,antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1;resize();cameraPose();addEventListener('resize',resize);
 rig=createRig({shirt:'#248d9b'});scene.add(rig.root);status.textContent='Player ready · Drag to inspect';
 function frame(now){const dt=document.hidden||paused?0:Math.min(.05,(now-last)/1000);last=now;time+=dt;if(!document.hidden){if(event&&time-eventAt>2.2)startPose(mode);if(event&&!paused)phase.value=Math.round((time-eventAt)*1000);rig.pose({x:.5,y:.5,tx:.5,near:false,ready:true,preview:mode,shot:'topspin',charge:event&&time<event.time?Math.min(1,(time-eventAt)/.45):0,serve:mode==='serve'&&time<event?.time,celebrate:mode==='celebrate',swing:event?Math.max(0,1-(time-event.time)*3):0},time,dt,event);renderer.render(scene,camera);}requestAnimationFrame(frame);}requestAnimationFrame(frame);
}catch(error){status.textContent='Character preview could not load. Reload to retry.';console.error(error);}
