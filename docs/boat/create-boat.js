import * as THREE from 'three';
import { WORLD } from '../world/config.js';
import { BOAT, headingVector, boatFitsWorld, approachStep, steeringInput } from './boat-data.js';

/**
 * Stylized Dhaka rescue boat: open painted timber hull, curved bow,
 * gunwale trims, thwart seats, planking and two animated traditional oars.
 * Entire mesh is generated in Three.js; no external model download.
 * Source proportions follow the eight station cross-sections. The geometry
 * receives a uniform horizontal footprint correction for a 7.5m rescue hull.
 */
export function createPlayerBoat(scene,water){
  const group=new THREE.Group();
  group.name='PlayerBoat_ThreeJS_Phase06';
  scene.add(group);
  const hull=new THREE.Group();hull.name='HullRockAndBob';group.add(hull);
  // Correct original ~12.7m × 4.75m footprint to ~7.5m × 2.6m.
  // Y is deliberately unchanged to preserve freeboard and paddle depth.
  hull.scale.set(.54,1,.59);
  const disposeGeometries=[];
  const mats=[];
  function material(options){const m=new THREE.MeshStandardMaterial(options);mats.push(m);return m;}
  const outside=material({color:0x156771,roughness:.38,metalness:.10,side:THREE.DoubleSide});
  const darkOutside=material({color:0x0a414f,roughness:.42,metalness:.05,side:THREE.DoubleSide});
  const inner=material({color:0x3c2920,roughness:.94,side:THREE.DoubleSide});
  const timber=material({color:0x98623d,roughness:.82});
  const timberLight=material({color:0xc18b56,roughness:.72});
  const plankDark=material({color:0x6a4431,roughness:.9});
  const copper=material({color:0xb78a4d,metalness:.67,roughness:.35});
  const rope=material({color:0xdcc3a0,roughness:.94});
  const darkMetal=material({color:0x252f35,metalness:.7,roughness:.44});
  const safety=material({color:0xda7444,roughness:.55});

  function addMesh(geometry,mat,parent=hull){
    const mesh=new THREE.Mesh(geometry,mat);parent.add(mesh);disposeGeometries.push(geometry);
    mesh.castShadow=true;mesh.receiveShadow=true;return mesh;
  }
  function box(w,h,d,x,y,z,mat,parent=hull){
    const m=addMesh(new THREE.BoxGeometry(w,h,d),mat,parent);m.position.set(x,y,z);return m;
  }
  function rod(from,to,radius,mat,parent=hull,radial=8){
    const a=new THREE.Vector3(...from),b=new THREE.Vector3(...to),dir=new THREE.Vector3().subVectors(b,a);
    const mesh=addMesh(new THREE.CylinderGeometry(radius,radius,dir.length(),radial),mat,parent);
    mesh.position.copy(a).add(b).multiplyScalar(.5);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),dir.normalize());return mesh;
  }
  // Station Z follows the original boat's longitudinal X, 0.68 world scale.
  const stations=[[-100,10],[-92,29],[-66,37],[-24,41],[25,42],[72,35],[100,24],[123,1]]
    .map(([z,half])=>({z:z*.68,half:Math.max(1.3,half*.68)}));
  function curvedBand(side,level1,level2,inset1,inset2,mat){
    const v=[],indices=[];
    for(const st of stations){
      v.push(side*Math.max(.4,st.half-inset1),level1,st.z);
      v.push(side*Math.max(.4,st.half-inset2),level2,st.z);
    }
    for(let i=0;i<stations.length-1;i++){
      const q=i*2;indices.push(q,q+1,q+2,q+1,q+3,q+2);
    }
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(v,3));g.setIndex(indices);g.computeVertexNormals();
    addMesh(g,mat);
  }
  for(const side of [-1,1]){
    curvedBand(side,9,-5,0,3,side>0?outside:darkOutside);
    curvedBand(side,-5,-13,3,Math.max(4,8),darkOutside);
    // Interior sloping wooden liner and a brightly painted upper rail.
    curvedBand(side,9,-2,2.0,7.6,inner);
    curvedBand(side,10.5,8.2,-1.3,4.6,timberLight);
    const rail=[];
    for(const st of stations)rail.push(new THREE.Vector3(side*(st.half+.6),10.3,st.z));
    const curve=new THREE.CatmullRomCurve3(rail);
    addMesh(new THREE.TubeGeometry(curve,64,1.6,6,false),copper);
    // Lower rub rail catches highlights at the painted waterline.
    const rub=stations.map(st=>new THREE.Vector3(side*Math.max(.6,st.half-2),-1.1,st.z));
    addMesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(rub),64,1.0,5,false),timberLight);
  }
  // Tapered floor spans the width only in each station pair (no closed box hull).
  for(let i=1;i<stations.length-2;i++){
    const a=stations[i],b=stations[i+1];
    const v=[-a.half+5,1,a.z,a.half-5,1,a.z,-b.half+5,1,b.z,b.half-5,1,b.z];
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(v,3));g.setIndex([0,2,1,1,2,3]);g.computeVertexNormals();
    addMesh(g, i%2?timber:inner);
  }
  for(const z of [-50,-29,-8,13,34,55])box(33,.65,2,0,1.45,z,plankDark);
  // Seat thwarts are wide enough to hold future passenger meshes.
  for(const [z,w] of [[-37,44],[1,49],[41,41]]){
    box(w,3.0,10,0,7.3,z,timberLight);
    for(const sx of [-1,1])box(3,7,6,sx*(w/2-2),2.4,z,timber);
    box(w-4,.8,1.0,0,9.2,z,plankDark);
  }
  // Raised bow / stern decks, decorative tie-down fittings and rescue strip.
  box(29,2.4,14,0,8.1,62,timber);
  box(27,2.4,12,0,8,-56,timber);
  for(const z of [-56,62]){
    addMesh(new THREE.TorusGeometry(3.8,.8,8,18),darkMetal).position.set(0,11.4,z);
  }
  for(const s of [-1,1]){
    box(4,2,16,s*19,10.1,26,safety);
    box(4,2,16,s*17,10.1,-22,safety);
    // Oar locks are short reinforced side fittings.
    rod([s*24,9,-12],[s*27,13,-12],1.7,darkMetal);
  }
  // Bow's bronze-tinted reinforcing post (front +Z).
  rod([0,2,75],[0,16,79],1.5,copper);
  rod([-8,9,75],[0,16,79],1.0,rope);
  rod([8,9,75],[0,16,79],1.0,rope);

  const oars=[];
  for(const side of [-1,1]){
    const pivot=new THREE.Group();pivot.position.set(side*26,11,-12);pivot.name=side>0?'StarboardOar':'PortOar';hull.add(pivot);
    // Long wooden shaft, handle inward, flattened blade dipping outward.
    rod([-side*19,2,0],[side*49,-11,0],1.8,timberLight,pivot,9);
    rod([-side*24,3,0],[-side*16,1.4,0],2.3,timber,pivot);
    // A tapered, wide paddle blade; the outer tip goes just below flood level.
    const paddle=addMesh(new THREE.CylinderGeometry(4.5,7.5,23,5,1),timber,pivot);
    paddle.scale.set(1,.95,.34);
    paddle.position.set(side*50,-19,0);
    paddle.rotation.z=side*.18;
    oars.push({side,pivot,paddle});
  }

  // Small foam crescents live above the floodwater, not as unbounded particle spam.
  const foamGroup=new THREE.Group();foamGroup.name='BoatWakeFoam';scene.add(foamGroup);
  const foamGeometry=new THREE.RingGeometry(.62,1,24);
  const foam=[];
  for(let i=0;i<32;i++){
    const mat=new THREE.MeshBasicMaterial({color:i%4?0xcce8e7:0xf0ffff,transparent:true,opacity:0,
      blending:THREE.NormalBlending,depthWrite:false,side:THREE.DoubleSide});
    mats.push(mat);
    const mesh=new THREE.Mesh(foamGeometry,mat);mesh.rotation.x=-Math.PI/2;mesh.renderOrder=18;mesh.visible=false;
    foamGroup.add(mesh);foam.push({mesh,age:100,initialSize:1});
  }
  let foamIndex=0,wakeClock=0,strokeClock=0,elapsed=0;
  const state={x:BOAT.spawn.x,z:BOAT.spawn.z,angle:BOAT.initialHeading,
    speed:0,rowing:false,boost:false,blocked:false,strokeTime:0,visible:true,wakes:true,sounds:true};
  const audio=['paddle_1.mp3','paddle_2.mp3','paddle_3.mp3'].map(name=>{
    const a=new Audio(`./audio/${name}`);a.volume=.3;a.preload='none';return a;
  });
  let audioIndex=0,lastAudioTime=-999;
  function playPaddle(){
    if(!state.sounds||elapsed-lastAudioTime<.48)return;
    lastAudioTime=elapsed;
    const a=audio[audioIndex++%audio.length];
    try{a.currentTime=0;a.play().catch(()=>{});}catch{};
  }
  function emitFoam(x,z,size=1){
    const p=foam[foamIndex++%foam.length];p.age=0;p.initialSize=size;
    p.mesh.position.set(x,WORLD.waterReferenceY+.58,z);
    p.mesh.scale.set(size*10,size*5,1);p.mesh.material.opacity=.36;
    p.mesh.visible=true;
  }
  function updateFoam(dt){
    for(const f of foam){
      if(f.age>=1.4)continue;
      f.age+=dt;
      const life=Math.min(1,f.age/1.4);
      f.mesh.scale.x=f.initialSize*(10+life*28);
      f.mesh.scale.y=f.initialSize*(5+life*14);
      f.mesh.material.opacity=(1-life)*.34;
      if(life>=1)f.mesh.visible=false;
    }
  }
  function update(dt,keys){
    const delta=Math.min(.05,Math.max(0,dt));elapsed+=delta;
    const forwards=(keys.has('w')||keys.has('arrowup')?1:0)-(keys.has('s')||keys.has('arrowdown')?1:0);
    const steering=steeringInput(keys);
    state.boost=keys.has(' ')&&forwards>0;
    const target=forwards===0?0:(forwards>0?BOAT.forwardSpeed:BOAT.backwardSpeed)*forwards*(state.boost?BOAT.boostFactor:1);
    state.speed+= (target-state.speed)*Math.min(1,delta*(forwards?4.5:3.3));
    if(Math.abs(state.speed)<.1)state.speed=0;
    const oldAngle=state.angle;
    if(steering){
      state.angle=(state.angle+steering*BOAT.turnRateDegrees*delta*(.35+.65*Math.min(1,Math.abs(state.speed)/BOAT.forwardSpeed))+360)%360;
      if(!boatFitsWorld(state.x,state.z,state.angle))state.angle=oldAngle;
    }
    state.blocked=false;
    // Substep movement so collision cannot tunnel through a building.
    const move=state.speed*delta,steps=Math.max(1,Math.ceil(Math.abs(move)/6));
    for(let i=0;i<steps;i++){
      const next=approachStep(state.x,state.z,state.angle,move/steps);
      state.x=next.x;state.z=next.z;
      if(next.blocked){state.blocked=true;state.speed=0;break;}
    }
    state.rowing=forwards!==0&&Math.abs(state.speed)>7&&!state.blocked;
    const wasStroke=state.strokeTime;
    if(state.rowing)state.strokeTime=(state.strokeTime+delta)%BOAT.rowingCycleSeconds;
    else state.strokeTime=0;
    if(state.rowing&&state.strokeTime<wasStroke){playPaddle();}

    const rad=state.angle*Math.PI/180;
    const front=headingVector(state.angle),port={x:-front.z,z:front.x};
    group.position.set(state.x,WORLD.waterReferenceY+.55,state.z);
    group.rotation.y=Math.PI/2-rad;
    const rowEnergy=Math.min(1,Math.abs(state.speed)/BOAT.forwardSpeed);
    const bob=.85*Math.sin(elapsed*3.5)+.45*Math.sin(elapsed*2.2+.7);
    hull.position.y=bob;
    hull.rotation.x=.017*Math.sin(elapsed*2.9)+(state.rowing ? .008*Math.sin(state.strokeTime*2*Math.PI/BOAT.rowingCycleSeconds) : 0);
    hull.rotation.z=.014*Math.sin(elapsed*2.3+1.2)+steering*.008*rowEnergy;
    const phase=state.strokeTime*2*Math.PI/BOAT.rowingCycleSeconds;
    for(const o of oars){
      const wave=state.rowing?Math.sin(phase):0;
      o.pivot.rotation.y=o.side*wave*.24;
      o.pivot.rotation.z=o.side*(.035+(state.rowing?Math.cos(phase)*.08:0));
    }
    if(state.wakes&&water.state.visible&&!water.state.paused&&state.rowing){
      wakeClock+=delta;strokeClock+=delta;
      if(wakeClock>=.14){wakeClock=0;
        const sternX=state.x-front.x*(BOAT.length*.43),sternZ=state.z-front.z*(BOAT.length*.43);
        water.addInteraction(sternX,sternZ,-.23-Math.min(.23,rowEnergy*.19),25);
        for(const s of [-1,1])emitFoam(sternX+port.x*s*8,sternZ+port.z*s*8,.55);
      }
      if(strokeClock>=BOAT.rowingCycleSeconds){strokeClock-=BOAT.rowingCycleSeconds;
        for(const s of [-1,1]){
          const x=state.x+port.x*s*36-front.x*9,z=state.z+port.z*s*36-front.z*9;
          water.addInteraction(x,z,.38,20);emitFoam(x,z,.36);
        }
      }
    }else {wakeClock=0;strokeClock=0;}
    updateFoam(delta);
  }
  function setVisible(v){state.visible=!!v;group.visible=state.visible;foamGroup.visible=state.visible;}
  function setWakes(v){state.wakes=!!v;if(!v)for(const f of foam)f.mesh.visible=false;}
  function reset(){
    state.x=BOAT.spawn.x;state.z=BOAT.spawn.z;state.angle=BOAT.initialHeading;
    state.speed=0;state.rowing=false;state.strokeTime=0;state.blocked=false;
    foam.forEach(f=>f.mesh.visible=false);wakeClock=0;strokeClock=0;
    group.position.set(state.x,WORLD.waterReferenceY,state.z);
    group.rotation.y=0;
  }
  reset();
  return {group,hull,state,update,reset,setVisible,setWakes,
    setSounds(v){state.sounds=!!v;},
    get summary(){return `Painted timber rescue hull · ${Math.round(BOAT.length)}×${BOAT.width} game units · dual oars · GPU wake impulses`;},
    dispose(){
      group.removeFromParent();foamGroup.removeFromParent();
      for(const g of disposeGeometries)g.dispose();foamGeometry.dispose();
      for(const m of mats)m.dispose();
      for(const a of audio){a.pause();a.src='';}
    },
  };
}
