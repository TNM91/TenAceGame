import * as T from './vendor/three.module.min.js';

const V=(x=0,y=0,z=0)=>new T.Vector3(x,y,z),clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x)),ease=x=>{x=clamp(x);return x*x*(3-2*x);};
const mat=(color,roughness=.58)=>new T.MeshStandardMaterial({color,roughness,metalness:0});
function loft(rows,n=32){
 const p=[],ids=[];for(const [y,rx,rz,z=0] of rows)for(let j=0;j<=n;j++){const a=j/n*Math.PI*2;p.push(rx*Math.cos(a),y,rz*Math.sin(a)+z);}
 for(let i=0;i<rows.length-1;i++)for(let j=0;j<n;j++){const a=i*(n+1)+j,b=a+n+1;ids.push(a,b,a+1,a+1,b,b+1);}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setIndex(ids);g.computeVertexNormals();return g;
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
  const front=clamp(z/.14),nose=.075*bump(x,y,0,-.065,.041,.047)+.03*bump(x,y,0,.005,.032,.09);
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
 const torso=add(body,loft([[.93,.12,.08],[.97,.22,.15],[1.08,.22,.15],[1.23,.235,.16],[1.4,.28,.17],[1.48,.29,.16],[1.55,.18,.105],[1.57,.105,.085]]),shirt,0,0,0,true);
 add(body,loft([[.97,.225,.155],[1.005,.23,.155]]),panel);
 for(const side of [-1,1]){const stripe=add(body,tube([[side*.215,1.03,.06],[side*.228,1.24,.09],[side*.252,1.43,.085]],.022),white);}
 const collar=add(body,new T.TorusGeometry(.105,.018,10,40),white,0,1.568,0);collar.rotation.x=Math.PI/2;
 oval(body,skin,0,1.615,0,.087,.09,.087);
 // Larger sculpted head and broad cheek planes read at phone gameplay scale.
 const head=new T.Group();head.position.set(0,1.91,.01);head.scale.setScalar(.91);body.add(head);
 add(head,faceSculpt(),skin);
 for(const side of [-1,1]){oval(head,skin,side*.243,-.035,0,.04,.064,.038);oval(head,cheek,side*.25,-.035,.026,.015,.03,.009);}
 const eyes=[];
 for(const side of [-1,1]){
  const eye=new T.Group();eye.position.set(side*.104,.025,.187);eye.rotation.y=side*.14;head.add(eye);eyes.push(eye);
  oval(eye,white,0,0,0,.054,.027,.012);
  oval(eye,mat('#42666d',.45),-side*.007,-.001,.011,.019,.023,.007);oval(eye,ink,-side*.007,-.001,.018,.01,.016,.004);oval(eye,white,-side*.007-.005,.008,.022,.004,.005,.002);
  add(eye,tube([[-.052,.002,0],[-.025,.024,.006],[.025,.022,.006],[.052,.002,0]],.008),skin);
 }
 const brows=[];for(const side of [-1,1]){const brow=add(head,tube([[side*.048,.079,.201],[side*.098,.093,.201],[side*.158,.083,.17]],.013),hair);brows.push(brow);}
 add(head,tube([[-.06,-.169,.174],[0,-.173,.18],[.057,-.157,.174]],.0045),mat('#785343',.95));
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
 const crest=add(body,new T.CircleGeometry(.049,6),white,-.117,1.387,.164);crest.rotation.z=Math.PI/6;
 add(body,new T.CircleGeometry(.029,6),accent,-.117,1.387,.166);
 const arms=[-1,1].map(side=>({side,upper:add(root,loft([[-.5,.07,.07],[-.32,.09,.085],[.15,.078,.075],[.5,.055,.056]],20),skin),fore:add(root,loft([[-.5,.055,.052],[-.12,.069,.059],[.5,.048,.044]],20),skin),elbow:oval(root,skin,0,0,0,.06,.063,.06),hand:oval(root,skin,0,0,0,.06,.069,.064),sleeve:oval(body,shirt,side*.274,1.45,0,.105,.13,.12,true),wrist:add(root,new T.CylinderGeometry(.055,.055,.069,20),white)}));
 for(const a of arms){a.upper.visible=a.fore.visible=a.elbow.visible=false;a.surface=add(root,limbGeometry(),skin);}
 const legs=[-1,1].map(side=>{
  const shoe=new T.Group();root.add(shoe);
  oval(shoe,white,0,.076,.06,.112,.083,.21,true);oval(shoe,panel,0,.015,.055,.119,.031,.215);
  oval(shoe,shirt,0,.08,-.064,.113,.06,.077);
  for(let i=0;i<3;i++)add(shoe,tube([[-.055,.143,.0+i*.028],[0,.15,.009+i*.028],[.055,.143,.0+i*.028]],.007),white);
  return {side,kit:add(root,loft([[-.5,.14,.145],[-.40,.145,.148],[.45,.136,.15],[.5,.13,.14]],24),shorts,0,0,0,true),thigh:add(root,loft([[-.5,.072,.073],[0,.089,.089],[.5,.104,.097]],24),skin),shin:add(root,loft([[-.5,.052,.06],[-.15,.065,.073],[.18,.078,.087],[.5,.075,.074]],24),skin),knee:oval(root,skin,0,0,0,.078,.083,.081),sock:add(root,new T.CylinderGeometry(.057,.053,1,20),white),shoe};
 });
 for(const l of legs){l.thigh.visible=l.shin.visible=l.knee.visible=false;l.surface=add(root,limbGeometry(),skin);}
 const racket=new T.Group();root.add(racket);racket.name='Racket';
 const width=look.frame==='power'?.21:look.frame==='control'?.16:.185;
 const rim=add(racket,new T.TorusGeometry(width,.018,12,48),accent,0,.36,0,true);rim.name='RacketContact';rim.scale.y=1.28;
 add(racket,new T.CylinderGeometry(.019,.023,.21,16),ink,0,.055,0);
 for(const side of [-1,1])add(racket,tube([[0,.15,0],[side*.065,.20,0],[side*.11,.22,0]],.012),accent);
 const strings=[];for(let i=-5;i<=5;i++){const x=i*width/6,y=Math.sqrt(width*width-x*x)*1.28;strings.push(V(x,.36-y,0),V(x,.36+y,0));const yy=i*width*1.28/6,xx=Math.sqrt(width*width-(yy/1.28)**2);strings.push(V(-xx,.36+yy,0),V(xx,.36+yy,0));}
 racket.add(new T.LineSegments(new T.BufferGeometry().setFromPoints(strings),new T.LineBasicMaterial({color:'#eff0dc',transparent:true,opacity:.65})));
 let priorX=null,steps=0,lastEvent=null,contactTurn=0;
 function pose(p,time,dt,event){
  root.position.set((p.x-.5)*10,0,(p.y-.5)*18);root.rotation.y=p.near?Math.PI:0;
  const dx=priorX===null?0:p.x-priorX;priorX=p.x;steps+=p.preview==='run'?dt*9:Math.abs(dx)*95;
  const run=p.preview==='run'?1:clamp(Math.abs(dx)/Math.max(.001,dt)*2),load=clamp(p.charge||0),age=event?time-event.time:10;
  const stroke=age>=0&&age<.85,follow=stroke?Math.sin(Math.PI*ease(age/.85)):0;
  root.updateMatrixWorld(true);const contact=event?root.worldToLocal(event.point.clone()):V(-.4,1.2,.3),back=contact.x>0;
  const crouch=.045+load*.10,step=Math.sin(steps)*run;
  if(stroke&&event!==lastEvent){contactTurn=body.rotation.y;lastEvent=event;}
  body.position.y=-crouch+Math.abs(step)*.025;body.rotation.set(load*.08,stroke?contactTurn*(1-ease(age/.3))+(back?-.7:.7)*follow:-load*.52,step*.035);
  head.rotation.set(-load*.06,-body.rotation.y*.6,Math.sin(time*1.7)*.025);
  hairGroup.rotation.x=Math.sin(steps)*run*.045+follow*.07;
  const blink=Math.pow(Math.max(0,Math.cos(time*1.3+2)),48);for(const eye of eyes)eye.scale.y=1-blink*.92;
  for(let i=0;i<brows.length;i++)brows[i].rotation.z=(i?1:-1)*load*.14;
  root.updateMatrixWorld(true);
  for(const l of legs){const s=l.side,foot=V(s*(.19+load*.045)+step*.06,.025+Math.max(0,step*s)*.08,s*step*.1+(p.serve?s*.12:0));
   const hip=body.localToWorld(V(s*.115,.98,0));root.worldToLocal(hip);const knee=hip.clone().lerp(foot,.52).add(V(s*.04,0,.10+load*.07));
   joint(l.kit,hip,hip.clone().lerp(knee,.65));bendLimb(l.surface.geometry,hip,knee,foot,[.10,.074,.052]);joint(l.sock,foot.clone().add(V(0,.18,0)),foot.clone().add(V(0,.055,0)));l.shoe.position.copy(foot);
  }
  let right=V(-.29,1.16,.35),left=V(.27,1.19,.29);
  if(load){right.lerp(V(-.46,1.35,-.2),load);left.lerp(V(.15,1.35,.38),load);}
  if(p.serve){right=V(-.23,1.93,-.09);left=V(.17,2.08,.2);}
  if(p.celebrate){right=V(-.44,2.05,0);left=V(.44,2.05,0);}
  if(stroke){const start=contact.clone().sub(V(0,.36,0)),finish=V(back?-.35:.35,event.shot==='slice'?1.0:event.shot==='flat'?1.25:1.58,.35),recovery=ease((age-.48)/.37);right=start.lerp(finish,ease((age-.07)/.41)).lerp(right,recovery);if(back)left.lerp(right.clone().add(V(.08,.02,0)),1-recovery);}
  for(const a of arms){const end=a.side<0?right:left,shoulder=root.worldToLocal(body.localToWorld(V(a.side*.28,1.45,0))),elbow=shoulder.clone().lerp(end,.52).add(V(a.side*.09,-.07,-.015));bendLimb(a.surface.geometry,shoulder,elbow,end,[.084,.062,.049]);joint(a.fore,elbow,end);a.hand.position.copy(end);a.wrist.position.copy(end).lerp(elbow,.15);a.wrist.quaternion.copy(a.fore.quaternion);}
  racket.position.copy(right);racket.rotation.z=stroke?-.32*Math.sin(Math.PI*ease((age-.07)/.78)):load*-.3;
  // Keep the string bed exactly at contact before beginning the follow-through.
  if(stroke&&age<=.07)racket.rotation.z=0;
 }
 return {root,pose,dispose(){},kind:'original'};
}
