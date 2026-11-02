/** Phase 03 deterministic building footprints. Kept separate from rendering. */
import { WORLD } from './config.js';
import { CITY_BLOCK_X, CITY_BLOCK_Z, ROADS, pointRoadClassification } from './roads-data.js';
const rand = (seed) => { let v = seed >>> 0; return () => { v = (Math.imul(1664525,v) + 1013904223) >>> 0; return v / 4294967296; }; };
const random = rand(4232026);
export const BUILDING_SEED = 4232026;
export const BUILDING_LOTS = Object.freeze(CITY_BLOCK_X.flatMap((x, i) => CITY_BLOCK_Z.flatMap((z, j) => {
  const width = x.end - x.start, depth = z.end - z.start;
  if (width < 105 || depth < 105) return [];
  const edge = 31, usableX = width - 2*edge, usableZ = depth - 2*edge;
  if (usableX < 75 || usableZ < 75) return [];
  const cols = usableX > 300 ? 2 : 1, rows = usableZ > 320 ? 2 : 1;
  const lots = [];
  for (let c = 0; c < cols; c++) for (let r = 0; r < rows; r++) {
    const slotW=usableX/cols,slotD=usableZ/rows;
    const w=Math.min(slotW-15, 115+random()*38),d=Math.min(slotD-15, 106+random()*43);
    if(w<58||d<58) continue;
    const cx=x.start+edge+slotW*(c+.5),cz=z.start+edge+slotD*(r+.5);
    // Keep the BRACU campus/clearing for its own dedicated phase.
    if(Math.hypot(cx-WORLD.bracu.x,cz-WORLD.bracu.z)<WORLD.bracu.clearingRadius+Math.hypot(w,d)/2+18) continue;
    const height=Math.round((6+Math.floor(random()*8))*WORLD.gameUnitsPerMeter);
    lots.push(Object.freeze({id:`b-${i}-${j}-${c}-${r}`,x:cx,z:cz,width:w,depth:d,height,style:Math.floor(random()*5),balconies:random()<.68,roof:random()<.62}));
  }
  return lots;
}))); 
export function isLotValid(lot){
  const margin=lot.width/2+ROADS.sidewalkWidth;
  const depthMargin=lot.depth/2+ROADS.sidewalkWidth;
  if(Math.abs(lot.x)+lot.width/2>WORLD.halfExtent||Math.abs(lot.z)+lot.depth/2>WORLD.halfExtent)return false;
  if(pointRoadClassification(lot.x,lot.z)!=='block')return false;
  for(const x of [lot.x-lot.width/2,lot.x+lot.width/2])
   for(const z of [lot.z-lot.depth/2,lot.z+lot.depth/2])
    if(pointRoadClassification(x,z)!=='block')return false;
  if(Math.hypot(lot.x-WORLD.bracu.x,lot.z-WORLD.bracu.z)<WORLD.bracu.clearingRadius+Math.hypot(lot.width,lot.depth)/2)return false;
  return margin>0&&depthMargin>0&&lot.height>0;
}
