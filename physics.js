(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.TenAcePhysics=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const G=1.8,NET=.065,LEFT=.18,RIGHT=.82,EPS=1e-9;
 function launch(b,{x,y,time=1,z=.12,kind='topspin',serve=false,serviceSide='left',gravity=G,profile=false}){
  b.g=gravity;b.profile=profile;b.z=z;b.vz=(gravity*time*time/2-z)/time;b.vx=(x-b.x)/time;b.vy=(y-b.y)/time;
  b.bounces=0;b.crossed=false;b.active=true;b.kind=kind;b.isServe=serve;b.serviceSide=serviceSide;b.trail=[];
 }
 // Arcade flight profiles decouple visual height from horizontal travel time.
 // Effective vertical acceleration expresses a deliberate shot arc, not a real-world spin solver.
 const profiles={flat:{apex:.105,bounce:.50,retention:.90},topspin:{apex:.17,bounce:.62,retention:.88},slice:{apex:.085,bounce:.40,retention:.94},lob:{apex:.43,bounce:.58,retention:.72}};
 function launchShot(b,options){
  const {time=1,z=.10,kind='topspin',serve=false}=options,p=profiles[kind]||profiles.topspin;
  const apex=Math.max(z+.006,serve?.19:p.apex),duration=Math.max(.25,time);
  const gravity=2*(Math.sqrt(apex)+Math.sqrt(apex-z))**2/(duration*duration);
  launch(b,{...options,time:duration,z,gravity,profile:true});
 }
 function groundTime(b){const g=b.g||G;return (b.vz+Math.sqrt(b.vz*b.vz+2*g*Math.max(0,b.z)))/g;}
 function landing(b){const t=groundTime(b);return {x:b.x+b.vx*t,y:b.y+b.vy*t,time:t};}
 function advance(b,t){b.x+=b.vx*t;b.y+=b.vy*t;b.z+=b.vz*t-(b.g||G)*t*t/2;b.vz-=(b.g||G)*t;}
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
     if(b.profile){const p=profiles[b.kind]||profiles.topspin;b.g=G;b.vz=p.bounce;b.vx*=p.retention;b.vy*=p.retention;}else{b.vz=Math.max(.26,Math.abs(b.vz)*(b.kind==='slice'?.48:b.kind==='lob'?.68:.59));b.vx*=.82;b.vy*=.82;}
    }else {b.active=false;events.push({type:'point',winner:b.last,reason:'double bounce',fault:false});}
   }
  }
  return events;
 }
 function serveTarget(aim,side){const x=aim==='wide'?.24:aim==='body'?.36:.47;return {x:side==='left'?x:1-x,y:.32};}
 function canHit(b,who){return b.active&&b.last!==who&&b.bounces===1&&b.z>=.012&&b.z<=.25;}
 return {launch,launchShot,step,landing,serveTarget,canHit,NET,LEFT,RIGHT};
});
