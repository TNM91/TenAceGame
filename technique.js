(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.TenAceTechnique=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
 const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
 // Gesture shape chooses the shot; time held loads power independently of flick speed.
 function gesture({dx=0,dy=0,heldMs=0,swipeMs=150}={}){
  const distance=Math.hypot(dx,dy),charge=clamp(heldMs/900,0,1),vertical=Math.abs(dy)>Math.abs(dx)*.65;
  const shot=vertical&&dy>.055?'slice':vertical&&dy<-.24&&swipeMs>=280?'lob':vertical&&dy<-.045?'topspin':'flat';
  const target=aim(dx,shot);target.y=shot==='lob'?.14:shot==='slice'?.32:clamp(.31-Math.max(0,-dy)*.4,.12,.31);
  return {shot,charge,dx,dy,target,valid:distance>=.035};
 }
 function aim(dx,shot){return {x:clamp(.5+dx*.9,.23,.77),y:shot==='lob'?.16:shot==='slice'?.32:.23};}
 // Skill determines pace and placement. Safe shots weaken under pressure instead
 // of receiving an unrelated random out roll; flat shots retain an explicit risk.
 function resolve({dx,shot,error,timing,reach,stamina,power,control,charge=.5,targetY}){
  const target=aim(dx,shot);if(Number.isFinite(targetY))target.y=clamp(targetY,.12,.36);const precision=clamp(1-error/(timing+.14),0,1),stretch=clamp((reach-.13)/.1,0,1),fatigue=clamp((45-stamina)/45,0,1);
  const clean=error<timing,pressure=clamp((1-precision)*.5+stretch*.3+fatigue*.2+Math.max(0,charge-.5)*(1-precision)*.3-control*.012,0,1);
  const base={topspin:.61,slice:.50,lob:.43,flat:.75}[shot]||.61;
  const miss=shot==='flat'&&!clean&&pressure>.62;
  const x=miss?(target.x<.5?.14:.86):.5+(target.x-.5)*(1-pressure*.55);
  const y=target.y+pressure*(shot==='lob'?.15:.13);
  return {x,y,speed:base*power*(.78+clamp(charge,0,1)*.44)*(clean?1.10:1-pressure*.38),precision,pressure,clean,miss,
   cost:({topspin:3,slice:2,lob:3,flat:5}[shot]||3)*(1+stretch*.5)*(.8+clamp(charge,0,1)*.4),
   feedback:miss?'Forced flat · Too stretched':clean?'Clean contact':pressure>.45?'Defensive return · Recover':'Controlled return'};
 }
 // Serve intent is deterministic: angle places it, length sets depth, speed sets pace.
 // Normalized court coordinates keep the gesture consistent across screen sizes.
 function serveGesture({dx=0,dy=0,swipeMs=180,side='left',power=1}={}){
  const up=-dy,distance=Math.hypot(dx,dy),valid=up>=.055&&up>Math.abs(dx)*.45;
  const pace=clamp(distance/Math.max(.08,swipeMs/1000)/2,0,1);
  const target={x:clamp((side==='left'?.34:.66)+dx/Math.max(.055,up)*.22,.10,.90),y:clamp(.46-up*.65,.08,.46)};
  const inBox=target.x>=(side==='left'?.18:.5)&&target.x<=(side==='left'?.5:.82)&&target.y>=.21;
  target.inBox=inBox;
  return {valid,shot:'serve',target,pace,charge:pace,time:clamp((1.35-pace*.5)/Math.max(.5,power),.68,1.6),inBox};
 }
 return {aim,resolve,gesture,serveGesture};
});
