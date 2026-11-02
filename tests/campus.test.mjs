import test from 'node:test';
import assert from 'node:assert/strict';
import {CAMPUS,deliveryMatchesOriginal,inCampusClearing} from '../docs/world/campus-data.js';
import {WORLD} from '../docs/world/config.js';
import {BUILDING_LOTS} from '../docs/world/buildings-data.js';

test('BRACU moves with the extended world instead of remaining at old Z=1378',()=>{
 assert.deepEqual(CAMPUS.center,{x:0,z:2600});assert.equal(WORLD.size,6000);
 assert.equal(CAMPUS.gate.z,WORLD.bracu.z-228);
 assert.equal(CAMPUS.plaza.z,WORLD.bracu.z-183);
});
test('drop-off is relocated to the wet shoreline with a dockable boat center',()=>{
 assert.ok(deliveryMatchesOriginal());
 assert.deepEqual(CAMPUS.delivery,{x:0,y:0,z:2220});
 assert.ok(!inCampusClearing(WORLD.dropOff.x,WORLD.dropOff.z)); // boat remains afloat at the shoreline
});
test('campus gate and tower remain inside the expanded playable bounds',()=>{
 for(const z of [CAMPUS.gate.z,CAMPUS.center.z,CAMPUS.center.z+CAMPUS.tower.zOffset])assert.ok(Math.abs(z)<WORLD.halfExtent);
});
test('rescaled buildings are still excluded from BRACU clearing',()=>{
 for(const b of BUILDING_LOTS)assert.equal(inCampusClearing(b.x,b.z),false);
});
