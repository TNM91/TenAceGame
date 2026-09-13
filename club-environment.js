import * as T from './vendor/three.module.min.js';

// 120 canopy cards share one geometry, material and texture: two foliage draw calls
// including shadows instead of dozens of individual sphere meshes.
export function addClubEnvironment(scene,onLoaded=()=>{}){
 const group=new T.Group();group.name='ClubEnvironment';scene.add(group);let disposed=false;
 const geometry=new T.PlaneGeometry(1,1),material=new T.MeshStandardMaterial({color:'#acc395',roughness:1,side:T.DoubleSide,alphaTest:.45});
 const canopy=new T.InstancedMesh(geometry,material,120);canopy.visible=false;canopy.castShadow=true;canopy.receiveShadow=true;group.add(canopy);
 const transform=new T.Object3D();let n=0;
 for(let tree=0;tree<12;tree++){
  const x=-22+tree*4,z=-22-(tree%3)*2.5;
  for(let leaf=0;leaf<10;leaf++){
   const a=leaf*2.39996;transform.position.set(x+Math.cos(a)*1.1,3.8+(leaf%4)*.85,z+Math.sin(a)*1.2);
   transform.rotation.set((leaf%3-1)*.25,a,.15*Math.sin(a));transform.scale.set(3.5+(leaf%3)*.35,3.5,1);transform.updateMatrix();canopy.setMatrixAt(n++,transform.matrix);
  }
 }
 canopy.instanceMatrix.needsUpdate=true;
 const texture=new T.TextureLoader().load('./assets/club-foliage.png',()=>{if(disposed){texture.dispose();return;}texture.colorSpace=T.SRGBColorSpace;material.map=texture;material.needsUpdate=true;canopy.visible=true;onLoaded();},undefined,()=>{});
 // Distant back fence, layered behind the windscreen instead of a solid wall.
 const points=[];for(let x=-9;x<=9;x+=.3)points.push(new T.Vector3(x,.2,-12.9),new T.Vector3(x,3.2,-12.9));
 for(let y=.2;y<=3.2;y+=.3)points.push(new T.Vector3(-9,y,-12.9),new T.Vector3(9,y,-12.9));
 group.add(new T.LineSegments(new T.BufferGeometry().setFromPoints(points),new T.LineBasicMaterial({color:'#304f54',transparent:true,opacity:.55})));
 group.userData.release=()=>{disposed=true;texture.dispose();};
 return group;
}
