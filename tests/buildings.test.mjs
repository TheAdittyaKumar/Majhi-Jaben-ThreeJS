import test from 'node:test';
import assert from 'node:assert/strict';
import {BUILDING_LOTS,isLotValid} from '../docs/world/buildings-data.js';
import {ROADS} from '../docs/world/roads-data.js';
import {WORLD} from '../docs/world/config.js';

test('rescaled neighborhood creates unique deterministic Dhaka lots',()=>{
  assert.ok(BUILDING_LOTS.length>=120 && BUILDING_LOTS.length<=180);
  assert.equal(new Set(BUILDING_LOTS.map(x=>x.id)).size,BUILDING_LOTS.length);
});
test('buildings do not cover roads, other buildings, or BRACU',()=>{
  for(const b of BUILDING_LOTS)assert.ok(isLotValid(b),JSON.stringify(b));
  for(let i=0;i<BUILDING_LOTS.length;i++) for(let j=i+1;j<BUILDING_LOTS.length;j++) {
    const a=BUILDING_LOTS[i],b=BUILDING_LOTS[j];
    assert.ok(Math.abs(a.x-b.x)>=(a.width+b.width)/2 || Math.abs(a.z-b.z)>=(a.depth+b.depth)/2,
      `overlapping lots ${a.id} ${b.id}`);
  }
});
test('residential heights correspond to 3–9 floors at 3.17–3.5 metres per floor',()=>{
  assert.equal(WORLD.size,6000);assert.equal(ROADS.width,180);
  for(const b of BUILDING_LOTS) {
    assert.ok(b.floors>=3 && b.floors<=9);
    assert.ok(b.floorHeight>=38 && b.floorHeight<=42);
    assert.equal(b.height,b.floors*b.floorHeight);
    assert.ok(b.width>=95 && b.width<=300);
  }
});
