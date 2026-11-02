import test from 'node:test';
import assert from 'node:assert/strict';
import { WORLD } from '../docs/world/config.js';
import {
  ROADS, INTERSECTIONS, VERTICAL_SEGMENTS, HORIZONTAL_SEGMENTS,
  CITY_BLOCK_X, CITY_BLOCK_Z, pointRoadClassification, isOnRoad, roadTopologySummary,
} from '../docs/world/roads-data.js';

test('original five-by-five source road grid preserved exactly', () => {
  assert.deepEqual(ROADS.verticalCenters, [-1100, -550, 0, 550, 1100]);
  assert.deepEqual(ROADS.horizontalCenters, [-1150, -600, -50, 500, 1050]);
  assert.equal(ROADS.width, 210);
  assert.equal(ROADS.halfWidth, 105);
  assert.equal(INTERSECTIONS.length, 25);
  assert.equal(roadTopologySummary().uninterruptedSections, 60);
  assert.equal(roadTopologySummary().blocks, 36);
});

test('roads and intersections do not exceed 3300 x 3300 map', () => {
  for (const sections of [VERTICAL_SEGMENTS, HORIZONTAL_SEGMENTS]) {
    assert.equal(sections.length, 6);
    assert.equal(sections[0].start, -WORLD.halfExtent);
    assert.equal(sections.at(-1).end, WORLD.halfExtent);
    for (const part of sections) assert.ok(part.end > part.start);
    for (let i = 1; i < sections.length; i++) assert.ok(sections[i - 1].end < sections[i].start);
  }
  for (const { x, z } of INTERSECTIONS) {
    assert.equal(pointRoadClassification(x,z), 'intersection');
  }
});

test('road classification correctly handles road edges, campus and outside', () => {
  assert.equal(pointRoadClassification(0,-1450), 'road');
  assert.equal(pointRoadClassification(0,1080), 'intersection');
  assert.equal(pointRoadClassification(0,1378), 'road');
  assert.equal(pointRoadClassification(0,-50), 'intersection');
  assert.equal(pointRoadClassification(105,-1450), 'road');
  assert.equal(pointRoadClassification(105.01,-1450), 'block');
  assert.equal(pointRoadClassification(275,-875), 'block');
  assert.equal(pointRoadClassification(-1651,0), 'outside');
  assert.equal(pointRoadClassification(NaN,0), 'outside');
  assert.equal(isOnRoad(-1100,500), true);
  assert.equal(isOnRoad(-1375,-1375), false);
});

test('36 block ranges fill the gaps between the original road corridors', () => {
  for (const axis of [CITY_BLOCK_X, CITY_BLOCK_Z]) {
    assert.equal(axis.length, 6);
    assert.equal(axis[0].start, -WORLD.halfExtent);
    assert.equal(axis.at(-1).end, WORLD.halfExtent);
    for (const range of axis) assert.ok(range.end > range.start);
  }
});

test('phase-2 road placement retains mission and start alignment', () => {
  for (const location of [WORLD.playerSpawn, WORLD.dropOff]) {
    assert.equal(isOnRoad(location.x,location.z),true);
  }
  assert.ok(ROADS.horizontalCenters.every(v=>Number.isInteger(v)));
});
