/** BRAC University geometry anchored to the rescaled Phase 06.2 game map. */
import { WORLD } from './config.js';
export const CAMPUS = Object.freeze({
 center: Object.freeze({ x: WORLD.bracu.x, z: WORLD.bracu.z }),
 gate: Object.freeze({ x: 0, z: WORLD.bracu.z - 228 }),
 delivery: Object.freeze({ ...WORLD.dropOff }),
 podium: Object.freeze({ width: 444, depth: 284, y: 6 }),
 tower: Object.freeze({ width: 292, depth: 168, height: 350, zOffset: 53 }),
 // All decorative elements deliberately confined to BRACU's reserved clearing.
 plaza: Object.freeze({ x: 0, z: WORLD.bracu.z - 183, width: 240, depth: 70 }),
});
export function inCampusClearing(x,z){return Math.hypot(x-CAMPUS.center.x,z-CAMPUS.center.z)<=WORLD.bracu.clearingRadius;}
export function deliveryMatchesOriginal(){return CAMPUS.delivery.x===WORLD.dropOff.x&&CAMPUS.delivery.z===WORLD.dropOff.z;}
