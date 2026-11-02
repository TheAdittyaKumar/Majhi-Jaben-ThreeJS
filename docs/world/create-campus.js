import * as THREE from 'three';
import { CAMPUS } from './campus-data.js';

/** Visual-only BRACU reconstruction. Not a surveyed architectural model. */
export function createCampus(scene){
 const root = new THREE.Group(); root.name = 'Phase04BRACU'; scene.add(root);
 const material=(color,roughness=.85,metalness=0)=>new THREE.MeshStandardMaterial({color,roughness,metalness});
 const pale=material(0xc8d0ca), white=material(0xe1e4dc), teal=material(0x2d6e70,.5,.1);
 const dark=material(0x263b46,.3,.15), bronze=material(0xc8a36b,.55,.25), pavement=material(0xaaa99b);
 const grass=material(0x658d61), trees=material(0x397748), trunk=material(0x71543e);
 function box(parent,name,w,h,dep,x,y,z,mat){
  const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,dep),mat);
  mesh.name=name;mesh.position.set(x,y,z);mesh.receiveShadow=true;parent.add(mesh);return mesh;
 }
 function cyl(parent,name,rTop,rBottom,h,x,y,z,mat,segments=12){
  const mesh=new THREE.Mesh(new THREE.CylinderGeometry(rTop,rBottom,h,segments),mat);
  mesh.name=name;mesh.position.set(x,y,z);parent.add(mesh);return mesh;
 }
 // Narrow elevated podium deliberately obscures the underlying road only inside the campus footprint.
 box(root,'campus-foundation',CAMPUS.podium.width,12,CAMPUS.podium.depth,0,6,CAMPUS.center.z,pale);
 box(root,'entry-plaza',CAMPUS.plaza.width,2,CAMPUS.plaza.depth,0,2,CAMPUS.plaza.z,pavement);
 const z=CAMPUS.center.z+CAMPUS.tower.zOffset;
 box(root,'central-academic-block',CAMPUS.tower.width,CAMPUS.tower.height,CAMPUS.tower.depth,0,CAMPUS.tower.height/2+12,z,white);
 // Recessed curtain wall and horizontal shading bands, with clear entry arch below.
 box(root,'front-glass',CAMPUS.tower.width-30,CAMPUS.tower.height-48,4,0,CAMPUS.tower.height/2+20,z-CAMPUS.tower.depth/2-2,dark);
 box(root,'side-wing-left',74,225,206,-(CAMPUS.tower.width/2+34),125,z+12,pale);
 box(root,'side-wing-right',74,225,206, CAMPUS.tower.width/2+34,125,z+12,pale);
 box(root,'roof-cap',CAMPUS.tower.width+18,10,CAMPUS.tower.depth+18,0,CAMPUS.tower.height+17,z,teal);
 for(let floor=1;floor<10;floor++){
  const y=22+floor*32;
  box(root,`floor-band-${floor}`,CAMPUS.tower.width+2,5,7,0,y,z-CAMPUS.tower.depth/2-6,pale);
  for(const side of [-1,1])box(root,`wing-glass-${floor}-${side}`,3,17,120,side*(CAMPUS.tower.width/2+72),y+7,z+8,dark);
 }
 // Main entrance, canopy and gate; no ID mechanic yet (later gameplay phase).
 box(root,'lobby-glass',145,56,6,0,41,z-CAMPUS.tower.depth/2-7,teal);
 box(root,'entry-canopy',186,7,51,0,75,z-CAMPUS.tower.depth/2-31,bronze);
 const gateZ=CAMPUS.gate.z;
 for(const side of [-1,1]){
  box(root,`gate-pillar-${side}`,15,45,16,side*101,23,gateZ,pale);
  box(root,`gate-wing-${side}`,81,5,6,side*154,4,gateZ,dark);
 }
 box(root,'gate-header',227,15,16,0,49,gateZ,teal);
 // Text is rendered using browser canvas (no font downloads or external font dependencies).
 function sign(text,w,h,fontsize=42){
  const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=128;
  const ctx=canvas.getContext('2d');ctx.clearRect(0,0,1024,128);
  ctx.fillStyle='#ffffff';ctx.textAlign='center';ctx.textBaseline='middle';ctx.font=`700 ${fontsize}px Arial, sans-serif`;
  ctx.fillText(text,512,64,980);
  const tex=new THREE.CanvasTexture(canvas);tex.colorSpace=THREE.SRGBColorSpace;
  const mesh=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:tex,transparent:true,depthWrite:false,side:THREE.DoubleSide}));
  mesh.rotation.y=Math.PI;root.add(mesh);return mesh;
 }
 const gateSign=sign('BRAC UNIVERSITY',188,22,64);gateSign.name='gate-sign';gateSign.position.set(0,50,gateZ-9);
 const towerSign=sign('BRAC UNIVERSITY',220,35,56);towerSign.name='tower-sign';towerSign.position.set(0,346,z-CAMPUS.tower.depth/2-11);
 // Landscaping within the campus footprint, deliberately leaving the entrance route open.
 for(let row=0;row<3;row++)for(const side of [-1,1]){
  const x=side*(130+row*34), tz=CAMPUS.center.z-148+row*50;
  box(root,`garden-${row}-${side}`,35,3,38,x,3,tz,grass);
  cyl(root,`tree-trunk-${row}-${side}`,3,4,29,x,20,tz,trunk);
  const crown=new THREE.Mesh(new THREE.IcosahedronGeometry(19,1),trees);
  crown.name=`tree-crown-${row}-${side}`;crown.position.set(x,48,tz);root.add(crown);
 }
 const dropMarker = new THREE.Mesh(new THREE.RingGeometry(14,22,32),new THREE.MeshBasicMaterial({color:0x78f0b6,side:THREE.DoubleSide}));
 dropMarker.name='dropoff-target';dropMarker.rotation.x=-Math.PI/2;dropMarker.position.set(CAMPUS.delivery.x,2.5,CAMPUS.delivery.z);root.add(dropMarker);
 return {root,setVisible(visible){root.visible=visible;},gate:CAMPUS.gate,delivery:CAMPUS.delivery};
}
