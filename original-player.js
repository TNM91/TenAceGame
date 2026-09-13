import * as T from './vendor/three.module.min.js';

const V=(x=0,y=0,z=0)=>new T.Vector3(x,y,z),clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x)),ease=x=>{x=clamp(x);return x*x*(3-2*x);};
const mat=(color,roughness=.58)=>new T.MeshStandardMaterial({color,roughness,metalness:0});
function loft(rows,n=32){
 const p=[],ids=[];for(const [y,rx,rz,z=0] of rows)for(let j=0;j<=n;j++){const a=j/n*Math.PI*2;p.push(rx*Math.cos(a),y,rz*Math.sin(a)+z);}
 for(let i=0;i<rows.length-1;i++)for(let j=0;j<n;j++){const a=i*(n+1)+j,b=a+n+1;ids.push(a,b,a+1,a+1,b,b+1);}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setIndex(ids);g.computeVertexNormals();return g;
}
// Smooth authored cross-sections retain a broad chest and shaped garment hem.
function sculpt(rows,n=40){
 const curve=new T.CatmullRomCurve3(rows.map(r=>V(r[1],r[0],r[2]))),sample=[];
 for(let i=0;i<=40;i++){const v=curve.getPoint(i/40);sample.push([v.y,Math.max(.001,v.x),Math.max(.001,v.z)]);}
 return loft(sample,n);
}
function shadeSculpt(g,{fabric=false}={}){
 const p=g.attributes.position,colors=[];
 for(let i=0;i<p.count;i++){
  const x=p.getX(i),y=p.getY(i),z=p.getZ(i);
  // Baked gentle occlusion gives folds and the underside of the face readable depth.
  const light=fabric?.84+.16*clamp((z+.1)/.25):.85+.15*clamp((y+.24)/.3);
  const blush=fabric?0:Math.exp(-(((Math.abs(x)-.17)/.055)**2+((y+.09)/.065)**2))*.11;
  colors.push(light,light*(1-blush),light*(1-blush*.8));
 }
 g.setAttribute('color',new T.Float32BufferAttribute(colors,3));return g;
}
function tube(points,r=.012){return new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>V(...p))),20,r,8,false);}
function lock(points,width){
 const curve=new T.CatmullRomCurve3(points.map(p=>V(...p))),frames=curve.computeFrenetFrames(16,false),vertices=[],indices=[];
 for(let i=0;i<=16;i++){const t=i/16,center=curve.getPointAt(t),r=width*Math.sin(Math.PI*(.1+t*.9))+.002;for(let j=0;j<=12;j++){const a=j/12*Math.PI*2,p=center.clone().addScaledVector(frames.normals[i],Math.cos(a)*r).addScaledVector(frames.binormals[i],Math.sin(a)*r*.65);vertices.push(...p.toArray());}}
 for(let i=0;i<16;i++)for(let j=0;j<12;j++){const a=i*13+j,b=a+13;indices.push(a,b,a+1,a+1,b,b+1);}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(vertices,3));g.setIndex(indices);g.computeVertexNormals();return g;
}
function joint(mesh,a,b){mesh.position.copy(a).add(b).multiplyScalar(.5);mesh.scale.y=a.distanceTo(b);mesh.quaternion.setFromUnitVectors(V(0,1,0),b.clone().sub(a).normalize());}

function limbGeometry(){
 const g=new T.BufferGeometry(),ids=[];g.setAttribute('position',new T.Float32BufferAttribute(new Float32Array(17*13*3),3));
 for(let i=0;i<16;i++)for(let j=0;j<12;j++){const a=i*13+j,b=a+13;ids.push(a,b,a+1,a+1,b,b+1);}g.setIndex(ids);return g;
}
function bendLimb(geometry,start,elbow,end,radii){
 const curve=new T.CatmullRomCurve3([start,elbow,end]),frames=curve.computeFrenetFrames(16,false),p=geometry.attributes.position;
 for(let i=0;i<=16;i++){const t=i/16,center=curve.getPointAt(t),u=t<.5?t*2:(t-.5)*2,k=t<.5?0:1,r=T.MathUtils.lerp(radii[k],radii[k+1],ease(u));
  for(let j=0;j<=12;j++){const a=j/12*Math.PI*2,v=center.clone().addScaledVector(frames.normals[i],Math.cos(a)*r).addScaledVector(frames.binormals[i],Math.sin(a)*r);p.setXYZ(i*13+j,v.x,v.y,v.z);}
 }
 p.needsUpdate=true;geometry.computeVertexNormals();geometry.computeBoundingSphere();
}

