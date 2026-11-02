/** Phase 06.2 — deterministic 500m-wide Dhaka-style neighborhood lots.
 * 12 units = 1m; typical residential floor ≈3.2–3.6m.
 * Buildings live inside 2×2 slots per city block, leave street setbacks,
 * reserve the BRACU clearing, and never overlap road surfaces.
 */
import { WORLD } from './config.js';
import { CITY_BLOCK_X, CITY_BLOCK_Z, ROADS, pointRoadClassification } from './roads-data.js';
const rand = (seed) => { let v = seed >>> 0; return () => { v = (Math.imul(1664525,v) + 1013904223) >>> 0; return v / 4294967296; }; };
const random = rand(4232026);
export const BUILDING_SEED = 4232026;
const freeze = Object.freeze;

export const BUILDING_LOTS = freeze(CITY_BLOCK_X.flatMap((bx,i) => CITY_BLOCK_Z.flatMap((bz,j) => {
  const width=bx.end-bx.start, depth=bz.end-bz.start;
  if(width<160 || depth<160)return [];
  const setback=ROADS.sidewalkWidth+24;
  const usableX=width-2*setback, usableZ=depth-2*setback;
  if(usableX<160 || usableZ<160)return [];
  const cols=usableX>=560?2:1, rows=usableZ>=560?2:1;
  const lots=[];
  for(let c=0;c<cols;c++)for(let r=0;r<rows;r++){
    const slotW=usableX/cols,slotD=usableZ/rows;
    const w=Math.min(slotW-58,182+random()*106);
    const d=Math.min(slotD-58,158+random()*100);
    if(w<95||d<95)continue;
    // Place buildings in their own padded sublots; stagger slightly for variety.
    const cx=bx.start+setback+slotW*(c+.5)+(random()-.5)*Math.min(46,slotW-w-35);
    const cz=bz.start+setback+slotD*(r+.5)+(random()-.5)*Math.min(46,slotD-d-35);
    const footprintRadius=Math.hypot(w,d)/2+24;
    if(Math.hypot(cx-WORLD.bracu.x,cz-WORLD.bracu.z)<WORLD.bracu.clearingRadius+footprintRadius)continue;
    // Preserve a recognizable campus skyline while varying residential heights.
    const floors=3+Math.floor(random()*7); // 3–9 actual floors, not 6–13m buildings
    const floorHeight=38+Math.floor(random()*5); // 3.17–3.5m per floor
    const height=floors*floorHeight;
    lots.push(freeze({id:`b-${i}-${j}-${c}-${r}`,x:cx,z:cz,width:w,depth:d,height,
      floors,floorHeight,style:Math.floor(random()*5),balconies:random()<.68,roof:random()<.62}));
  }
  return lots;
})));
export function isLotValid(lot){
  if(!Number.isFinite(lot.x)||!Number.isFinite(lot.z)||!Number.isFinite(lot.height))return false;
  if(Math.abs(lot.x)+lot.width/2>WORLD.halfExtent||Math.abs(lot.z)+lot.depth/2>WORLD.halfExtent)return false;
  if(pointRoadClassification(lot.x,lot.z)!=='block')return false;
  for(const x of [lot.x-lot.width/2,lot.x+lot.width/2])
   for(const z of [lot.z-lot.depth/2,lot.z+lot.depth/2])
    if(pointRoadClassification(x,z)!=='block')return false;
  if(Math.hypot(lot.x-WORLD.bracu.x,lot.z-WORLD.bracu.z)<WORLD.bracu.clearingRadius+Math.hypot(lot.width,lot.depth)/2)return false;
  return lot.width>=95&&lot.depth>=95&&lot.height>=110&&lot.floorHeight>=38;
}
