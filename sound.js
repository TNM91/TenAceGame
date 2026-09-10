(function(){
 let context,enabled=false;
 try{enabled=localStorage.getItem('tenace.sound')==='on'}catch{}
 function unlock(){if(!enabled)return;try{const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return;context??=new Audio();const pending=context.resume();if(pending?.catch)pending.catch(()=>{});}catch{}}
 function set(value){enabled=value;try{localStorage.setItem('tenace.sound',value?'on':'off')}catch{}if(value)unlock();}
 function play(kind){if(!enabled||!context||context.state!=='running')return;
  try{const now=context.currentTime,o=context.createOscillator(),g=context.createGain();o.connect(g);g.connect(context.destination);
   const p={hit:[420,160,.075],bounce:[180,75,.09],net:[95,40,.12],point:[660,990,.18],step:[65,40,.035]}[kind]||[280,150,.06];
   o.type=kind==='point'?'sine':'triangle';o.frequency.setValueAtTime(p[0],now);o.frequency.exponentialRampToValueAtTime(p[1],now+p[2]);g.gain.setValueAtTime(kind==='step'?.012:.05,now);g.gain.exponentialRampToValueAtTime(.001,now+p[2]);o.start(now);o.stop(now+p[2]);
  }catch{}
 }
 window.TenAceSound={unlock,set,play,get enabled(){return enabled}};
})();
