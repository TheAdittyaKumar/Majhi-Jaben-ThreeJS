/**
 * Phase 06.2: player rescue boat dimensions and map collision checks.
 * 12 units ≈ 1 metre. World and boat coordinates are newly re-scaled.
 * This module intentionally does not import Three.js, so it can be unit-tested.
 */
import { WORLD, insidePlayableArea } from '../world/config.js';
import { BUILDING_LOTS } from '../world/buildings-data.js';

export const BOAT = Object.freeze({
  length: 90,
  width: 31,
  waterlineY: WORLD.waterReferenceY,
  spawn: Object.freeze({x: WORLD.playerSpawn.x, z: WORLD.playerSpawn.z}),
  initialHeading: WORLD.playerSpawn.headingDegrees,
  forwardSpeed: 84,
  backwardSpeed: 51,
  boostFactor: 1.6,
  turnRateDegrees: 102,
  hullMargin: 13,
  rowingCycleSeconds: 0.65,
  boatEdgeMargin: 48,
  // Boat center stays afloat; the bow can overlap the dry bank while docking.
  campusDryLimit: WORLD.bracu.clearingRadius - 14,
});

const DEG_TO_RAD = Math.PI/180;
/**
 * Return the direction of visual steering from the boat/chase-camera view.
 * Positive angle from heading 90 degrees turns toward -X (screen right),
 * while negative angle turns toward +X (screen left).
 * A/Left => -1, D/Right => +1; opposing inputs cancel each other.
 */
export function steeringInput(keys) {
  const left=keys.has('a') || keys.has('arrowleft');
  const right=keys.has('d') || keys.has('arrowright');
  return Number(right)-Number(left);
}
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
    [x+f.x*(BOAT.length*.49),z+f.z*(BOAT.length*.49)],
    [x-f.x*(BOAT.length*.47),z-f.z*(BOAT.length*.47)],
    [x+left.x*(BOAT.width*.48),z+left.z*(BOAT.width*.48)],
    [x-left.x*(BOAT.width*.48),z-left.z*(BOAT.width*.48)],
    // Cover the four corners, not only the tips and sides.
    ...[-1,1].flatMap(a=>[-1,1].map(b=>[
      x+f.x*a*(BOAT.length*.35)+left.x*b*(BOAT.width*.4),
      z+f.z*a*(BOAT.length*.35)+left.z*b*(BOAT.width*.4)])),
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
