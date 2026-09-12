import * as T from './vendor/three.module.min.js';

// Match coordinates remain owned by physics.js: x/y in court units, z is height.
export const world=(x,y,z=0)=>new T.Vector3((x-.5)*10,z*14,(y-.5)*18);
const UP=new T.Vector3(0,1,0);
const material=color=>new T.MeshStandardMaterial({color,roughness:.78});
function mesh(parent,geometry,mat,x=0,y=0,z=0){const m=new T.Mesh(geometry,mat);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
function box(parent,w,h,d,mat,x,y,z){return mesh(parent,new T.BoxGeometry(w,h,d),mat,x,y,z);}
function ellipsoid(parent,mat,x,y,z,sx,sy,sz){const m=mesh(parent,new T.SphereGeometry(1,12,10),mat,x,y,z);m.scale.set(sx,sy,sz);return m;}
function bone(parent,mat,r){return mesh(parent,new T.CylinderGeometry(r,r*.92,1,10),mat);}
function connect(m,a,b){m.position.copy(a).add(b).multiplyScalar(.5);const delta=b.clone().sub(a);m.scale.y=delta.length();m.quaternion.setFromUnitVectors(UP,delta.normalize());}
function label(text,bg='#08253c',fg='#dff8b3',w=512,h=128){const c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');g.fillStyle=bg;g.fillRect(0,0,w,h);g.fillStyle=fg;g.textAlign='center';g.font='italic 800 '+Math.floor(h*.46)+'px system-ui';g.fillText(text,w/2,h*.67);const tx=new T.CanvasTexture(c);tx.colorSpace=T.SRGBColorSpace;return new T.MeshStandardMaterial({map:tx,roughness:.9,side:T.DoubleSide});}

export function athlete(look){
 const root=new T.Group(),skin=material(look.skin),shirt=material(look.shirt),hair=material(look.hair),shorts=material(look.shorts),white=material('#f0f2e5'),dark=material('#102333');
 const body=new T.Group();root.add(body);
 const torso=mesh(body,new T.CylinderGeometry(.27,.22,.57,12),shirt,0,1.32,0);torso.scale.z=.7;
 ellipsoid(body,skin,0,1.73,0,.12,.16,.12);
 const head=ellipsoid(body,skin,0,1.97,0,.205,.255,.195);
 ellipsoid(body,skin,-.20,1.98,0,.04,.07,.04);ellipsoid(body,skin,.20,1.98,0,.04,.07,.04);
 // All players face local +z; the near player rotates toward the opponent.
 for(const x of [-.075,.075]){ellipsoid(body,white,x,2.01,.176,.042,.025,.012);ellipsoid(body,dark,x,2.01,.188,.017,.019,.008);}
 ellipsoid(body,skin,0,1.95,.20,.038,.057,.042);
 const band=mesh(body,new T.CylinderGeometry(.207,.207,.055,20),white,0,2.13,0);
 if(look.style!=='shaved'){
  ellipsoid(body,hair,0,2.19,-.018,.21,.13,.195);
  if(look.style==='curls')for(let i=0;i<8;i++)ellipsoid(body,hair,Math.cos(i)*.16,2.22+Math.sin(i*2)*.035,Math.sin(i)*.13,.09,.09,.09);
  if(look.style==='bun')ellipsoid(body,hair,0,2.33,-.07,.105,.11,.105);
 }
 const tail=look.style==='ponytail'?ellipsoid(body,hair,0,1.96,-.23,.07,.25,.08):null;
 const badge=mesh(body,new T.PlaneGeometry(.29,.09),label('TenAce','#'+shirt.color.getHexString(),'#ffffff',256,64),0,1.38,.195);
 const rear=mesh(body,new T.PlaneGeometry(.29,.09),badge.material,0,1.38,-.195);rear.rotation.y=Math.PI;
 const hips=box(body,.46,.23,.32,shorts,0,.99,0);
 const legs=[-1,1].map(side=>({side,thigh:bone(root,skin,.095),shin:bone(root,skin,.074),sock:bone(root,white,.077),shoe:ellipsoid(root,white,side*.25,.09,.10,.105,.09,.20)}));
 const arms=[-1,1].map(side=>({side,upper:bone(body,skin,.066),fore:bone(body,skin,.057),hand:ellipsoid(body,skin,0,0,0,.065,.075,.055),sleeve:ellipsoid(body,shirt,side*.27,1.51,0,.11,.13,.11)}));
 const racket=new T.Group();body.add(racket);
 const rw=look.frame==='power'?.24:look.frame==='control'?.17:.20;
 const rim=mesh(racket,new T.TorusGeometry(rw,.017,6,28),material(look.racket),0,.34,0);rim.scale.y=look.frame==='control'?1.55:1.3;
 const grip=box(racket,.035,.20,.035,dark,0,.02,0);
 const points=[];for(let n=-4;n<=4;n++){const x=n*rw/5,yy=Math.sqrt(rw*rw-x*x)*1.3;points.push(new T.Vector3(x,.34-yy,0),new T.Vector3(x,.34+yy,0));const y=n*rw*1.3/5,xx=Math.sqrt(rw*rw-(y/1.3)**2);points.push(new T.Vector3(-xx,.34+y,0),new T.Vector3(xx,.34+y,0));}
 racket.add(new T.LineSegments(new T.BufferGeometry().setFromPoints(points),new T.LineBasicMaterial({color:'#dbe6e9',transparent:true,opacity:.7})));
 function pose(p,time,dt,event){
  root.position.copy(world(p.x,p.y));root.rotation.y=p.near?Math.PI:0;
  const run=Math.min(1,Math.abs(p.tx-p.x)*13),step=Math.sin(time*12)*run;
  body.position.y=Math.abs(step)*.04;body.rotation.y=Math.sin((p.swing||0)*Math.PI)*.35*(p.side||1);
  hips.rotation.z=step*.035;
  for(const l of legs){const s=l.side,foot=new T.Vector3(s*(.25+run*.08),.09,step*s*.33),knee=new T.Vector3(s*.24,.51,-.12-step*s*.1),hip=new T.Vector3(s*.13,.96,0);connect(l.thigh,hip,knee);connect(l.shin,knee,foot);connect(l.sock,foot.clone().add(new T.Vector3(0,.16,0)),foot);l.shoe.position.copy(foot).add(new T.Vector3(0,0,.07));}
  let hand=new T.Vector3(.47,1.20,.24),left=new T.Vector3(-.40,1.20,.2);
  const phase=1-(p.swing||0),swinging=(p.swing||0)>0;
  if(swinging){hand.set(.48*Math.cos(phase*Math.PI*1.5),1.12+Math.sin(phase*Math.PI)*(p.shot==='lob'?.8:p.shot==='slice'?.06:.35),.35+Math.sin(phase*Math.PI)*.35);}
  if(swinging&&event?.shot==='serve'&&time-event.time<.4)hand.set(.3,2.1-phase,.15+phase*.45);
  if(p.serve){hand.set(.30,2.12,-.15);left.set(-.25,2.35,.1);}
  if(p.celebrate){hand.set(.50,2.22,0);left.set(-.5,2.22,0);}
  if(p.ready&&!swinging)hand.set(.37,1.24,.42);
  if(event&&time-event.time<.10){root.updateMatrixWorld(true);body.updateMatrixWorld(true);hand=body.worldToLocal(event.point.clone());hand.y-=.34;}
  for(const a of arms){const end=a.side===1?hand:left,shoulder=new T.Vector3(a.side*.27,1.52,0),elbow=shoulder.clone().lerp(end,.5).add(new T.Vector3(a.side*.10,-.10,0));connect(a.upper,shoulder,elbow);connect(a.fore,elbow,end);a.hand.position.copy(end);}
  racket.position.copy(hand);racket.rotation.set(0,0,swinging?Math.sin(phase*Math.PI)*-.6:0);
  if(event&&time-event.time<.10)racket.rotation.set(0,0,0);
  if(tail)tail.rotation.x=step*.3;
 }
 return {root,pose};
}

export function create(canvas,onFailure,makeRenderer=options=>new T.WebGLRenderer(options)){
 const renderer=makeRenderer({canvas,antialias:true,powerPreference:'high-performance'});
 renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
 renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;
 const scene=new T.Scene();scene.background=new T.Color('#99bdd1');scene.fog=new T.Fog('#99bdd1',35,80);
 let disposed=false;
 // The existing illustrated club is a distant backdrop; every playable object is 3D.
 if(typeof Image!=='undefined'){
  const backdropMat=new T.MeshBasicMaterial({color:'#ffffff'}),backdrop=mesh(scene,new T.PlaneGeometry(50,23),backdropMat,0,10,-25);backdrop.castShadow=false;backdrop.receiveShadow=false;backdrop.visible=false;
  new T.TextureLoader().load('./assets/club-scenery-v08.png',texture=>{if(disposed){texture.dispose();return;}texture.colorSpace=T.SRGBColorSpace;backdropMat.map=texture;backdropMat.needsUpdate=true;backdrop.visible=true;},undefined,()=>{});
 }
 const camera=new T.PerspectiveCamera(52,1,.1,100);
 scene.add(new T.HemisphereLight('#e7f5ff','#466140',2.3));
 const sun=new T.DirectionalLight('#fff1cf',3.2);sun.position.set(-10,20,9);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-16,right:16,top:20,bottom:-20,near:1,far:60});sun.shadow.normalBias=.03;scene.add(sun);
 const grass=material('#477e42'),blue=material('#285b94'),ivory=material('#e9eddf'),navy=material('#082239');
 const ground=box(scene,70,.15,75,grass,0,-.14,0);
 const surface=box(scene,10,.035,18,blue,0,-.015,0);
 function courtLine(x1,z1,x2,z2){const a=world(x1,z1),b=world(x2,z2),m=box(scene,.045,.012,a.distanceTo(b),ivory,(a.x+b.x)/2,.018,(a.z+b.z)/2);m.rotation.y=Math.atan2(b.x-a.x,b.z-a.z);}
 for(const p of [[0,0,1,0],[0,1,1,1],[0,0,0,1],[1,0,1,1],[.18,0,.18,1],[.82,0,.82,1],[.18,.21,.82,.21],[.18,.79,.82,.79],[.5,.21,.5,.79]])courtLine(...p);
 const netHeight=.065*14,netPoints=[];
 for(let x=-5.1;x<=5.11;x+=.12)netPoints.push(new T.Vector3(x,.04,0),new T.Vector3(x,netHeight,0));
 for(let y=.05;y<=netHeight;y+=.10)netPoints.push(new T.Vector3(-5.1,y,0),new T.Vector3(5.1,y,0));
 scene.add(new T.LineSegments(new T.BufferGeometry().setFromPoints(netPoints),new T.LineBasicMaterial({color:'#0a2130',transparent:true,opacity:.8})));
 box(scene,10.3,.045,.055,ivory,0,netHeight,0);
 for(const x of [-5.18,5.18])box(scene,.12,1.05,.12,navy,x,.5,0);
 const bannerMat=label('TenAce iQ   ·   MORE TENNIS. LESS CHAOS.');
 box(scene,18,2.3,.10,bannerMat,0,1.2,-12);
 for(const x of [-8,8]){box(scene,.08,2.4,25,navy,x,1.2,0);for(let z=-12;z<13;z+=3)box(scene,.13,2.7,.13,ivory,x,1.3,z);}
 const building=box(scene,10,3.6,4,material('#748586'),0,1.8,-18);
 box(scene,11,.35,5,navy,0,3.7,-18);box(scene,9,1.8,.04,material('#b8d9dd'),0,2,-15.98);
 for(let x=-4;x<5;x+=2)box(scene,.1,2,.1,navy,x,2,-15.9);
 const trunk=material('#67503b'),leaves=material('#407947');
 for(let i=0;i<18;i++){const x=i%2?-11-(i%3)*2:11+(i%3)*2,z=-23+(i%9)*5;box(scene,.3,3,.3,trunk,x,1.5,z);ellipsoid(scene,leaves,x,4,z,1.8,2.4,1.7);}
 const spectators=[];
 for(let i=0;i<16;i++){const person=new T.Group();scene.add(person);person.position.set(-7+i*.9,0,-13);ellipsoid(person,material(['#aacecf','#c9a463','#dc8e75'][i%3]),0,1.45,0,.2,.34,.17);ellipsoid(person,material(i%2?'#bc8056':'#e3ba91'),0,1.93,0,.14,.17,.14);spectators.push(person);}
 for(const x of [-6.3,6.3]){box(scene,.75,.65,1.7,navy,x,.32,3);box(scene,.8,.06,1.8,ivory,x,.68,3);}
 const orb=mesh(scene,new T.SphereGeometry(.10,14,10),new T.MeshStandardMaterial({color:'#dfff29',emissive:'#4e5905',roughness:.65}));
 const trail=Array.from({length:10},()=>{const m=mesh(scene,new T.SphereGeometry(.065,8,6),new T.MeshBasicMaterial({color:'#e6fb8c',transparent:true,opacity:.2}));m.castShadow=false;return m;});
 const target=mesh(scene,new T.RingGeometry(.27,.34,32),new T.MeshBasicMaterial({color:'#b7ff63',side:T.DoubleSide,transparent:true,opacity:.9}));target.rotation.x=-Math.PI/2;target.position.y=.04;
 const landing=target.clone();landing.material=target.material.clone();landing.material.color.set('#fff2ba');scene.add(landing);
 const contactRing=mesh(scene,new T.RingGeometry(.12,.16,24),new T.MeshBasicMaterial({color:'#f5ff9c',side:T.DoubleSide,transparent:true}));
 const rigs={},keys={},events={};let previousTheme='';
 function disposeObject(root){const geometries=new Set(),materials=new Set();root.traverse(o=>{if(o.geometry)geometries.add(o.geometry);for(const m of [o.material].flat().filter(Boolean))materials.add(m)});geometries.forEach(g=>g.dispose());materials.forEach(m=>{m.map?.dispose();m.dispose()});}
 function resize(w,h){renderer.setSize(w,h,false);camera.aspect=w/h;camera.position.set(0,10.5,21+Math.max(0,.72-camera.aspect)*10);camera.lookAt(0,.5,-.6);camera.updateProjectionMatrix();}
 function contact(who,b,shot,time){events[who]={point:world(b.x,b.y,b.z||.12),shot,time};}
 function render(s){
  if(previousTheme!==s.theme){blue.color.set(s.theme==='terrace'?'#bd775c':'#285b94');scene.background.set(s.theme==='terrace'?'#c9b6ae':'#99bdd1');previousTheme=s.theme;}
  for(const who of ['player','opp']){const look=s[who].look,key=JSON.stringify(look);if(keys[who]!==key){if(rigs[who]){scene.remove(rigs[who].root);disposeObject(rigs[who].root);}rigs[who]=athlete(look);scene.add(rigs[who].root);keys[who]=key;}rigs[who].pose(s[who],s.time,s.dt,events[who]);}
  orb.visible=s.ball.active||s.serving;
  orb.position.copy(s.serving?world(s.player.x,s.player.y, .17+Math.abs(Math.sin(s.time*3))*.035):world(s.ball.x,s.ball.y,s.ball.z||0));
  for(let i=0;i<trail.length;i++){const p=s.ball.trail?.[i];trail[i].visible=!!p&&s.ball.active;if(p){trail[i].position.copy(world(p.x,p.y,p.z||0));trail[i].material.opacity=i/trail.length*.24;}}
  target.visible=!!s.aim;if(s.aim)target.position.copy(world(s.aim.x,s.aim.y)).y=.04;
  landing.visible=s.ball.active&&s.ball.last==='opp'&&s.landing?.y<1&&s.landing?.y>.5;if(landing.visible)landing.position.copy(world(s.landing.x,s.landing.y)).y=.035;
  const event=Object.values(events).sort((a,b)=>b.time-a.time)[0],age=event?s.time-event.time:1;contactRing.visible=age>=0&&age<.22;if(contactRing.visible){contactRing.position.copy(event.point);contactRing.quaternion.copy(camera.quaternion);contactRing.scale.setScalar(1+age*5);contactRing.material.opacity=1-age/.22;}
  for(let i=0;i<spectators.length;i++)spectators[i].position.y=s.celebration?Math.abs(Math.sin(s.time*7+i))*.13:0;
  renderer.render(scene,camera);
 }
 const lost=e=>{e.preventDefault();onFailure();};canvas.addEventListener('webglcontextlost',lost);
 function dispose(){disposed=true;canvas.removeEventListener('webglcontextlost',lost);disposeObject(scene);renderer.dispose();}
 return {resize,render,contact,dispose};
}
if(typeof window!=='undefined'){window.TenAce3D={create};window.dispatchEvent(new Event('tenace3dready'));}
