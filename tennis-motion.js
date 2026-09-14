// Artist-editable poses in model space (metres). Contact is supplied by gameplay.
export const readyPose={hand:[-.18,1.00,.32],support:[-.03,1.14,.34],racket:[.25,.95,.18]};
export const strokes={
 topspin:{arc:[-.50,.98,.55],finish:[.28,1.39,.22],face:[-.50,.78,-.12],turn:.56},
 flat:{arc:[-.46,1.12,.58],finish:[.38,1.13,.28],face:[-.68,.56,.15],turn:.48},
 slice:{arc:[-.40,.96,.48],finish:[.27,.82,.45],face:[-.45,.65,.50],turn:.35},
 lob:{arc:[-.35,1.22,.52],finish:[.12,1.52,.33],face:[-.15,.98,.04],turn:.40},
 serve:{arc:[-.38,1.17,.49],finish:[.32,.80,.40],face:[-.60,.40,.50],turn:.46}
};
export const serveKeys=[
 {t:0,hand:[-.18,1.00,.32],support:[-.03,1.14,.34],lift:0,turn:0},
 {t:.32,hand:[-.38,1.23,.02],support:[.15,1.60,.16],lift:-.025,turn:-.38},
 {t:.62,hand:[-.20,1.38,-.17],support:[.15,1.65,.16],lift:-.04,turn:-.45},
 {t:1,hand:[-.20,1.38,-.17],support:[.22,1.04,.24],lift:.075,turn:0}
];
export function sampleServe(t){
 t=Math.max(0,Math.min(1,t));let a=serveKeys[0],b=serveKeys[1];
 for(let i=1;i<serveKeys.length;i++){b=serveKeys[i];a=serveKeys[i-1];if(t<=b.t)break;}
 let u=(t-a.t)/(b.t-a.t);u=u*u*(3-2*u);
 const mix=(x,y)=>x+(y-x)*u;
 return {hand:a.hand.map((x,i)=>mix(x,b.hand[i])),support:a.support.map((x,i)=>mix(x,b.support[i])),lift:mix(a.lift,b.lift),turn:mix(a.turn,b.turn)};
}
