const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const Character=require('./character.js');
function setup(loaded){
 const scope={window:{}};
 if(loaded)scope.Image=class{complete=true;naturalWidth=1536;};
 vm.runInNewContext(fs.readFileSync('graphics.js','utf8'),scope);
 let images=0;
 const c=new Proxy({}, {get(target,key){
  if(key==='createLinearGradient')return (...args)=>{args.forEach(n=>assert.ok(Number.isFinite(n)));return {addColorStop(){}}};
  if(key==='drawImage')return ()=>images++;
  return (...args)=>{for(const value of args)if(typeof value==='number')assert.ok(Number.isFinite(value),key+' received a non-finite coordinate');};
 }});
 return {g:scope.window.TenAceGraphics,c,imageCount:()=>images};
}
test('both venue renderers support scenery loading and a fallback without image support',()=>{
 for(const loaded of [false,true]){
  const {g,c,imageCount}=setup(loaded);
  for(const [w,h] of [[390,550],[375,400],[640,280]]){
   const bounds={L:w*.055,R:w*.945,T:h*.36,B:h*.92,N:h*.64};
   for(const theme of ['park','terrace']){g.court(c,w,h,bounds,theme);g.net(c,bounds);}
  }
  assert.equal(imageCount(),loaded?6:0);
 }
});
test('all customizable silhouettes render in front, back, running and shot poses',()=>{
 const {g,c}=setup(false);
 for(const style of ['crop','curls','ponytail','bun','shaved'])for(const frame of ['classic','power','control']){
  const look={...Character.fresh(),style,frame};
  for(const pose of [{},{back:true},{run:1,time:.5},{serve:true},{celebrate:true},...['slice','topspin','flat','lob'].map(shot=>({shot,swing:.5}))])g.person(c,100,150,1,look,pose);
 }
});
