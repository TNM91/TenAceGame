/* Shared vector character rig: the creator and match use the same model. */
(function () {
  const scenery=typeof Image==='undefined'?null:new Image();
  if(scenery)scenery.src='./assets/club-scenery-v08.png';
  function onReady(callback){if(scenery?.complete&&scenery.naturalWidth)callback();else scenery?.addEventListener('load',callback,{once:true});}
  const ellipse = (c, x, y, rx, ry, color) => { c.fillStyle = color; c.beginPath(); c.ellipse(x,y,rx,ry,0,0,Math.PI*2); c.fill(); };
  const line = (c, points, color, width) => { c.strokeStyle=color; c.lineWidth=width; c.lineCap='round'; c.lineJoin='round';c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.stroke(); };
  function person(c,x,y,size,look,pose={}) {
    const time=pose.time||0,run=pose.run||0,swing=pose.swing||0,side=pose.side||1,arc=Math.sin(swing*Math.PI);
    const stride=Math.sin(time*12)*run*12,back=pose.back;
    const shape=(pts,color)=>{c.fillStyle=color;c.strokeStyle='#0a1825';c.lineWidth=1.2;c.beginPath();pts.forEach(([a,b],i)=>i?c.lineTo(a,b):c.moveTo(a,b));c.closePath();c.fill();c.stroke();};
    const limb=(pts,color,width)=>{line(c,pts,'#102030',width+2);line(c,pts,color,width);line(c,pts.map(([a,b])=>[a-1.2,b]),'#ffffff26',width*.28);};
    c.save();c.translate(x,y);c.scale(size,size);
    ellipse(c,-10,5,34,8,'#071e3850');
    c.translate(0,-Math.abs(stride)*.2);c.rotate(arc*side*.09+Math.sin(time*12)*run*.025);
    // Longer legs and articulated knees create an athletic, grounded silhouette.
    const lx=-21-stride,rx=23+stride;
    limb([[-9,-42],[-18-stride*.3,-24],[lx,-5]],look.skin,9);
    limb([[9,-42],[18+stride*.3,-23],[rx,-5]],look.skin,9);
    limb([[lx,-11],[lx-1,-3]],'#f2f4e9',8);limb([[rx,-11],[rx+1,-3]],'#f2f4e9',8);
    shape([[lx-5,-5],[lx+4,-4],[lx+5,2],[lx-10,3],[lx-11,0]],'#e9ede5');
    shape([[rx-4,-5],[rx+4,-5],[rx+11,0],[rx+10,3],[rx-5,2]],'#e9ede5');
    line(c,[[lx-8,0],[lx+2,0]],look.racket,2);line(c,[[rx-2,0],[rx+8,0]],look.racket,2);
    shape([[-14,-51],[14,-51],[18,-37],[4,-34],[0,-42],[-4,-34],[-18,-38]],look.shorts);
    line(c,[[-12,-48],[-13,-39]],'#ffffff66',2);line(c,[[11,-48],[13,-39]],'#07182944',3);
    const cloth=c.createLinearGradient(-18,-75,18,-45);cloth.addColorStop(0,look.shirt);cloth.addColorStop(1,look.shirt);
    shape([[-12,-78],[0,-81],[12,-78],[18,-69],[13,-49],[0,-47],[-14,-50],[-18,-69]],cloth);
    shape([[8,-76],[15,-70],[11,-49],[5,-49]],'#08203230');
    line(c,[[-11,-73],[-12,-54]],'#ffffff38',2);
    line(c,[[-6,-77],[0,-73],[6,-77]],back?'#ffffff44':'#071725',2);
    c.fillStyle='#f0f4ee';c.textAlign='center';c.font='italic 700 5px system-ui';c.fillText('TenAce',back?0:-2,back?-65:-66);
    c.strokeStyle='#a7ed54';c.lineWidth=.8;c.strokeRect(back?8:6,back?-70:-71,5,5);
    const shot=pose.shot||'topspin';
    let hx=29+arc*26*side,hy=-55-arc*(shot==='lob'?38:shot==='slice'?-8:shot==='flat'?7:25);
    if(pose.ready&&!swing){hx=24;hy=-64;}
    if(pose.windup&&!swing){hx=38*side;hy=-66;}
    if(pose.serve){hx=16;hy=-110+Math.sin(time*4)*3;}
    if(pose.celebrate){hx=27;hy=-107;}
    limb([[14,-72],[23,-62],[hx,hy]],look.skin,7);
    limb([[-14,-72],[-24,-61],[-27,pose.serve||pose.celebrate?-99:-54]],look.skin,7);
    line(c,[[-13,-74],[-18,-67]],look.shirt,10);line(c,[[13,-74],[18,-67]],look.shirt,10);
    line(c,[[hx-1,hy],[hx+2,hy-3]],'#f1efe5',6);
    c.save();c.translate(hx,hy);c.rotate(pose.serve?-.25:side*(.5-swing*1.8));
    line(c,[[0,0],[4,-13]],'#d2dce0',3);line(c,[[0,0],[2,-6]],'#102031',4);
    const rw=look.frame==='power'?12:look.frame==='control'?9:10,rh=look.frame==='control'?18:16;
    c.beginPath();c.ellipse(6,-27,rw,rh,.1,0,7);c.fillStyle='#10223428';c.fill();c.strokeStyle='#071727';c.lineWidth=4;c.stroke();c.strokeStyle=look.racket;c.lineWidth=2;c.stroke();
    c.save();c.beginPath();c.ellipse(6,-27,rw-1,rh-1,.1,0,7);c.clip();
    for(let n=-9;n<24;n+=3)line(c,[[n,-46],[n,-9]],'#f1f5ea99',.6);
    for(let n=-44;n<-10;n+=3)line(c,[[-8,n],[21,n]],'#f1f5ea99',.6);
    c.restore();c.restore();
    limb([[0,-85],[0,-78]],look.skin,7);
    ellipse(c,-9,-91,2,3,look.skin);ellipse(c,9,-91,2,3,look.skin);
    shape([[-9,-98],[-5,-103],[5,-102],[10,-97],[8,-85],[2,-81],[-5,-84],[-9,-90]],look.skin);
    line(c,[[7,-96],[6,-87],[2,-84]],'#603b3133',2);
    if(look.style!=='shaved'){
      ellipse(c,0,-101,10,5,look.hair);
      if(look.style==='crop')for(let i=0;i<5;i++)ellipse(c,-8+i*4,-103-Math.sin(i*2)*2,4,3,look.hair);
      if(look.style==='curls')for(let i=0;i<7;i++)ellipse(c,-9+i*3,-103-Math.sin(i*3)*2,4,4,look.hair);
      if(look.style==='ponytail'){ellipse(c,8,-96,4,7,look.hair);ellipse(c,12+Math.sin(time*7)*2,-84,4,11,look.hair);}
      if(look.style==='bun')ellipse(c,1,-108,6,5,look.hair);
    }
    if(back){if(look.style!=='shaved')ellipse(c,0,-94,8,8,look.hair);}
    else{
      line(c,[[-6,-95],[-2,-96]],look.hair,1.5);line(c,[[2,-96],[6,-95]],look.hair,1.5);
      ellipse(c,-4,-93,1,1.3,'#172532');ellipse(c,4,-93,1,1.3,'#172532');
      line(c,[[0,-92],[-1,-89],[1,-89]],'#784c3b',.7);line(c,[[-2,-86],[3,-86]],'#663b31',1);
    }
    line(c,[[-8,-99],[8,-99]],'#eff5e8',3);
    if(!back)ellipse(c,1,-99,1.5,1.2,'#91d849');
    c.restore();
  }
  // A single projection is shared by court markings, players, and ball contact.
  function project(bounds,x,y){return {x:(bounds.L+bounds.R)/2+(x-.5)*(bounds.R-bounds.L)*(.58+.42*y),y:bounds.T+y*(bounds.B-bounds.T)};}
  function court(c,w,h,bounds,theme='park') {
    const warm=theme==='terrace',{L,R,T,B}=bounds;
    const polygon=(pts,color)=>{c.fillStyle=color;c.beginPath();pts.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill();};
    const p=(x,y)=>{const q=project(bounds,x,y);return[q.x,q.y]};
    const sky=c.createLinearGradient(0,0,0,h*.4);sky.addColorStop(0,warm?'#6b7197':'#559bb5');sky.addColorStop(1,warm?'#f8c89b':'#d4e6d6');c.fillStyle=sky;c.fillRect(0,0,w,h);
    ellipse(c,w*.78,h*.075,24,24,warm?'#ffe4b7':'#ffefd0');
    for(let i=0;i<4;i++){ellipse(c,w*(.08+i*.27),h*(.045+i%2*.02),w*.11,5,'#ffffff30');}
    // Layered distant skyline and tree silhouettes create a visible horizon.
    for(let i=0;i<22;i++){const x=i*w/21,y=h*.08+(i*19%31);c.fillStyle=warm?'#646b8377':'#698e8577';c.fillRect(x,y,w/17,h*.2-y);if(warm){c.fillStyle='#ffdcb366';for(let yy=y+5;yy<h*.18;yy+=9)c.fillRect(x+4,yy,2,4);}}
    polygon([[0,h*.17],[w,h*.17],[w,h],[0,h]],warm?'#aa927c':'#668a70');
    for(let i=0;i<12;i++){const x=i*w/11,top=h*(.115+Math.sin(i*9)*.018);line(c,[[x,top],[x,h*.23]],'#4c6256',4);ellipse(c,x,top,23,25,warm?'#536961':'#376856');ellipse(c,x-10,top-6,16,19,warm?'#79826b':'#639465');ellipse(c,x+10,top-10,16,17,warm?'#697963':'#4b855b');ellipse(c,x-5,top-18,13,11,warm?'#899575':'#88a875');}
    const lawn=c.createLinearGradient(0,T,0,h);lawn.addColorStop(0,warm?'#9c9b69':'#579550');lawn.addColorStop(1,warm?'#65714c':'#2c613d');c.fillStyle=lawn;c.fillRect(0,T-10,w,h-T+10);
    if(scenery?.complete&&scenery.naturalWidth){c.save();if(warm)c.filter='sepia(.25) saturate(.85)';c.drawImage(scenery,0,0,w,T-8);c.restore();}
    // Fine grass mottling and elongated sideline shadows stay outside the court.
    for(let i=0;i<1800;i++){c.fillStyle=i%2?'#c5e99512':'#143d2914';c.fillRect((i*71%997)/997*w,T+(i*131%991)/991*(h-T),2,1);}
    polygon([p(.025,.025),p(1.04,.025),p(1.04,1.025),p(.025,1.025)],'#102f3540');
    const surface=c.createLinearGradient(0,T,0,B);surface.addColorStop(0,warm?'#c88564':'#336d9e');surface.addColorStop(1,warm?'#975449':'#205586');
    polygon([p(0,0),p(1,0),p(1,1),p(0,1)],surface);
    for(let y=.02;y<1;y+=.025)line(c,[p(0,y),p(1,y)],'#ffffff06',1);
    for(let i=0;i<1000;i++){const q=project(bounds,((i*73)%997)/997,((i*137)%991)/991);c.fillStyle=i%2?'#ffffff10':'#082f3a10';c.fillRect(q.x,q.y,1,1);}
    const markings=[[[0,0],[1,0],[1,1],[0,1],[0,0]],[[.18,0],[.18,1]],[[.82,0],[.82,1]],[[.18,.21],[.82,.21]],[[.18,.79],[.82,.79]],[[.5,.21],[.5,.79]],[[.5,0],[.5,.018]],[[.5,.982],[.5,1]]];
    for(const path of markings)line(c,path.map(([x,y])=>p(x,y)),'#f4f3db',1.7);
    // Fences recede with the same perspective as the surface.
    for(const side of [-.1,1.1]){for(let y=0;y<=1.01;y+=.1){const q=p(side,y);line(c,[[q[0],q[1]-23],[q[0],q[1]+2]],'#234644',2);}for(const lift of [8,16,23]){const a=p(side,0),b=p(side,1);line(c,[[a[0],a[1]-lift],[b[0],b[1]-lift]],'#c1d8c56b',.7);}}
    c.textAlign='center';c.fillStyle='#edf4ed';c.font='italic 900 '+Math.max(13,w*.055)+'px system-ui';c.fillText('TenAce',w*.48,T*.72);c.fillStyle='#9ded4e';c.font='900 '+Math.max(12,w*.04)+'px system-ui';c.fillText('iQ',w*.64,T*.72);
    c.font='500 '+Math.max(6,w*.018)+'px system-ui';c.fillStyle='#d4e4ee';c.fillText(warm?'S O L S T I C E   T E R R A C E':'M O R E   T E N N I S .   L E S S   C H A O S .',w*.5,T*.81);
    for(const side of [-.19,1.19]){for(let row=0;row<3;row++){const q=p(side,.32+row*.065);line(c,[[q[0]-8,q[1]],[q[0]+8,q[1]]],'#d1b58d',5);for(let j=0;j<2;j++){ellipse(c,q[0]-4+j*8,q[1]-4,3,4,['#e8c775','#c57e70','#abc7d0'][row]);ellipse(c,q[0]-4+j*8,q[1]-9,2,2,'#c28f69');}}}
    for(const side of [-.14,1.14]){const q=p(side,.69);line(c,[[q[0],q[1]],[q[0],q[1]-65]],'#24423f',3);line(c,[[q[0]-8,q[1]-65],[q[0]+8,q[1]-65]],'#f6eacb',5);ellipse(c,q[0],q[1]-65,13,7,'#fff5d51c');}
    for(const side of [-.1,1.1]){const q=p(side,.57),dir=side<0?-1:1;polygon([[q[0],q[1]],[q[0]+dir*20,q[1]+9],[q[0]+dir*20,q[1]+45],[q[0],q[1]+34]],'#082844');line(c,[[q[0],q[1]],[q[0]+dir*20,q[1]+9]],'#7b9aac',1);c.fillStyle='#b3ef5a';c.font='900 8px system-ui';c.fillText('iQ',q[0]+dir*10,q[1]+26);}
    polygon([p(0,0),p(.62,0),p(0,.34)],'#0e38441b');
    const shade=c.createLinearGradient(0,0,w,0);shade.addColorStop(0,'#061e302d');shade.addColorStop(.3,'#ffffff00');shade.addColorStop(.7,'#ffffff00');shade.addColorStop(1,'#061e3040');c.fillStyle=shade;c.fillRect(0,0,w,h);
  }
  function net(c, bounds) {
    const N=bounds.N,span=(bounds.R-bounds.L)*.79,L=(bounds.L+bounds.R-span)/2,R=L+span;
    c.fillStyle='#112b3840';c.fillRect(L-5,N+4,R-L+10,12);
    const lift=Math.max(10,(bounds.B-bounds.T)*.058);
    c.fillStyle='#061d36b8';c.fillRect(L-5,N-lift,R-L+10,lift+6);
    for(let x=L;x<R;x+=4)line(c,[[x,N-lift],[x,N+6]],'#afcfe36b',.55);
    for(let y=N-lift+3;y<N+7;y+=3)line(c,[[L-5,y],[R+5,y]],'#afcfe36b',.55);
    line(c,[[L-6,N-lift],[(L+R)/2,N-lift+3],[R+6,N-lift]],'#f3eddb',2.5);
    for(const x of [L-7,R+7]){line(c,[[x,N-lift-3],[x,N+9]],'#132f38',5);ellipse(c,x,N-lift-3,3,2,'#dbedb5');}
    c.font='italic 800 10px system-ui';c.textAlign='center';c.fillStyle='#d1e6e780';c.fillText('TenAce iQ',(L+R)/2,N-2);
  }
  window.TenAceGraphics={person,court,net,project,onReady};
})();
