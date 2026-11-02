import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {WORLD} from '../docs/world/config.js';
import {BOAT,boatFitsWorld,approachStep} from '../docs/boat/boat-data.js';
import {CAMPUS} from '../docs/world/campus-data.js';
import {BUILDING_LOTS} from '../docs/world/buildings-data.js';
const source=(f)=>readFileSync(new URL(`../docs/${f}`,import.meta.url),'utf8');

test('true mesh footprint closely matches logical boat dimensions',()=>{
 // source stations × scale: length = 223*.68*.59 ≈89.46; width=84*.68*.54≈30.84
 assert.ok(Math.abs((123-(-100))*.68*.59 - BOAT.length)<1);
 assert.ok(Math.abs(2*42*.68*.54 - BOAT.width)<1);
 assert.match(source('boat/create-boat.js'),/hull.scale.set\(\.54,1,\.59\)/);
});
test('major gameplay anchors still admit a straight north-bound boat corridor',()=>{
 assert.ok(boatFitsWorld(WORLD.playerSpawn.x,WORLD.playerSpawn.z,90));
 assert.ok(boatFitsWorld(WORLD.dropOff.x,WORLD.dropOff.z,90));
 assert.equal(boatFitsWorld(WORLD.bracu.x,WORLD.bracu.z,90),false);
 for(let z=WORLD.playerSpawn.z;z<=WORLD.dropOff.z;z+=15){
   assert.ok(boatFitsWorld(0,z,90),`boat blocked on center corridor at z=${z}`);
 }
 assert.equal(approachStep(0,WORLD.dropOff.z,90,200).blocked,true);
 assert.ok(Math.hypot(WORLD.dropOff.x-WORLD.bracu.x,WORLD.dropOff.z-WORLD.bracu.z)>WORLD.bracu.clearingRadius);
});
test('water UVs span new surface and include playable extents',()=>{
 const toUv=(x,z)=>({u:(x+WORLD.waterHalfExtent)/WORLD.waterSize,v:(WORLD.waterHalfExtent-z)/WORLD.waterSize});
 assert.deepEqual(toUv(0,0),{u:.5,v:.5});
 for(const [x,z] of [[WORLD.halfExtent,WORLD.halfExtent],[-WORLD.halfExtent,-WORLD.halfExtent],[WORLD.playerSpawn.x,WORLD.playerSpawn.z],[CAMPUS.center.x,CAMPUS.center.z]]){
   const {u,v}=toUv(x,z); assert.ok(u>0&&u<1&&v>0&&v<1);
 }
 const s=source('water/create-water.js');
 assert.match(s,/new THREE.PlaneGeometry\(WORLD.waterSize,WORLD.waterSize/);
 assert.match(s,/uWaterHalfExtent/);
 assert.match(source('water/simulation.js'),/radius\/WORLD.waterSize/);
});
test('building occupied volume and camera offsets are not hardcoded to old city size',()=>{
 assert.ok(BUILDING_LOTS.length>100);
 assert.match(source('main.js'),/WORLD.size\*1\.4/);
 assert.match(source('main.js'),/WORLD.bracu.z\+460/);
 assert.match(source('main.js'),/WORLD.playerSpawn.z-480/);
 assert.match(source('world/create-campus.js'),/CAMPUS.center.z-148/);
});
