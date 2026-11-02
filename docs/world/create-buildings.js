import * as THREE from 'three';
import { WORLD } from './config.js';
import { BUILDING_LOTS } from './buildings-data.js';

const paint=[0xa9b1aa,0xd2c4ac,0xa9b9c2,0xd1b4a0,0xc3c2b8];
const glass=[0x263f49,0x314d5a,0x36515c];
function box(group,w,h,d,x,y,z,material,cast=false){
 const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);
 m.position.set(x,y,z);m.castShadow=cast;m.receiveShadow=true;group.add(m);return m;
}
function addFacade(b,lot,matWindow,metal,trim){
 const floors=lot.floors;
 const floorH=lot.height/floors;
 // Windows are kept in one instanced draw call per building to avoid a large scene graph.
 const positions=[];
 for(let f=0;f<floors;f++){
   const y=(f+.54)*floorH;
   for(const side of [-1,1]){
     for(let n=0;n<3;n++){
       const u=(n-1)*lot.width*.27;
       positions.push([lot.x+u,y,lot.z+side*(lot.depth/2+.7),lot.width*.17,Math.min(19,floorH*.56),1.8]);
       const v=(n-1)*lot.depth*.27;
       positions.push([lot.x+side*(lot.width/2+.7),y,lot.z+v,1.8,Math.min(19,floorH*.56),lot.depth*.17]);
     }
   }
 }
 const mesh=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),matWindow,positions.length);
 const dummy=new THREE.Object3D();
 for(let i=0;i<positions.length;i++){
   const [x,y,z,w,h,d]=positions[i]; dummy.position.set(x,y,z); dummy.scale.set(w,h,d);dummy.updateMatrix(); mesh.setMatrixAt(i,dummy.matrix);
 }
 mesh.instanceMatrix.needsUpdate=true;mesh.name=`${lot.id}-windows`;mesh.receiveShadow=true;b.add(mesh);
 // Dhaka-style projecting balconies on street-facing facades (geometry remains inside lot).
 if(lot.balconies){
  for(let f=1;f<floors;f+=2){
   const y=lot.height/floors*f+2;
   const projection=12;
   box(b,lot.width*.45,3,projection,lot.x,y,lot.z+lot.depth/2+projection/2,trim);
   box(b,lot.width*.45,11,2.5,lot.x,y+7,lot.z+lot.depth/2+projection-1,metal);
   for(const offset of [-.21,.21]) box(b,2.5,12,3,lot.x+offset*lot.width,y+7,lot.z+lot.depth/2+projection-1,metal);
  }
 }
}
export function createBuildings(scene){
 const root=new THREE.Group();root.name='Phase03DhakaBuildings';scene.add(root);
 const plaster=paint.map(color=>new THREE.MeshStandardMaterial({color,roughness:.91}));
 const roofMat=new THREE.MeshStandardMaterial({color:0x858e8b,roughness:.94});
 const glazing=glass.map(color=>new THREE.MeshStandardMaterial({color,metalness:.16,roughness:.28}));
 const railing=new THREE.MeshStandardMaterial({color:0x525e60,metalness:.35,roughness:.57});
 const edging=new THREE.MeshStandardMaterial({color:0xadaaa0,roughness:.86});
 BUILDING_LOTS.forEach(lot=>{
  const group=new THREE.Group();group.name=lot.id;root.add(group);
  box(group,lot.width,lot.height,lot.depth,lot.x,lot.height/2,lot.z,plaster[lot.style],true);
  box(group,lot.width+4,4.5,lot.depth+4,lot.x,lot.height+2.25,lot.z,roofMat);
  // Roof parapet and small rooftop water tank (common city rooftop silhouettes).
  for(const s of [-1,1]){
   box(group,lot.width+5,12,3,lot.x,lot.height+9,lot.z+s*lot.depth/2,edging);
   box(group,3,12,lot.depth+5,lot.x+s*lot.width/2,lot.height+9,lot.z,edging);
  }
  if(lot.roof){
   const tank=new THREE.Mesh(new THREE.CylinderGeometry(9,9,17,12),new THREE.MeshStandardMaterial({color:0x273a46,roughness:.75}));
   tank.position.set(lot.x-lot.width*.26,lot.height+21,lot.z-lot.depth*.24);group.add(tank);
  }
  addFacade(group,lot,glazing[lot.style%glazing.length],railing,edging);
 });
 return {root,count:BUILDING_LOTS.length,setVisible(value){root.visible=value;}};
}
