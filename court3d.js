import * as T from './vendor/three.module.min.js';

// Match coordinates remain owned by physics.js: x/y in court units, z is height.
export const world=(x,y,z=0)=>new T.Vector3((x-.5)*10,z*14,(y-.5)*18);
const UP=new T.Vector3(0,1,0);
const material=color=>new T.MeshStandardMaterial({color,roughness:.78});
function mesh(parent,geometry,mat,x=0,y=0,z=0){const m=new T.Mesh(geometry,mat);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
function box(parent,w,h,d,mat,x,y,z){return mesh(parent,new T.BoxGeometry(w,h,d),mat,x,y,z);}
function ellipsoid(parent,mat,x,y,z,sx,sy,sz){const m=mesh(parent,new T.SphereGeometry(1,20,16),mat,x,y,z);m.scale.set(sx,sy,sz);return m;}
// Authored cross-sections give the body a waist, shoulders and jaw instead of scaled balls.
function contour(sections,segments=24){
 const vertices=[],indices=[];
 for(const [y,rx,rz,offset=0] of sections)for(let j=0;j<=segments;j++){const a=j/segments*Math.PI*2;vertices.push(Math.cos(a)*rx,y,Math.sin(a)*rz+offset);}
 for(let i=0;i<sections.length-1;i++)for(let j=0;j<segments;j++){const a=i*(segments+1)+j,b=a+segments+1;indices.push(a,b,a+1,b,b+1,a+1);}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(vertices,3));g.setIndex(indices);g.computeVertexNormals();return g;
}
function bone(parent,mat,r){return mesh(parent,contour([[-.5,r*.68,r*.68],[-.40,r*.85,r*.78],[-.15,r*1.04,r*.91],[.17,r,r*.88],[.42,r*.78,r*.72],[.5,r*.65,r*.65]],16),mat);}
function connect(m,a,b){m.position.copy(a).add(b).multiplyScalar(.5);const delta=b.clone().sub(a);m.scale.y=delta.length();m.quaternion.setFromUnitVectors(UP,delta.normalize());}
function label(text,bg='#08253c',fg='#dff8b3',w=512,h=128){const c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');g.fillStyle=bg;g.fillRect(0,0,w,h);g.fillStyle=fg;g.textAlign='center';g.font='italic 800 '+Math.floor(Math.min(h*.46,w*.88/(text.length*.57)))+'px system-ui';g.fillText(text,w/2,h*.67);const tx=new T.CanvasTexture(c);tx.colorSpace=T.SRGBColorSpace;return new T.MeshStandardMaterial({map:tx,roughness:.9,side:T.DoubleSide});}
function surfaceTexture(base,light,dark){const c=document.createElement('canvas');c.width=c.height=256;const g=c.getContext('2d');g.fillStyle=base;g.fillRect(0,0,256,256);for(let i=0;i<7000;i++){g.fillStyle=i%2?light:dark;g.fillRect(i*73%256,i*131%251,1+(i%3),1);}const tx=new T.CanvasTexture(c);tx.colorSpace=T.SRGBColorSpace;tx.wrapS=tx.wrapT=T.RepeatWrapping;tx.repeat.set(4,6);return tx;}

export function athlete(look){
 const root=new T.Group(),skin=material(look.skin),shirt=material(look.shirt),hair=material(look.hair),shorts=material(look.shorts),white=material('#f0f2e5'),dark=material('#102333');
 root.scale.setScalar(1.12);
 const body=new T.Group();root.add(body);
 const torso=mesh(body,contour([[0,.215,.14],[.08,.22,.14],[.22,.225,.15],[.37,.275,.18],[.49,.325,.175],[.56,.27,.14],[.62,.12,.105]]),shirt,0,1.02,0);
 const collar=mesh(body,new T.TorusGeometry(.12,.018,6,20),white,0,1.65,0);collar.rotation.x=Math.PI/2;
 ellipsoid(body,skin,0,1.71,0,.095,.10,.095);
 const face=new T.Group();body.add(face);face.scale.setScalar(.72);face.position.y=.49;
 const head=mesh(face,contour([[-.22,.065,.07,.015],[-.17,.12,.12,.015],[-.08,.164,.15],[.03,.177,.163],[.12,.169,.15],[.20,.125,.12],[.235,.01,.01]]),skin,0,1.97,0);
 ellipsoid(face,skin,-.178,1.98,0,.028,.056,.032);ellipsoid(face,skin,.178,1.98,0,.028,.056,.032);
 // All players face local +z; the near player rotates toward the opponent.
 for(const x of [-.075,.075]){ellipsoid(face,white,x,2.01,.176,.032,.018,.008);ellipsoid(face,dark,x,2.01,.188,.012,.015,.007);}
 ellipsoid(face,skin,0,1.95,.20,.038,.057,.042);
 const band=mesh(face,new T.CylinderGeometry(.184,.184,.045,20),white,0,2.13,0);
 if(look.style!=='shaved'){
  ellipsoid(face,hair,0,2.16,-.018,.185,.12,.177);
  if(look.style==='curls')for(let i=0;i<8;i++)ellipsoid(face,hair,Math.cos(i)*.16,2.22+Math.sin(i*2)*.035,Math.sin(i)*.13,.09,.09,.09);
  if(look.style==='bun')ellipsoid(face,hair,0,2.33,-.07,.105,.11,.105);
 }
 const tail=look.style==='ponytail'?ellipsoid(face,hair,0,1.96,-.23,.07,.25,.08):null;
 for(const side of [-1,1]){const brow=box(face,.07,.012,.013,hair,side*.074,2.058,.172);brow.rotation.z=side*.10;}
 const mouth=box(face,.075,.008,.012,material('#805442'),0,1.855,.128);
 const badge=mesh(body,new T.PlaneGeometry(.29,.09),label('TenAce','#'+shirt.color.getHexString(),'#ffffff',256,64),0,1.38,.195);
 const rear=mesh(body,new T.PlaneGeometry(.29,.09),badge.material,0,1.38,-.195);rear.rotation.y=Math.PI;
 const seamMat=material('#'+shirt.color.clone().multiplyScalar(.63).getHexString());
 for(const side of [-1,1]){const panel=mesh(body,contour([[0,.025,.02],[.1,.03,.025],[.29,.034,.025],[.43,.025,.02]],12),seamMat,side*.215,1.04,.08);panel.rotation.z=-side*.12;}
 const hips=ellipsoid(body,shorts,0,.98,0,.24,.13,.17);
 const legs=[-1,1].map(side=>({side,kit:bone(root,shorts,.128),thigh:bone(root,skin,.095),knee:ellipsoid(root,skin,0,0,0,.087,.093,.09),shin:bone(root,skin,.074),sock:bone(root,white,.077),shoe:ellipsoid(root,white,side*.25,.09,.10,.105,.09,.20)}));
 const arms=[-1,1].map(side=>({side,upper:bone(body,skin,.066),fore:bone(body,skin,.057),hand:ellipsoid(body,skin,0,0,0,.065,.075,.055),sleeve:ellipsoid(body,shirt,side*.27,1.51,0,.11,.13,.11)}));
 const racket=new T.Group();body.add(racket);
 const rw=look.frame==='power'?.24:look.frame==='control'?.17:.20;
 const rim=mesh(racket,new T.TorusGeometry(rw,.017,6,28),material(look.racket),0,.34,0);rim.scale.y=look.frame==='control'?1.55:1.3;
 const grip=box(racket,.035,.20,.035,dark,0,.02,0);
 const points=[];for(let n=-4;n<=4;n++){const x=n*rw/5,yy=Math.sqrt(rw*rw-x*x)*1.3;points.push(new T.Vector3(x,.34-yy,0),new T.Vector3(x,.34+yy,0));const y=n*rw*1.3/5,xx=Math.sqrt(rw*rw-(y/1.3)**2);points.push(new T.Vector3(-xx,.34+y,0),new T.Vector3(xx,.34+y,0));}
 racket.add(new T.LineSegments(new T.BufferGeometry().setFromPoints(points),new T.LineBasicMaterial({color:'#dbe6e9',transparent:true,opacity:.7})));
 let lastX=null,stride=0;
 function pose(p,time,dt,event){
  root.position.copy(world(p.x,p.y));root.rotation.y=p.near?Math.PI:0;
  const dx=lastX===null?0:p.x-lastX;lastX=p.x;stride+=Math.abs(dx)*85;const run=Math.min(1,Math.abs(p.tx-p.x)*13+Math.abs(dx)*35),step=Math.sin(stride)*run,load=p.charge||0,ready=p.ready?1:0,split=ready?(1+Math.cos(time*8))*.012:0,lower=load*.10+ready*.06+(p.serve?.04:0);
  body.position.y=Math.abs(step)*.025-lower+split;body.rotation.x=p.serve?-.06:load*.10;body.rotation.y=Math.sin((p.swing||0)*Math.PI)*.65*(p.side||1)-load*.5;
  hips.rotation.z=step*.035;
  for(const l of legs){const s=l.side,foot=new T.Vector3(s*(.25+run*.12+ready*.055)+step*.10,.09+Math.max(0,step*s)*.09,step*s*.18+(p.serve?s*.17:0)),knee=new T.Vector3(s*(.24+ready*.045),.51-lower*.5,-.12-lower*.65-step*s*.1),hip=new T.Vector3(s*.13,.96-lower+split,0);connect(l.kit,hip,hip.clone().lerp(knee,.5));l.knee.position.copy(knee);connect(l.thigh,hip,knee);connect(l.shin,knee,foot);connect(l.sock,foot.clone().add(new T.Vector3(0,.16,0)),foot);l.shoe.position.copy(foot).add(new T.Vector3(0,0,.07));}
  let hand=new T.Vector3(.47,1.20,.24),left=new T.Vector3(-.40,1.20,.2);
  const phase=1-(p.swing||0),swinging=(p.swing||0)>0;
  if(swinging){hand.set(.48*Math.cos(phase*Math.PI*1.5),1.12+Math.sin(phase*Math.PI)*(p.shot==='lob'?.8:p.shot==='slice'?.06:.35),.35+Math.sin(phase*Math.PI)*.35);}
  if(swinging&&event?.shot==='serve'&&time-event.time<.4)hand.set(.3,2.1-phase,.15+phase*.45);
  if(p.serve){hand.set(.30,2.12,-.15);left.set(-.25,2.35,.1);}
  if(p.celebrate){hand.set(.50,2.22,0);left.set(-.5,2.22,0);}
  if(p.ready&&!swinging)hand.set(.37,1.24,.42);
  if(load&&!swinging){hand.set(.46+load*.1,1.18+load*.12,.2-load*.55);left.set(-.37,1.27,.25+load*.22);}
  if(event&&time-event.time<.8){
   root.updateMatrixWorld(true);body.updateMatrixWorld(true);const contactHand=body.worldToLocal(event.point.clone());contactHand.y-=.34;
   const u=Math.max(0,Math.min(1,(time-event.time-.10)/.38)),ease=u*u*(3-2*u);
   const backhand=contactHand.x<0;
   const finish=event.shot==='serve'?new T.Vector3(-.48,.92,.4):p.shot==='lob'?new T.Vector3(-.10,2.0,.45):p.shot==='slice'?new T.Vector3(-.42,.85,.45):p.shot==='flat'?new T.Vector3(-.5,1.25,.48):new T.Vector3(-.42,1.75,.4);
   if(backhand)finish.x=-finish.x;
   const recovery=Math.max(0,Math.min(1,(time-event.time-.48)/.32)),relax=recovery*recovery*(3-2*recovery);if(backhand)left.lerp(contactHand.clone().add(new T.Vector3(-.08,.06,0)),1-relax);hand=contactHand.lerp(finish,ease).lerp(hand,relax);
  }
  for(const a of arms){const end=a.side===1?hand:left,shoulder=new T.Vector3(a.side*.27,1.52,0),elbow=shoulder.clone().lerp(end,.5).add(new T.Vector3(a.side*.10,-.10,0));connect(a.upper,shoulder,elbow);connect(a.fore,elbow,end);a.hand.position.copy(end);}
  racket.position.copy(hand);racket.rotation.set(0,0,swinging?Math.sin(phase*Math.PI)*-.6:0);
  if(event&&time-event.time<.8){const age=time-event.time,u=Math.max(0,Math.min(1,(age-.1)/.38)),r=Math.max(0,Math.min(1,(age-.48)/.32));racket.rotation.set(0,0,u*(1-r*r*(3-2*r))*(p.shot==='slice'?.4:-.6));}
  if(tail)tail.rotation.x=step*.3;
 }
 return {root,pose};
}

export function create(canvas,onFailure,makeRenderer=options=>new T.WebGLRenderer(options)){
 const renderer=makeRenderer({canvas,antialias:true,powerPreference:'high-performance'});
 renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
 renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1;
 const scene=new T.Scene();scene.background=new T.Color('#a9c3cc');scene.fog=new T.Fog('#a9c3cc',32,72);
 let disposed=false,riggedFactory=null;
 const wantsRig=typeof location!=='undefined'&&new URLSearchParams(location.search).get('rigged')==='1';
 if(wantsRig){import('./rigged-player.js').then(async module=>{await module.loadRigAssets();if(disposed)return;riggedFactory=module.createRig;document.dispatchEvent(new CustomEvent('tenacerigstatus',{detail:'Rigged player ready'}));}).catch(()=>{if(!disposed)document.dispatchEvent(new CustomEvent('tenacerigstatus',{detail:'Character preview unavailable · Standard player active'}));});}

 const camera=new T.PerspectiveCamera(48,1,.1,100);
 scene.add(new T.HemisphereLight('#d4e8ff','#425b52',1.8));
 const sun=new T.DirectionalLight('#ffe3b8',3.0);sun.position.set(-10,20,9);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-16,right:16,top:20,bottom:-20,near:1,far:60});sun.shadow.normalBias=.03;scene.add(sun);
 const grass=material('#75957b'),blue=material('#386b91'),ivory=material('#e9eddf'),navy=material('#082239');
 grass.map=surfaceTexture('#9bb085','#c0cd9b33','#49634533');blue.map=surfaceTexture('#c3d1df','#ffffff30','#34567922');
 const ground=box(scene,70,.15,75,grass,0,-.14,0);
 box(scene,15,.03,24,material('#557f7b'),0,-.04,0);
 const surface=box(scene,10,.035,18,blue,0,-.015,0);
 function courtLine(x1,z1,x2,z2){const a=world(x1,z1),b=world(x2,z2),m=box(scene,.045,.012,a.distanceTo(b),ivory,(a.x+b.x)/2,.018,(a.z+b.z)/2);m.rotation.y=Math.atan2(b.x-a.x,b.z-a.z);}
 for(const p of [[0,0,1,0],[0,1,1,1],[0,0,0,1],[1,0,1,1],[.18,0,.18,1],[.82,0,.82,1],[.18,.21,.82,.21],[.18,.79,.82,.79],[.5,.21,.5,.79]])courtLine(...p);
 const netHeight=.065*14,netPoints=[];
 for(let x=-5.1;x<=5.11;x+=.12)netPoints.push(new T.Vector3(x,.04,0),new T.Vector3(x,netHeight,0));
 for(let y=.05;y<=netHeight;y+=.10)netPoints.push(new T.Vector3(-5.1,y,0),new T.Vector3(5.1,y,0));
 scene.add(new T.LineSegments(new T.BufferGeometry().setFromPoints(netPoints),new T.LineBasicMaterial({color:'#0a2130',transparent:true,opacity:.8})));
 box(scene,10.3,.045,.055,ivory,0,netHeight,0);
 for(const x of [-5.18,5.18])box(scene,.12,1.05,.12,navy,x,.5,0);
 // A single modeled venue: timber pavilion, shaded seating and planted boundaries.
 const wood=material('#a47c56'),stone=material('#c4c8bc'),metal=material('#244451'),hedge=material('#426959');
 box(scene,24,.3,6,stone,0,.05,-16);
 box(scene,12,3.7,3.8,material('#526d71'),0,1.95,-18);
 const glazing=new T.MeshStandardMaterial({color:'#7fa7ac',roughness:.22,metalness:.35});
 for(let x=-5;x<=5;x+=2){box(scene,1.8,2.5,.08,glazing,x,1.95,-16.05);box(scene,.09,3.7,.15,wood,x-1,1.95,-15.95);}
 box(scene,14,.20,6,wood,0,3.9,-17);
 for(const x of [-6.6,6.6])box(scene,.15,3.7,.15,wood,x,1.95,-14.5);
 for(let x=-7;x<=7;x+=.7)box(scene,.11,.13,6.2,wood,x,4.06,-17);
 const bannerMat=label('RIVERDALE  /  TENACE','#193742','#eff5db',1024,128);
 mesh(scene,new T.PlaneGeometry(11,1.0),bannerMat,0,1.05,-12.7);
 for(const x of [-7.4,7.4]){
  box(scene,.10,1.6,24,metal,x,.8,0);
  for(let z=-12;z<=12;z+=3){box(scene,.07,2.1,.07,metal,x,1.05,z);}
  for(const z of [-7,1,8]){
   box(scene,1.4,.55,2.1,stone,x+(x<0?-1.5:1.5),.22,z);
   for(let i=0;i<4;i++)ellipsoid(scene,hedge,x+(x<0?-1.5:1.5)+Math.sin(i*2)*.35,.7,z+(i-1.5)*.38,.65,.55,.55);
  }
 }
 // Tiered seating is readable in silhouette without miniature crowd placeholders.
 for(const side of [-1,1])for(let row=0;row<3;row++){
  const x=side*(10+row*.7),height=.4+row*.38;
  box(scene,.65,.16,7,wood,x,height,-9);
  for(const z of [-12,-6])box(scene,.12,height,.12,metal,x,height/2,z);
 }
 for(const side of [-1,1]){
  const x=side*8.5;box(scene,.12,7,.12,metal,x,3.5,-5);box(scene,2.2,.12,.3,metal,x,7,-5);
  for(const dx of [-.7,0,.7])box(scene,.45,.16,.35,new T.MeshStandardMaterial({color:'#f1e6bc',emissive:'#ffe7ae',emissiveIntensity:.6}),x+dx,6.94,-4.95);
 }
 const trunk=material('#73614a'),leaves=material('#4a7864');
 for(let i=0;i<10;i++){const x=-19+i*4.2,z=-23-(i%3)*2;box(scene,.35,4,.35,trunk,x,2,z);for(let j=0;j<4;j++)ellipsoid(scene,leaves,x+Math.sin(j*2.4)*1.1,4+j*.6,z+Math.cos(j*2.4),1.6,1.7,1.5);}
 for(const x of [-6.3,6.3]){box(scene,.65,.10,1.9,wood,x,.55,3);for(const z of [2.35,3.65])box(scene,.48,.5,.08,metal,x,.25,z);box(scene,.06,.45,1.9,wood,x+(x<0?-.30:.30),.82,3);}
 const grounded={};
 for(const who of ['player','opp']){const group=new T.Group();scene.add(group);for(let i=0;i<3;i++){const shadow=mesh(group,new T.CircleGeometry(.28+i*.11,28),new T.MeshBasicMaterial({color:'#071c24',transparent:true,opacity:.07,depthWrite:false}),0,.031+i*.001,0);shadow.rotation.x=-Math.PI/2;shadow.scale.y=.55;shadow.castShadow=shadow.receiveShadow=false;}grounded[who]=group;}

 const orb=mesh(scene,new T.SphereGeometry(.10,14,10),new T.MeshStandardMaterial({color:'#dfff29',emissive:'#4e5905',roughness:.65}));
 const trail=Array.from({length:10},()=>{const m=mesh(scene,new T.SphereGeometry(.065,8,6),new T.MeshBasicMaterial({color:'#e6fb8c',transparent:true,opacity:.2}));m.castShadow=false;return m;});
 const target=mesh(scene,new T.RingGeometry(.27,.34,32),new T.MeshBasicMaterial({color:'#b7ff63',side:T.DoubleSide,transparent:true,opacity:.9}));target.rotation.x=-Math.PI/2;target.position.y=.04;
 const landing=target.clone();landing.material=target.material.clone();landing.material.color.set('#fff2ba');scene.add(landing);
 const contactRing=mesh(scene,new T.RingGeometry(.12,.16,24),new T.MeshBasicMaterial({color:'#f5ff9c',side:T.DoubleSide,transparent:true}));
 const rigs={},keys={},events={};let previousTheme='',viewWidth=390,viewHeight=500,portraitRig=null,portraitKey='';
 const portraitScene=new T.Scene();portraitScene.background=new T.Color('#102e3b');portraitScene.add(new T.HemisphereLight('#e8f2ff','#657467',2.6));const portraitLight=new T.DirectionalLight('#ffe9cf',2.4);portraitLight.position.set(-3,5,4);portraitScene.add(portraitLight);const portraitCamera=new T.PerspectiveCamera(34,1,.1,20);
 function disposeObject(root){root.userData.release?.();const geometries=new Set(),materials=new Set();root.traverse(o=>{if(o.geometry)geometries.add(o.geometry);for(const m of [o.material].flat().filter(Boolean))materials.add(m)});geometries.forEach(g=>g.dispose());materials.forEach(m=>{for(const key of ["map","normalMap","roughnessMap"])m[key]?.dispose();m.dispose()});}
 function setQuality(quality){renderer.setPixelRatio(Math.min(devicePixelRatio||1,quality==='low'?1:1.5));renderer.shadowMap.enabled=quality!=='low';scene.traverse(o=>{if(o.material)for(const m of [o.material].flat())m.needsUpdate=true;});}
 function resize(w,h){viewWidth=w;viewHeight=h;renderer.setSize(w,h,false);camera.aspect=w/h;camera.position.set(0,11.5,20+Math.max(0,.72-camera.aspect)*10);camera.lookAt(0,.2,1.2);camera.updateProjectionMatrix();}
 function portrait(target,look,full=false){
  const useRig=riggedFactory&&target.id!=='rivalPortrait',key=JSON.stringify(look)+(useRig?'rigged':'standard');if(key!==portraitKey){if(portraitRig){portraitScene.remove(portraitRig.root);disposeObject(portraitRig.root);}portraitRig=useRig?riggedFactory(look):athlete(look);portraitScene.add(portraitRig.root);portraitKey=key;}
  portraitRig.pose({x:.5,y:.5,tx:.5,near:false,ready:false},0,0,null);
  const w=target.width||240,h=target.height||240;portraitCamera.aspect=w/h;portraitCamera.fov=full?38:26;portraitCamera.position.set(full?.3:0,full?1.4:1.75,full?3.7:2.45);portraitCamera.lookAt(0,full?1.16:1.72,0);portraitCamera.updateProjectionMatrix();
  try{renderer.setSize(w,h,false);renderer.render(portraitScene,portraitCamera);target.getContext('2d').drawImage(canvas,0,0,w,h);}finally{renderer.setSize(viewWidth,viewHeight,false);renderer.render(scene,camera);}
 }
 function contact(who,b,shot,time){events[who]={point:world(b.x,b.y,b.z||.12),shot,time};}
 function render(s){
  if(previousTheme!==s.theme){blue.color.set(s.theme==='terrace'?'#bd775c':'#386b91');scene.background.set(s.theme==='terrace'?'#cfbfb3':'#a9c3cc');scene.fog.color.copy(scene.background);bannerMat.map?.dispose();const replacement=label(s.theme==='terrace'?'SOLSTICE  /  TENACE':'RIVERDALE  /  TENACE','#193742','#eff5db',1024,128);bannerMat.map=replacement.map;replacement.dispose();bannerMat.needsUpdate=true;previousTheme=s.theme;}
  for(const who of ['player','opp']){grounded[who].position.copy(world(s[who].x,s[who].y));const look=s[who].look,key=JSON.stringify(look)+(riggedFactory&&who==='player'?'rigged':'standard');if(keys[who]!==key){if(rigs[who]){scene.remove(rigs[who].root);disposeObject(rigs[who].root);}rigs[who]=riggedFactory&&who==='player'?riggedFactory(look):athlete(look);scene.add(rigs[who].root);keys[who]=key;}rigs[who].pose(s[who],s.time,s.dt,events[who]);}
  orb.visible=s.ball.active||s.serving;
  orb.position.copy(s.serving?world(s.player.x,s.player.y, .17+Math.abs(Math.sin(s.time*3))*.035):world(s.ball.x,s.ball.y,s.ball.z||0));
  for(let i=0;i<trail.length;i++){const p=s.ball.trail?.[i];trail[i].visible=!!p&&s.ball.active;if(p){trail[i].position.copy(world(p.x,p.y,p.z||0));trail[i].material.opacity=i/trail.length*.24;}}
  target.visible=!!s.aim;if(s.aim)target.position.copy(world(s.aim.x,s.aim.y)).y=.04;
  landing.visible=s.ball.active&&s.ball.last==='opp'&&s.landing?.y<1&&s.landing?.y>.5;if(landing.visible)landing.position.copy(world(s.landing.x,s.landing.y)).y=.035;
  const event=Object.values(events).sort((a,b)=>b.time-a.time)[0],age=event?s.time-event.time:1;contactRing.visible=age>=0&&age<.22;if(contactRing.visible){contactRing.position.copy(event.point);contactRing.quaternion.copy(camera.quaternion);contactRing.scale.setScalar(1+age*5);contactRing.material.opacity=1-age/.22;}

  renderer.render(scene,camera);
 }
 const lost=e=>{e.preventDefault();onFailure();};canvas.addEventListener('webglcontextlost',lost);
 function dispose(){disposed=true;canvas.removeEventListener('webglcontextlost',lost);disposeObject(scene);disposeObject(portraitScene);renderer.dispose();}
 return {resize,render,contact,dispose,setQuality,portrait};
}
if(typeof window!=='undefined'){window.TenAce3D={create};window.dispatchEvent(new Event('tenace3dready'));}
