/* Shared vector character rig: the creator and match use the same model. */
(function () {
  const ellipse = (c, x, y, rx, ry, color) => { c.fillStyle = color; c.beginPath(); c.ellipse(x,y,rx,ry,0,0,Math.PI*2); c.fill(); };
  const line = (c, points, color, width) => { c.strokeStyle=color; c.lineWidth=width; c.lineCap='round'; c.lineJoin='round';c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.stroke(); };
  function person(c, x, y, size, look, pose = {}) {
    const time=pose.time||0, run=pose.run||0, swing=pose.swing||0, side=pose.side||1;
    const stride=Math.sin(time*13)*run*10, bounce=Math.sin(time*3)*.7+Math.abs(stride)*.22;
    c.save();c.translate(x,y);c.scale(size,size);
    ellipse(c,5,6,22,7,'#071b2945');
    c.translate(0,-bounce);
    c.rotate((Math.sin(time*13)*run*.035)+Math.sin(swing*Math.PI)*side*.09);
    // Shoes, socks, and bent legs give the figure a readable athletic stance.
    line(c,[[-7,-24],[-10-stride*.25,-12],[-12-stride,1]],look.skin,7);
    line(c,[[7,-24],[11+stride*.25,-12],[13+stride,1]],look.skin,7);
    line(c,[[-12-stride,-5],[-12-stride,2]],'#f5f1e7',7);
    line(c,[[13+stride,-5],[13+stride,2]],'#f5f1e7',7);
    ellipse(c,-14-stride,3,8,4,'#f9f5e9');ellipse(c,15+stride,3,8,4,'#f9f5e9');
    line(c,[[-19-stride,5],[-9-stride,5]],look.shirt,2);
    line(c,[[10+stride,5],[21+stride,5]],look.shirt,2);
    c.fillStyle=look.shorts;c.beginPath();c.moveTo(-13,-33);c.lineTo(13,-33);c.lineTo(12,-20);c.lineTo(2,-20);c.lineTo(0,-28);c.lineTo(-2,-20);c.lineTo(-13,-20);c.closePath();c.fill();
    // Torso and a contrasting diagonal panel.
    c.fillStyle=look.shirt;c.beginPath();c.moveTo(-9,-55);c.quadraticCurveTo(0,-59,9,-55);c.lineTo(14,-48);c.lineTo(11,-32);c.quadraticCurveTo(0,-29,-12,-32);c.lineTo(-14,-48);c.closePath();c.fill();
    line(c,[[-9,-51],[8,-35]],'#ffffff48',4);
    line(c,[[-10,-48],[-9,-35]],'#ffffff36',2);
    line(c,[[10,-48],[9,-35]],'#001a3040',3);
    line(c,[[-4,-55],[0,-52],[4,-55]],'#ffffffa0',1.5);
    line(c,[[-10,-32],[10,-32]],'#081c3035',2);
    if(pose.back){c.fillStyle='#ffffffa8';c.font='900 10px system-ui';c.textAlign='center';c.fillText('01',0,-39);}
    const celebrating=pose.celebrate;
    const stroke=pose.shot||'topspin', arc=Math.sin(swing*Math.PI);
    let handX=23+arc*32*side, handY=-36-arc*(stroke==='lob'?39:stroke==='slice'?-8:stroke==='flat'?10:24);
    if(pose.ready&&!swing){handX=18;handY=-46;}
    if(pose.windup&&!swing){handX=34*side;handY=-49;}
    if(pose.serve){handX=15;handY=-77+Math.sin(time*4)*5;}
    if(celebrating){handX=24;handY=-74;}
    line(c,[[11,-50],[19,-43],[handX,handY]],look.skin,6);
    const leftY=celebrating?-73:pose.serve?-71:-38;
    line(c,[[-11,-50],[-19,celebrating?-62:-42],[-22,leftY]],look.skin,6);
    line(c,[[-11,-51],[-15,-46]],look.shirt,8);line(c,[[11,-51],[15,-47]],look.shirt,8);
    line(c,[[handX-2,handY+1],[handX+2,handY-3]],'#f5f1e7',5);
    // Racket shape varies independently of its color.
    c.save();c.translate(handX,handY);c.rotate(pose.serve?-.25:side*(.5-swing*1.8));
    line(c,[[0,0],[4,-12]],'#dbe6e4',3);line(c,[[0,0],[2,-5]],'#203246',4);
    const rw=look.frame==='power'?10:look.frame==='control'?7:8;
    const rh=look.frame==='control'?15:13;
    c.strokeStyle=look.racket;c.lineWidth=3;c.beginPath();c.ellipse(6,-23,rw,rh,.1,0,Math.PI*2);c.stroke();
    c.save();c.beginPath();c.ellipse(6,-23,rw-2,rh-2,.1,0,Math.PI*2);c.clip();
    for(let n=-10;n<24;n+=4)line(c,[[n,-39],[n,-8]],'#effffc75',.6);
    for(let n=-36;n<-9;n+=4)line(c,[[-6,n],[18,n]],'#effffc75',.6);
    c.restore();c.restore();
    // Neck, ears, face and hair, with silhouettes visible at court scale.
    line(c,[[0,-58],[0,-53]],look.skin,7);
    ellipse(c,-10,-66,3,4,look.skin);ellipse(c,10,-66,3,4,look.skin);
    ellipse(c,0,-68,11,13,look.skin);
    ellipse(c,3,-64,7,9,'#ffffff18');
    line(c,[[8,-69],[8,-63],[4,-58]],'#301e2726',2);
    if(look.style!=='shaved'){
      ellipse(c,0,-77,11,6,look.hair);
      if(look.style==='crop'){ellipse(c,-7,-72,5,7,look.hair);ellipse(c,6,-79,7,4,look.hair);}
      if(look.style==='curls')for(let i=0;i<6;i++)ellipse(c,-10+i*4,-78-Math.sin(i)*2,5,5,look.hair);
      if(look.style==='ponytail'){ellipse(c,10,-72,4,8,look.hair);ellipse(c,14+Math.sin(time*5)*2,-59,5,12,look.hair);}
      if(look.style==='bun')ellipse(c,2,-85,7,6,look.hair);
    }else {c.strokeStyle=look.hair;c.lineWidth=2;c.beginPath();c.arc(0,-69,10,Math.PI,Math.PI*2);c.stroke();}
    line(c,[[-9,-74],[9,-74]],look.shirt,3);
    if(pose.back){ellipse(c,0,-70,10,9,look.hair);line(c,[[-9,-74],[9,-74]],look.shirt,3);}
    else{ellipse(c,-4,-67,1.2,1.7,'#25313a');ellipse(c,4,-67,1.2,1.7,'#25313a');line(c,[[-3,-60],[2,-59],[4,-61]],'#683e36',1.2);}
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
    polygon([p(-.22,-.09),p(1.22,-.09),p(1.16,1.13),p(-.16,1.13)],warm?'#d0b597':'#a5b195');
    polygon([p(-.13,-.05),p(1.13,-.05),p(1.10,1.08),p(-.10,1.08)],warm?'#6d696d':'#345e5c');
    polygon([p(.025,.025),p(1.04,.025),p(1.04,1.025),p(.025,1.025)],'#102f3540');
    const surface=c.createLinearGradient(0,T,0,B);surface.addColorStop(0,warm?'#d99c7a':'#64a5b1');surface.addColorStop(1,warm?'#a15b51':'#306b85');
    polygon([p(0,0),p(1,0),p(1,1),p(0,1)],surface);
    for(let y=.02;y<1;y+=.025)line(c,[p(0,y),p(1,y)],'#ffffff06',1);
    for(let i=0;i<1000;i++){const q=project(bounds,((i*73)%997)/997,((i*137)%991)/991);c.fillStyle=i%2?'#ffffff10':'#082f3a10';c.fillRect(q.x,q.y,1,1);}
    const markings=[[[0,0],[1,0],[1,1],[0,1],[0,0]],[[.18,0],[.18,1]],[[.82,0],[.82,1]],[[.18,.21],[.82,.21]],[[.18,.79],[.82,.79]],[[.5,.21],[.5,.79]],[[.5,0],[.5,.018]],[[.5,.982],[.5,1]]];
    for(const path of markings)line(c,path.map(([x,y])=>p(x,y)),'#f4f3db',1.7);
    // Fences recede with the same perspective as the surface.
    for(const side of [-.1,1.1]){for(let y=0;y<=1.01;y+=.1){const q=p(side,y);line(c,[[q[0],q[1]-23],[q[0],q[1]+2]],'#234644',2);}for(const lift of [8,16,23]){const a=p(side,0),b=p(side,1);line(c,[[a[0],a[1]-lift],[b[0],b[1]-lift]],'#c1d8c56b',.7);}}
    const a=p(-.1,0),b=p(1.1,0);polygon([[a[0],a[1]-26],[b[0],b[1]-26],b,a],'#173c40cc');
    line(c,[[a[0],a[1]-27],[b[0],b[1]-27]],'#a6c5b8',2);
    c.fillStyle='#f2efdc';c.textAlign='center';c.font='800 8px system-ui';c.fillText(warm?'S O L S T I C E   T E R R A C E':'T E N A C E   /   R I V E R D A L E',w/2,T-10);
    for(const side of [-.19,1.19]){for(let row=0;row<3;row++){const q=p(side,.32+row*.065);line(c,[[q[0]-8,q[1]],[q[0]+8,q[1]]],'#d1b58d',5);for(let j=0;j<2;j++){ellipse(c,q[0]-4+j*8,q[1]-4,3,4,['#e8c775','#c57e70','#abc7d0'][row]);ellipse(c,q[0]-4+j*8,q[1]-9,2,2,'#c28f69');}}}
    for(const side of [-.14,1.14]){const q=p(side,.69);line(c,[[q[0],q[1]],[q[0],q[1]-65]],'#24423f',3);line(c,[[q[0]-8,q[1]-65],[q[0]+8,q[1]-65]],'#f6eacb',5);ellipse(c,q[0],q[1]-65,13,7,'#fff5d51c');}
    polygon([p(0,0),p(.62,0),p(0,.34)],'#0e38441b');
    const shade=c.createLinearGradient(0,0,w,0);shade.addColorStop(0,'#061e302d');shade.addColorStop(.3,'#ffffff00');shade.addColorStop(.7,'#ffffff00');shade.addColorStop(1,'#061e3040');c.fillStyle=shade;c.fillRect(0,0,w,h);
  }
  function net(c, bounds) {
    const N=bounds.N,span=(bounds.R-bounds.L)*.79,L=(bounds.L+bounds.R-span)/2,R=L+span;
    c.fillStyle='#112b3840';c.fillRect(L-5,N+4,R-L+10,12);
    c.fillStyle='#102732aa';c.fillRect(L-5,N-7,R-L+10,13);
    for(let x=L;x<R;x+=8)line(c,[[x,N-7],[x,N+6]],'#d8e5db60',.65);
    for(let y=N-4;y<N+7;y+=4)line(c,[[L-5,y],[R+5,y]],'#d8e5db60',.65);
    line(c,[[L-6,N-9],[(L+R)/2,N-6],[R+6,N-9]],'#f3eddb',3);
    for(const x of [L-7,R+7]){line(c,[[x,N-13],[x,N+9]],'#e4ddd0',4);ellipse(c,x,N-13,3,2,'#17353e');}
  }
  window.TenAceGraphics={person,court,net,project};
})();