// A continuous facial surface supplies cheeks, brow ridge, eye sockets and nose.
// Features are deformations of the head rather than separate balls stuck to it.
function faceSculpt(){
 const rows=[[-.255,.105,.095,.022],[-.22,.177,.145,.022],[-.14,.233,.184,.006],[-.045,.253,.207,0],[.07,.252,.207,0],[.18,.229,.192,0],[.265,.17,.145,0],[.31,.035,.04,0],[.315,.001,.001,0]];
 const curve=new T.CatmullRomCurve3(rows.map(r=>V(r[1],r[0],r[2]))),smooth=[];
 for(let i=0;i<=64;i++){const p=curve.getPoint(i/64);smooth.push([p.y,Math.max(.001,p.x),Math.max(.001,p.z)]);}
 const g=loft(smooth,64),p=g.attributes.position;
 const bump=(x,y,cx,cy,sx,sy)=>Math.exp(-(((x-cx)/sx)**2+((y-cy)/sy)**2));
 for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i);if(z>0){
  const front=clamp(z/.14),nose=.05*bump(x,y,0,-.059,.048,.043)+.027*bump(x,y,0,.005,.034,.085);
  const cheeks=.012*(bump(x,y,-.15,-.095,.065,.06)+bump(x,y,.15,-.095,.065,.06));
  const sockets=-.013*(bump(x,y,-.103,.025,.063,.036)+bump(x,y,.103,.025,.063,.036));
  p.setZ(i,z+front*(nose+cheeks+sockets));
 }}
 g.computeVertexNormals();return g;
}

