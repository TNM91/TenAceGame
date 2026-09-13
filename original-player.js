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

// Original stylized athlete, authored directly as editable geometry. No stock mesh.
export function createOriginal(look={}){
 const root=new T.Group();root.name='TenAceOriginalAthlete';root.scale.setScalar(1.08);
 const skin=mat(look.skin||'#e6ac7e'),hair=mat(look.hair||'#233147',.4),shirt=mat(look.shirt||'#42c9ca'),shorts=mat(look.shorts||'#233553'),white=mat('#fff6df'),ink=mat('#152239'),accent=mat(look.racket||'#ebbc5a'),shadow=mat('#101b2c');
 const panel=mat('#'+shirt.color.clone().multiplyScalar(.5).getHexString()),cheek=mat('#'+skin.color.clone().multiply(new T.Color('#ed9c89')).getHexString());
 function add(parent,g,m,x=0,y=0,z=0,outline=false){const o=new T.Mesh(g,m);o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;parent.add(o);if(outline){const edge=new T.Mesh(g,new T.MeshBasicMaterial({color:'#162334',side:T.BackSide}));edge.scale.setScalar(1.025);edge.castShadow=false;o.add(edge);}return o;}
 function oval(parent,m,x,y,z,sx,sy,sz,outline=false){const o=add(parent,new T.SphereGeometry(1,32,24),m,x,y,z,outline);o.scale.set(sx,sy,sz);return o;}
 const body=new T.Group();root.add(body);
 const torso=add(body,loft([[.93,.12,.08],[.97,.22,.15],[1.08,.22,.15],[1.23,.235,.16],[1.4,.28,.17],[1.48,.29,.16],[1.55,.18,.105],[1.57,.105,.085]]),shirt,0,0,0,true);
 add(body,loft([[.97,.225,.155],[1.005,.23,.155]]),panel);
 for(const side of [-1,1]){const stripe=add(body,tube([[side*.215,1.03,.06],[side*.228,1.24,.09],[side*.252,1.43,.085]],.022),white);}
 const collar=add(body,new T.TorusGeometry(.105,.018,10,40),white,0,1.568,0);collar.rotation.x=Math.PI/2;
 oval(body,skin,0,1.615,0,.087,.09,.087);
 // Larger sculpted head and broad cheek planes read at phone gameplay scale.
 const head=new T.Group();head.position.set(0,1.94,.01);body.add(head);
 add(head,loft([[-.27,.075,.09,.025],[-.24,.13,.125,.018],[-.17,.202,.173,.01],[-.06,.242,.202],[.07,.248,.21],[.19,.228,.197],[.28,.18,.16],[.325,.07,.08],[.33,.002,.003]]),skin,0,0,0,true);
 for(const side of [-1,1]){oval(head,skin,side*.245,-.035,0,.053,.081,.046);oval(head,cheek,side*.259,-.035,.033,.022,.038,.012);}
 const eyes=[];
 for(const side of [-1,1]){
  const eye=new T.Group();eye.position.set(side*.105,.028,.19);eye.rotation.y=side*.14;eye.rotation.z=side*.10;head.add(eye);eyes.push(eye);
  oval(eye,ink,0,0,-.003,.077,.055,.022);oval(eye,white,0,0,.009,.071,.047,.021);
  oval(eye,mat('#278eac',.3),-side*.012,-.004,.029,.032,.041,.012);oval(eye,ink,-side*.012,-.004,.04,.017,.027,.008);oval(eye,white,-side*.012-.009,.013,.047,.01,.012,.005);
 }
 const brows=[];for(const side of [-1,1]){const brow=add(head,tube([[side*.042,.119,.199],[side*.098,.135,.22],[side*.178,.12,.173]],.022),hair);brows.push(brow);}
 oval(head,skin,0,-.06,.217,.035,.05,.045);oval(head,cheek,0,-.103,.218,.024,.009,.009);
 add(head,tube([[-.083,-.16,.17],[-.015,-.176,.194],[.064,-.148,.18]],.009),mat('#854f45'));
 add(head,tube([[-.065,-.157,.177],[-.01,-.165,.20],[.049,-.149,.184]],.005),white);
 // Swept sculpted locks, with separate ridges rather than a cap of spheres.
 const hairGroup=new T.Group();head.add(hairGroup);
 if(look.style!=='shaved'){
  add(hairGroup,loft([[.13,.224,.187,-.027],[.22,.25,.213,-.023],[.32,.214,.18,-.035],[.39,.13,.10,-.04],[.42,.005,.005]]),hair,0,0,0,true);
  if(look.style==='curls')for(let i=0;i<9;i++){
   const x=-.19+(i%5)*.095,y=.23+Math.floor(i/5)*.085,z=.17-Math.floor(i/5)*.13;
   add(hairGroup,lock([[x-.035,y,z],[x-.06,y+.08,z+.025],[x+.015,y+.12,z],[x+.05,y+.035,z+.02]],.06),hair);
  }
  else for(let i=0;i<5;i++){
   const x=-.20+i*.083,peak=.39+(i===1?.065:i===2?.035:0);
   const tuft=add(hairGroup,lock([[x,.18,.16],[x-.015,.31,.23],[x+.045,peak,.12],[x+.12,peak-.07,-.045]],.072),hair);tuft.scale.y=look.style==='curls'?1.12:1;
  }
  if(look.style==='bun')oval(hairGroup,hair,0,.38,-.17,.115,.105,.12,true);
  if(look.style==='ponytail')add(hairGroup,tube([[0,.24,-.18],[.02,.12,-.30],[.04,-.16,-.28]],.067),hair);
 }
 const band=add(head,loft([[.144,.236,.207],[.183,.239,.21]]),white,0,0,-.012);
 // Small shield emblem is geometric, so it stays crisp without a texture download.
 const crest=add(body,new T.CircleGeometry(.049,6),white,-.117,1.387,.164);crest.rotation.z=Math.PI/6;
 add(body,new T.CircleGeometry(.029,6),accent,-.117,1.387,.166);
 const arms=[-1,1].map(side=>({side,upper:add(root,loft([[-.5,.07,.07],[-.32,.09,.085],[.15,.078,.075],[.5,.055,.056]],20),skin),fore:add(root,loft([[-.5,.055,.052],[-.12,.069,.059],[.5,.048,.044]],20),skin),elbow:oval(root,skin,0,0,0,.06,.063,.06),hand:oval(root,skin,0,0,0,.06,.069,.064),sleeve:oval(body,shirt,side*.274,1.45,0,.105,.13,.12,true),wrist:add(root,new T.CylinderGeometry(.055,.055,.069,20),white)}));
 const legs=[-1,1].map(side=>{
  const shoe=new T.Group();root.add(shoe);
  oval(shoe,white,0,.076,.06,.112,.083,.21,true);oval(shoe,panel,0,.015,.055,.119,.031,.215);
  oval(shoe,shirt,0,.08,-.064,.113,.06,.077);
  for(let i=0;i<3;i++)add(shoe,tube([[-.055,.143,.0+i*.028],[0,.15,.009+i*.028],[.055,.143,.0+i*.028]],.007),white);
  return {side,kit:add(root,loft([[-.5,.14,.145],[-.40,.145,.148],[.45,.136,.15],[.5,.13,.14]],24),shorts,0,0,0,true),thigh:add(root,loft([[-.5,.072,.073],[0,.089,.089],[.5,.104,.097]],24),skin),shin:add(root,loft([[-.5,.052,.06],[-.15,.065,.073],[.18,.078,.087],[.5,.075,.074]],24),skin),knee:oval(root,skin,0,0,0,.078,.083,.081),sock:add(root,new T.CylinderGeometry(.057,.053,1,20),white),shoe};
 });
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
   joint(l.kit,hip,hip.clone().lerp(knee,.65));joint(l.thigh,hip,knee);joint(l.shin,knee,foot);l.knee.position.copy(knee);joint(l.sock,foot.clone().add(V(0,.18,0)),foot.clone().add(V(0,.055,0)));l.shoe.position.copy(foot);
  }
  let right=V(-.29,1.16,.35),left=V(.27,1.19,.29);
  if(load){right.lerp(V(-.46,1.35,-.2),load);left.lerp(V(.15,1.35,.38),load);}
  if(p.serve){right=V(-.23,1.93,-.09);left=V(.17,2.08,.2);}
  if(p.celebrate){right=V(-.44,2.05,0);left=V(.44,2.05,0);}
  if(stroke){const start=contact.clone().sub(V(0,.36,0)),finish=V(back?-.35:.35,event.shot==='slice'?1.0:event.shot==='flat'?1.25:1.58,.35),recovery=ease((age-.48)/.37);right=start.lerp(finish,ease((age-.07)/.41)).lerp(right,recovery);if(back)left.lerp(right.clone().add(V(.08,.02,0)),1-recovery);}
  for(const a of arms){const end=a.side<0?right:left,shoulder=root.worldToLocal(body.localToWorld(V(a.side*.28,1.45,0))),elbow=shoulder.clone().lerp(end,.52).add(V(a.side*.09,-.07,-.015));joint(a.upper,shoulder,elbow);joint(a.fore,elbow,end);a.elbow.position.copy(elbow);a.hand.position.copy(end);a.wrist.position.copy(end).lerp(elbow,.15);a.wrist.quaternion.copy(a.fore.quaternion);}
  racket.position.copy(right);racket.rotation.z=stroke?-.32*Math.sin(Math.PI*ease((age-.07)/.78)):load*-.3;
  // Keep the string bed exactly at contact before beginning the follow-through.
  if(stroke&&age<=.07)racket.rotation.z=0;
 }
 return {root,pose,dispose(){},kind:'original'};
}
