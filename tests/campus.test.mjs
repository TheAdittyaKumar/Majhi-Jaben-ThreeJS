import test from 'node:test';
import assert from 'node:assert/strict';
import { CAMPUS,deliveryMatchesOriginal,inCampusClearing } from '../docs/world/campus-data.js';
import { WORLD } from '../docs/world/config.js';
import { BUILDING_LOTS } from '../docs/world/buildings-data.js';
test('BRACU anchored at original world position',()=>{assert.deepEqual(CAMPUS.center,{x:0,z:1378});assert.equal(WORLD.size,3300);});
test('drop-off stays exactly at original gameplay coordinates',()=>{assert.ok(deliveryMatchesOriginal());assert.deepEqual(CAMPUS.delivery,{x:0,y:0,z:1080});});
test('campus entry and tower remain within playable limits',()=>{for(const z of [CAMPUS.gate.z,CAMPUS.center.z,CAMPUS.center.z+CAMPUS.tower.zOffset])assert.ok(Math.abs(z)<WORLD.halfExtent);});
test('existing building lots still clear BRACU region',()=>{for(const b of BUILDING_LOTS)assert.equal(inCampusClearing(b.x,b.z),false);});