// Original stylized athlete, authored directly as editable geometry. No stock mesh.
export function createOriginal(look={}){
 const root=new T.Group();root.name='TenAceOriginalAthlete';root.scale.setScalar(1.08);
 const skin=mat(look.skin||'#e6ac7e',.82),hair=mat(look.hair||'#233147',.66),shirt=mat(look.shirt||'#42c9ca',.94),shorts=mat(look.shorts||'#233553',.96),white=mat('#fff6df',.84),ink=mat('#152239',.75),accent=mat(look.racket||'#ebbc5a',.32);accent.metalness=.22;
 const panel=mat('#'+shirt.color.clone().multiplyScalar(.5).getHexString()),cheek=mat('#'+skin.color.clone().multiply(new T.Color('#ed9c89')).getHexString());
 function add(parent,g,m,x=0,y=0,z=0,outline=false){const o=new T.Mesh(g,m);o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;parent.add(o);if(outline){const edge=new T.Mesh(g,new T.MeshBasicMaterial({color:'#263849',side:T.BackSide}));edge.scale.setScalar(1.008);edge.castShadow=false;o.add(edge);}return o;}
 function oval(parent,m,x,y,z,sx,sy,sz,outline=false){const o=add(parent,new T.SphereGeometry(1,32,24),m,x,y,z,outline);o.scale.set(sx,sy,sz);return o;}
 const body=new T.Group();root.add(body);
 const cloth=shirt.clone();cloth.vertexColors=true;
 const faceMaterial=skin.clone();faceMaterial.vertexColors=true;
 const torso=add(body,shadeSculpt(sculpt([[.91,.13,.095],[.95,.222,.155],[1.02,.23,.161],[1.12,.211,.148],[1.29,.259,.175],[1.43,.32,.182],[1.49,.30,.151],[1.535,.19,.105],[1.54,.096,.077]]),{fabric:true}),cloth);
 add(body,sculpt([[.918,.14,.1],[.941,.223,.157],[.967,.229,.161]]),panel);
 // A connected waistband closes the gap between the two independently moving legs.
 add(body,sculpt([[.79,.17,.125],[.84,.227,.153],[.94,.227,.154],[.965,.208,.145]]),shorts);
 for(const side of [-1,1]){
  add(body,tube([[side*.224,.985,.055],[side*.214,1.13,.065],[side*.277,1.36,.08],[side*.304,1.43,.06]],.012),white);
  add(body,tube([[side*.145,1.49,.115],[side*.223,1.475,.14],[side*.29,1.445,.13]],.011),accent);
 }
 const collar=add(body,new T.TorusGeometry(.095,.021,12,40),panel,0,1.542,0);collar.rotation.x=Math.PI/2;collar.scale.y=.83;
 add(body,tube([[-.081,1.546,.051],[0,1.489,.145],[.081,1.546,.051]],.012),white);
 oval(body,skin,0,1.602,-.007,.088,.11,.082);
 // Larger sculpted head and broad cheek planes read at phone gameplay scale.
 const head=new T.Group();head.position.set(0,1.87,.012);head.scale.setScalar(.98);body.add(head);
 add(head,shadeSculpt(faceSculpt()),faceMaterial);
 for(const side of [-1,1]){oval(head,skin,side*.243,-.035,0,.04,.064,.038);oval(head,cheek,side*.25,-.035,.026,.015,.03,.009);}
 const eyes=[];
 for(const side of [-1,1]){
  const eye=new T.Group();eye.position.set(side*.104,.025,.187);eye.rotation.y=side*.14;head.add(eye);eyes.push(eye);
  oval(eye,white,0,0,0,.054,.027,.012);
  oval(eye,mat('#42666d',.45),-side*.007,-.001,.011,.019,.023,.007);oval(eye,ink,-side*.007,-.001,.018,.01,.016,.004);oval(eye,white,-side*.007-.005,.008,.022,.004,.005,.002);
  add(eye,tube([[-.052,.002,0],[-.025,.024,.006],[.025,.022,.006],[.052,.002,0]],.008),skin);
 }
 const brows=[];for(const side of [-1,1]){const brow=add(head,tube([[side*.042,.083,.201],[side*.091,.105,.201],[side*.163,.087,.17]],.018),hair);brows.push(brow);}
 const smile=add(head,tube([[-.065,-.169,.174],[0,-.173,.18],[.065,-.15,.174]],.005),mat('#785343',.95));
 // Swept sculpted locks, with separate ridges rather than a cap of spheres.
 const hairGroup=new T.Group();head.add(hairGroup);
 if(look.style!=='shaved'){
  add(hairGroup,loft([[.14,.229,.19,-.018],[.2,.244,.21,-.018],[.27,.231,.20,-.021],[.33,.191,.161,-.023],[.365,.11,.088,-.026],[.38,.002,.002,-.026]],48),hair);
  if(look.style==='curls')for(let i=0;i<9;i++){
   const x=-.19+(i%5)*.095,y=.23+Math.floor(i/5)*.085,z=.17-Math.floor(i/5)*.13;
   add(hairGroup,lock([[x-.035,y,z],[x-.06,y+.08,z+.025],[x+.015,y+.12,z],[x+.05,y+.035,z+.02]],.06),hair);
  }
  else for(let i=0;i<3;i++){
   const x=-.15+i*.09,peak=.335+i*.012;
   add(hairGroup,lock([[x,.165,.176],[x+.015,.255,.218],[x+.10,peak,.12],[x+.16,.28,.02]],.062),hair);
  }
  if(look.style==='bun')oval(hairGroup,hair,0,.38,-.17,.115,.105,.12,true);
  if(look.style==='ponytail')add(hairGroup,tube([[0,.24,-.18],[.02,.12,-.30],[.04,-.16,-.28]],.067),hair);
 }
 const band=add(head,loft([[.144,.236,.207],[.183,.239,.21]]),white,0,0,-.012);
 // Small shield emblem is geometric, so it stays crisp without a texture download.
 const crest=add(body,new T.CircleGeometry(.049,6),white,-.137,1.375,.158);crest.rotation.z=Math.PI/6;
 add(body,new T.CircleGeometry(.029,6),accent,-.137,1.375,.160);
 // Palms, curled fingers and an opposing thumb replace spherical hands.
 function makeHand(side){
  const hand=new T.Group();hand.name=side<0?'RacketHand':'SupportHand';root.add(hand);
  oval(hand,skin,0,0,0,.046,.062,.027);
  for(let i=0;i<4;i++){
   const x=-.033+i*.022,y=.028-Math.abs(i-1.5)*.008;
   add(hand,tube([[x,y,.014],[x,y+.02,.035],[x,y-.008,.047],[x,y-.028,.027]],.012),skin);
  }
  add(hand,tube([[side*.039,-.033,0],[side*.06,-.009,.019],[side*.036,.007,.047]],.016),skin);
  return hand;
 }
 const arms=[-1,1].map(side=>{
  const sleeve=add(body,sculpt([[-.13,.086,.095],[-.11,.096,.106],[.02,.121,.126],[.095,.099,.108],[.13,.037,.062]]),shirt,side*.286,1.419,0);
  sleeve.rotation.z=side*.39;
  const cuff=add(sleeve,new T.TorusGeometry(.09,.009,8,32),panel,0,-.112,0);cuff.rotation.x=Math.PI/2;
  return {side,surface:add(root,limbGeometry(),skin),hand:makeHand(side),sleeve,wrist:add(root,new T.CylinderGeometry(.055,.055,.071,20),white)};
 });
 const legs=[-1,1].map(side=>{
  const shoe=new T.Group();shoe.name=side<0?'RightFoot':'LeftFoot';root.add(shoe);
  oval(shoe,white,0,.076,.06,.112,.083,.21,true);oval(shoe,panel,0,.015,.055,.119,.031,.215);
  oval(shoe,shirt,0,.08,-.064,.113,.06,.077);
  for(const edge of [-1,1])add(shoe,tube([[edge*.098,.063,-.02],[edge*.107,.061,.04],[edge*.075,.09,.135]],.008),accent);
  add(shoe,tube([[0,.13,-.09],[0,.17,-.105],[0,.175,-.065]],.012),panel);
  for(let i=0;i<3;i++)add(shoe,tube([[-.055,.143,.0+i*.028],[0,.15,.009+i*.028],[.055,.143,.0+i*.028]],.007),white);
  const kit=add(root,sculpt([[-.5,.134,.145],[-.42,.14,.148],[.4,.128,.143],[.5,.12,.136]]),shorts);
  const hem=add(kit,loft([[-.49,.136,.147],[-.45,.141,.15]]),panel);
  return {side,kit,surface:add(root,limbGeometry(),skin),sock:add(root,new T.CylinderGeometry(.059,.053,1,20),white),shoe};
 });
 const racket=new T.Group();root.add(racket);racket.name='Racket';
 const width=look.frame==='power'?.21:look.frame==='control'?.16:.185;
 const rim=add(racket,new T.TorusGeometry(width,.018,12,48),accent,0,.36,0,true);rim.name='RacketContact';rim.scale.y=1.28;
 add(racket,new T.CylinderGeometry(.019,.023,.21,16),ink,0,.055,0);
 for(const side of [-1,1])add(racket,tube([[0,.15,0],[side*.065,.20,0],[side*.11,.22,0]],.012),accent);
 const strings=[];for(let i=-5;i<=5;i++){const x=i*width/6,y=Math.sqrt(width*width-x*x)*1.28;strings.push(V(x,.36-y,0),V(x,.36+y,0));const yy=i*width*1.28/6,xx=Math.sqrt(width*width-(yy/1.28)**2);strings.push(V(-xx,.36+yy,0),V(xx,.36+yy,0));}
 racket.add(new T.LineSegments(new T.BufferGeometry().setFromPoints(strings),new T.LineBasicMaterial({color:'#eff0dc',transparent:true,opacity:.65})));
 racket.traverse(o=>{o.castShadow=false;});
 let priorX=null,steps=0,lastEvent=null,contactTurn=0,celebrateAt=null;
 function pose(p,time,dt,event){
  root.position.set((p.x-.5)*10,0,(p.y-.5)*18);root.rotation.y=p.near?Math.PI:0;
  const dx=priorX===null?0:p.x-priorX;priorX=p.x;steps+=p.preview==='run'?dt*9:Math.abs(dx)*95;
  const run=p.preview==='run'?1:clamp(Math.abs(dx)/Math.max(.001,dt)*2),load=clamp(p.charge||0),age=event?time-event.time:10;
  const stroke=age>=0&&age<.85,follow=stroke?Math.sin(Math.PI*ease(age/.85)):0;
  root.updateMatrixWorld(true);const contact=event?root.worldToLocal(event.point.clone()):V(-.4,1.2,.3),back=contact.x>0;
  const crouch=.07+load*.13,step=Math.sin(steps)*run;
  if(p.celebrate&&celebrateAt===null)celebrateAt=time;
  if(!p.celebrate)celebrateAt=null;
  const victory=celebrateAt===null?0:ease((time-celebrateAt)/.23),pump=victory*Math.sin(Math.min(1,(time-celebrateAt)/.65)*Math.PI);
  const weight=(back?-1:1)*follow*.065;
  if(stroke&&event!==lastEvent){contactTurn=body.rotation.y;lastEvent=event;}
  body.position.set(weight,-crouch+Math.abs(step)*.025+victory*.045,0);body.rotation.set(load*.15-follow*.06,stroke?contactTurn*(1-ease(age/.3))+(back?-.7:.7)*follow:-load*.52,step*.035-weight*.7);
  head.rotation.set(-load*.06-victory*.08,-body.rotation.y*.65,Math.sin(time*1.7)*.012+victory*.08);
  hairGroup.rotation.x=Math.sin(steps)*run*.045+follow*.07;
  const blink=Math.pow(Math.max(0,Math.cos(time*1.3+2)),48);for(const eye of eyes)eye.scale.y=1-blink*.92;
  for(let i=0;i<brows.length;i++)brows[i].rotation.z=(i?1:-1)*(load*.14-victory*.12);
  smile.scale.x=1+victory*.18;
  root.updateMatrixWorld(true);
  for(const l of legs){
   const s=l.side,phase=(steps/(Math.PI*2)+(s>0?.5:0))%1,swing=phase>.58;
   // The support foot travels backward relative to the pelvis; only the other foot lifts.
   const travel=swing?-.10+.20*ease((phase-.58)/.42):.10-.20*phase/.58;
   const lift=swing?Math.sin(Math.PI*(phase-.58)/.42)*.10:0;
   const foot=V(s*.245+travel*run,.025+lift*run,(p.serve?s*.13:0)+s*.015);
   if(run>.05&&p.preview!=='run'){
    const nominal=root.localToWorld(foot.clone());
    if(!l.planted||l.planted.distanceTo(nominal)>.9)l.planted=nominal.clone();
    if(swing){
     if(!l.wasSwing)l.takeoff=l.planted.clone();
     const destination=root.localToWorld(V(s*.245+Math.sign(dx)*(p.near?-1:1)*.16,.025,s*.015));
     const worldFoot=l.takeoff.clone().lerp(destination,ease((phase-.58)/.42));worldFoot.y+=lift*root.scale.y;
     foot.copy(root.worldToLocal(worldFoot));l.planted=root.localToWorld(foot.clone());l.planted.y=.025*root.scale.y;
    }else foot.copy(root.worldToLocal(l.planted.clone()));
    l.wasSwing=swing;
   }else{l.planted=null;l.wasSwing=false;}
   const hip=root.worldToLocal(body.localToWorld(V(s*.122,.94,0)));
   const knee=hip.clone().lerp(foot,.49).add(V(s*.026,0,.15+load*.12));
   joint(l.kit,hip,hip.clone().lerp(knee,.66));bendLimb(l.surface.geometry,hip,knee,foot,[.105,.078,.052]);
   joint(l.sock,foot.clone().add(V(0,.185,0)),foot.clone().add(V(0,.055,0)));l.shoe.position.copy(foot);l.shoe.rotation.set(-lift*run*1.8,s*.12,0);
  }
  let right=V(-.29,1.16,.35),left=V(-.13,1.29,.35);
  if(load){right.lerp(V(-.46,1.35,-.2),load);left.lerp(V(.15,1.35,.38),load);}
  if(p.serve){right=V(-.23,1.93,-.09);left=V(.17,2.08,.2);}
  if(p.celebrate){right.lerp(V(-.43,1.28,.18),victory);left.lerp(V(.38,1.72+pump*.18,.15),victory);}
  if(stroke){const start=contact.clone().sub(V(0,.36,0)),finish=V(back?-.35:.35,event.shot==='slice'?1.0:event.shot==='flat'?1.25:1.58,.35),recovery=ease((age-.48)/.37);right=start.lerp(finish,ease((age-.07)/.41)).lerp(right,recovery);if(back)left.lerp(right.clone().add(V(.08,.02,0)),1-recovery);}
  for(const a of arms){
   const end=a.side<0?right:left,shoulder=root.worldToLocal(body.localToWorld(V(a.side*.30,1.43,0))),elbow=shoulder.clone().lerp(end,.52).add(V(a.side*.105,-.095,-.03));
   bendLimb(a.surface.geometry,shoulder,elbow,end,[.09,.063,.046]);
   a.hand.position.copy(end);a.hand.rotation.set(a.side<0?0:-.25,0,a.side<0?0:-.35);
   a.wrist.position.copy(end).lerp(elbow,.17);a.wrist.quaternion.setFromUnitVectors(V(0,1,0),end.clone().sub(elbow).normalize());
  }
  racket.position.copy(right);racket.rotation.z=stroke?-.32*Math.sin(Math.PI*ease((age-.07)/.78)):load*-.3;
  // Keep the string bed exactly at contact before beginning the follow-through.
  if(stroke&&age<=.07)racket.rotation.z=0;
  arms[0].hand.rotation.z=racket.rotation.z;
 }
 return {root,pose,dispose(){},kind:'original'};
}
