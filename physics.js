(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.TenAcePhysics=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const G=1.8,NET=.065,LEFT=.18,RIGHT=.82,EPS=1e-9;
 function launch(b,{x,y,time=1,z=.12,kind='topspin',serve=false,serviceSide='left'}){
  b.z=z;b.vz=(G*time*time/2-z)/time;b.vx=(x-b.x)/time;b.vy=(y-b.y)/time;
  b.bounces=0;b.crossed=false;b.active=true;b.kind=kind;b.isServe=serve;b.serviceSide=serviceSide;b.trail=[];
 }
 function groundTime(b){return (b.vz+Math.sqrt(b.vz*b.vz+2*G*Math.max(0,b.z)))/G;}
 function landing(b){const t=groundTime(b);return {x:b.x+b.vx*t,y:b.y+b.vy*t,time:t};}
 function advance(b,t){b.x+=b.vx*t;b.y+=b.vy*t;b.z+=b.vz*t-G*t*t/2;b.vz-=G*t;}
 function step(b,dt){
  const events=[];if(!b.active)return events;
  const lose=reason=>{b.active=false;events.push({type:'point',winner:b.last==='player'?'opp':'player',reason,fault:b.isServe&&b.bounces===0});};
  for(let i=0;i<8&&dt>EPS&&b.active;i++){
   const ground=groundTime(b),cross=!b.crossed&&Math.abs(b.vy)>EPS?(.5-b.y)/b.vy:Infinity;
   const net=cross>EPS?cross:Infinity,t=Math.min(dt,ground,net);
   advance(b,t);dt-=t;
   if(net<=t+EPS){b.crossed=true;if(b.z<=NET){lose('net');break;}}
   if(ground<=t+EPS){
    b.z=0;
    if(b.bounces===0){
     const rightHalf=b.last==='player'?b.y<=.5:b.y>=.5;
     if(!b.crossed||!rightHalf){lose('wrong side');break;}
     const tol=.003;
     if(b.x<LEFT-tol||b.x>RIGHT+tol||b.y<0-tol||b.y>1+tol){lose(b.x<LEFT-tol||b.x>RIGHT+tol?'wide':'long');break;}
     if(b.isServe){const minY=b.last==='player'?.21:.5,maxY=b.last==='player'?.5:.79;
      const minX=b.serviceSide==='left'?LEFT:.5,maxX=b.serviceSide==='left'?.5:RIGHT;
      if(b.y<minY-tol||b.y>maxY+tol||b.x<minX-tol||b.x>maxX+tol){lose('service box');break;}}
     b.bounces=1;b.isServe=false;
     events.push({type:'bounce',x:b.x,y:b.y});
     b.vz=Math.max(.26,Math.abs(b.vz)*(b.kind==='slice'?.48:b.kind==='lob'?.68:.59));b.vx*=.82;b.vy*=.82;
    }else {b.active=false;events.push({type:'point',winner:b.last,reason:'double bounce',fault:false});}
   }
  }
  return events;
 }
 function serveTarget(aim,side){const x=aim==='wide'?.24:aim==='body'?.36:.47;return {x:side==='left'?x:1-x,y:.32};}
 function canHit(b,who){return b.active&&b.last!==who&&b.bounces===1&&b.z>=.012&&b.z<=.25;}
 return {launch,step,landing,serveTarget,canHit,NET,LEFT,RIGHT};
});
