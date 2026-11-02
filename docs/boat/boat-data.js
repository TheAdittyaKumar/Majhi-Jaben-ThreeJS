/**
 * Phase 06: player rescue boat dimensions, controls and map collision checks.
 * All values remain in the source game's world units (12 units ≈ 1 metre).
 * This module intentionally does not import Three.js, so it can be unit-tested.
 */
import { WORLD, insidePlayableArea } from '../world/config.js';
import { BUILDING_LOTS } from '../world/buildings-data.js';

export const BOAT = Object.freeze({
  length: 152,
  width: 57,
  waterlineY: WORLD.waterReferenceY,
  spawn: Object.freeze({x: WORLD.playerSpawn.x, z: WORLD.playerSpawn.z}),
  initialHeading: WORLD.playerSpawn.headingDegrees,
  forwardSpeed: 270,
  backwardSpeed: 165,
  boostFactor: 1.45,
  turnRateDegrees: 105,
  hullMargin: 24,
  rowingCycleSeconds: 0.65,
  boatEdgeMargin: 87,
  campusDryLimit: WORLD.bracu.clearingRadius - 72,
});

const DEG_TO_RAD = Math.PI/180;
export function headingVector(degrees) {
  const angle=degrees*DEG_TO_RAD;
  return {x:Math.cos(angle), z:Math.sin(angle)};
}
export function boatFitsWorld(x,z,headingDegrees=90){
  if(!Number.isFinite(x)||!Number.isFinite(z)||!Number.isFinite(headingDegrees))return false;
  const f=headingVector(headingDegrees),left={x:-f.z,z:f.x};
  // Check both ends of the hull as well as either side, not only the boat center.
  const checks=[
    [x,z],
    [x+f.x*65,z+f.z*65],
    [x-f.x*60,z-f.z*60],
    [x+left.x*25,z+left.z*25],
    [x-left.x*25,z-left.z*25],
  ];
  // Keep the boat CENTER outside the dry campus interior, while allowing the bow
  // to cross the shoreline when docking at the original BRACU drop-off.
  if(Math.hypot(x-WORLD.bracu.x,z-WORLD.bracu.z)<BOAT.campusDryLimit)return false;
  for(const [px,pz] of checks){
    if(!insidePlayableArea(px,pz,5))return false;
    for(const lot of BUILDING_LOTS){
      if(Math.abs(px-lot.x)<lot.width/2+BOAT.hullMargin &&
         Math.abs(pz-lot.z)<lot.depth/2+BOAT.hullMargin)return false;
    }
  }
  return true;
}

export function approachStep(x,z,headingDegrees,travel){
  const f=headingVector(headingDegrees);
  const nx=x+f.x*travel, nz=z+f.z*travel;
  return boatFitsWorld(nx,nz,headingDegrees)?{x:nx,z:nz,blocked:false}:{x,z,blocked:true};
}
