/* Shared vector character rig: the creator and match use the same model. */
(function () {
  const ellipse = (c, x, y, rx, ry, color) => { c.fillStyle = color; c.beginPath(); c.ellipse(x,y,rx,ry,0,0,Math.PI*2); c.fill(); };
  const line = (c, points, color, width) => { c.strokeStyle=color; c.lineWidth=width; c.lineCap='round'; c.lineJoin='round';c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.stroke(); };
  function person(c, x, y, size, look, pose = {}) {
    const time=pose.time||0, run=pose.run||0, swing=pose.swing||0, side=pose.side||1;
    const stride=Math.sin(time*13)*run*7, bounce=Math.sin(time*3)*.7+Math.abs(stride)*.16;
    c.save();c.translate(x,y);c.scale(size,size);
    ellipse(c,5,6,22,7,'#071b2945');
    c.translate(0,-bounce);
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
    line(c,[[-10,-32],[10,-32]],'#081c3035',2);
    const celebrating=pose.celebrate;
    let handX=23+Math.sin(swing*Math.PI)*38*side, handY=-36-Math.sin(swing*Math.PI)*22;
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
    ellipse(c,3,-64,7,9,'#ffffff0b');
    if(look.style!=='shaved'){
      ellipse(c,0,-77,11,6,look.hair);
      if(look.style==='crop'){ellipse(c,-7,-72,5,7,look.hair);ellipse(c,6,-79,7,4,look.hair);}
      if(look.style==='curls')for(let i=0;i<6;i++)ellipse(c,-10+i*4,-78-Math.sin(i)*2,5,5,look.hair);
      if(look.style==='ponytail'){ellipse(c,10,-72,4,8,look.hair);ellipse(c,14+Math.sin(time*5)*2,-59,5,12,look.hair);}
      if(look.style==='bun')ellipse(c,2,-85,7,6,look.hair);
    }else {c.strokeStyle=look.hair;c.lineWidth=2;c.beginPath();c.arc(0,-69,10,Math.PI,Math.PI*2);c.stroke();}
    line(c,[[-9,-74],[9,-74]],look.shirt,3);
    ellipse(c,-4,-67,1.2,1.7,'#25313a');ellipse(c,4,-67,1.2,1.7,'#25313a');
    line(c,[[-3,-60],[2,-59],[4,-61]],'#683e36',1.2);
    c.restore();
  }
  function court(c,w,h,bounds) {
    const {L,R,T,B,N}=bounds;
    const ground=c.createLinearGradient(0,0,w,h);ground.addColorStop(0,'#547a66');ground.addColorStop(1,'#243f3c');c.fillStyle=ground;c.fillRect(0,0,w,h);
    // Garden, warm paths and geometric tree canopies around the playing surface.
    c.fillStyle='#b7a991';c.fillRect(0,h*.035,w,h*.045);
    for(let i=0;i<9;i++){
      const x=i*w/8,y=8+(i%2)*7;
      ellipse(c,x+8,y+10,22,12,'#0b25354a');
      ellipse(c,x,y,24,18,'#203f3a');ellipse(c,x-6,y-5,18,13,'#406653');ellipse(c,x-9,y-9,10,7,'#71936a');
    }
    c.fillStyle='#152f32';c.fillRect(L-9,T-8,R-L+18,B-T+16);
    const surface=c.createLinearGradient(L,T,R,B);surface.addColorStop(0,'#5d9fad');surface.addColorStop(.5,'#418391');surface.addColorStop(1,'#2a6677');c.fillStyle=surface;c.fillRect(L,T,R-L,B-T);
    c.fillStyle='#ffffff04';for(let y=T;y<B;y+=5)c.fillRect(L,y,R-L,1);
    // Fine speckle is deterministic and cached once per resize.
    c.fillStyle='#eff8de12';for(let i=0;i<650;i++)c.fillRect(L+((i*73)%997)/997*(R-L),T+((i*137)%991)/991*(B-T),1,1);
    const sl=L+(R-L)*.18,sr=R-(R-L)*.18,u=T+(B-T)*.21,l=T+(B-T)*.79;
    c.strokeStyle='#eff2d8';c.lineWidth=1.8;c.strokeRect(L,T,R-L,B-T);
    for(const p of [[[sl,T],[sl,B]],[[sr,T],[sr,B]],[[sl,u],[sr,u]],[[sl,l],[sr,l]],[[(L+R)/2,u],[(L+R)/2,l]]])line(c,p,'#edf4df',1.7);
    // Fence posts and mesh down both sides.
    for(const x of [L-17,R+17]){
      line(c,[[x,T-7],[x,B+4]],'#102e32',2);
      for(let y=T;y<B;y+=26){line(c,[[x-4,y],[x+4,y+15]],'#b5d0b144',1);line(c,[[x+4,y],[x-4,y+15]],'#b5d0b144',1);}
      for(let y=T;y<B;y+=75)line(c,[[x,y-5],[x,y+22]],'#cfdfcd',2);
    }
    for(const x of [3,w-13]){
      c.fillStyle='#153238';c.fillRect(x,h*.3,10,42);c.fillStyle='#b69870';for(let i=0;i<4;i++)c.fillRect(x,h*.3+i*10,9,6);
    }
    // Afternoon shadows stay subtle enough to preserve ball contrast.
    c.fillStyle='#142f3e16';c.beginPath();c.moveTo(L,T);c.lineTo(R,T);c.lineTo(L,T+(B-T)*.28);c.closePath();c.fill();
    c.font='800 9px system-ui';c.textAlign='center';c.fillStyle='#e9efd6';c.fillText('R I V E R D A L E   /   C O U R T  0 1',w/2,T-13);
  }
  function net(c, bounds) {
    const {L,R,N}=bounds;
    c.fillStyle='#112b3840';c.fillRect(L-5,N+4,R-L+10,12);
    c.fillStyle='#102732aa';c.fillRect(L-5,N-7,R-L+10,13);
    for(let x=L;x<R;x+=8)line(c,[[x,N-7],[x,N+6]],'#d8e5db60',.65);
    for(let y=N-4;y<N+7;y+=4)line(c,[[L-5,y],[R+5,y]],'#d8e5db60',.65);
    line(c,[[L-6,N-9],[(L+R)/2,N-6],[R+6,N-9]],'#f3eddb',3);
    for(const x of [L-7,R+7]){line(c,[[x,N-13],[x,N+9]],'#e4ddd0',4);ellipse(c,x,N-13,3,2,'#17353e');}
  }
  window.TenAceGraphics={person,court,net};
})();
