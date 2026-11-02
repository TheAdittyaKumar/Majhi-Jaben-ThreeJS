import test from 'node:test';
import assert from 'node:assert/strict';
import { BUILDING_LOTS,isLotValid } from '../docs/world/buildings-data.js';
import { ROADS } from '../docs/world/roads-data.js';
import { WORLD } from '../docs/world/config.js';
test('buildings are deterministically generated in city blocks',()=>{assert.ok(BUILDING_LOTS.length>40);assert.equal(new Set(BUILDING_LOTS.map(x=>x.id)).size,BUILDING_LOTS.length);});
test('every building stays inside land and clear of the campus',()=>{for(const b of BUILDING_LOTS) assert.ok(isLotValid(b),JSON.stringify(b));});
test('original roads and world scale remain preserved',()=>{assert.equal(WORLD.size,3300);assert.equal(ROADS.width,210);assert.deepEqual(ROADS.verticalCenters,[-1100,-550,0,550,1100]);});
