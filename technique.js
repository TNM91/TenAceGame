(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.TenAceTechnique=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
 const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
 function aim(dx,shot){return {x:clamp(.5+dx*.9,.23,.77),y:shot==='lob'?.16:shot==='slice'?.32:.23};}
 // Skill determines pace and placement. Safe shots weaken under pressure instead
 // of receiving an unrelated random out roll; flat shots retain an explicit risk.
 function resolve({dx,shot,error,timing,reach,stamina,power,control}){
  const target=aim(dx,shot),precision=clamp(1-error/(timing+.14),0,1),stretch=clamp((reach-.13)/.1,0,1),fatigue=clamp((45-stamina)/45,0,1);
  const clean=error<timing,pressure=clamp((1-precision)*.5+stretch*.3+fatigue*.2-control*.012,0,1);
  const base={topspin:.61,slice:.50,lob:.43,flat:.75}[shot]||.61;
  const miss=shot==='flat'&&!clean&&pressure>.62;
  const x=miss?(target.x<.5?.14:.86):.5+(target.x-.5)*(1-pressure*.55);
  const y=target.y+pressure*(shot==='lob'?.15:.13);
  return {x,y,speed:base*power*(clean?1.10:1-pressure*.38),precision,pressure,clean,miss,
   cost:({topspin:3,slice:2,lob:3,flat:5}[shot]||3)*(1+stretch*.5),
   feedback:miss?'Forced flat · Too stretched':clean?'Clean contact':pressure>.45?'Defensive return · Recover':'Controlled return'};
 }
 return {aim,resolve};
});
