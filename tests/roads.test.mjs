import test from 'node:test';
import assert from 'node:assert/strict';
import { WORLD } from '../docs/world/config.js';
import {
  ROADS, INTERSECTIONS, VERTICAL_SEGMENTS, HORIZONTAL_SEGMENTS,
  CITY_BLOCK_X, CITY_BLOCK_Z, pointRoadClassification, isOnRoad, roadTopologySummary,
} from '../docs/world/roads-data.js';

test('5×5 road topology is preserved but centers are re-spaced', () => {
  assert.deepEqual(ROADS.verticalCenters, [-2000, -1000, 0, 1000, 2000]);
  assert.deepEqual(ROADS.horizontalCenters, [-2050, -1050, -50, 950, 1950]);
  assert.equal(ROADS.width, 180);
  assert.equal(ROADS.halfWidth, 90);
  assert.equal(INTERSECTIONS.length, 25);
  assert.equal(roadTopologySummary().uninterruptedSections, 60);
  assert.equal(roadTopologySummary().blocks, 36);
});

test('road segments and intersections stay inside the new 6000×6000 city', () => {
  for (const sections of [VERTICAL_SEGMENTS, HORIZONTAL_SEGMENTS]) {
    assert.equal(sections.length, 6);
    assert.equal(sections[0].start, -WORLD.halfExtent);
    assert.equal(sections.at(-1).end, WORLD.halfExtent);
    for (const part of sections) assert.ok(part.end > part.start);
    for (let i = 1; i < sections.length; i++) assert.ok(sections[i - 1].end < sections[i].start);
  }
  for (const {x,z} of INTERSECTIONS) assert.equal(pointRoadClassification(x,z),'intersection');
});

test('street classification respects the new road half-width', () => {
  assert.equal(pointRoadClassification(0,-2650), 'road');
  assert.equal(pointRoadClassification(0,2220), 'road');
  assert.equal(pointRoadClassification(0,-50), 'intersection');
  assert.equal(pointRoadClassification(90,-2650), 'road');
  assert.equal(pointRoadClassification(90.01,-2650), 'block');
  assert.equal(pointRoadClassification(460,-460), 'block');
  assert.equal(pointRoadClassification(-3001,0), 'outside');
  assert.equal(pointRoadClassification(NaN,0), 'outside');
  assert.equal(isOnRoad(-2000,950), true);
  assert.equal(isOnRoad(-2700,-2700), false);
});

test('6×6 city blocks are between corridors and within the playable extent', () => {
  for (const axis of [CITY_BLOCK_X, CITY_BLOCK_Z]) {
    assert.equal(axis.length, 6);
    assert.equal(axis[0].start, -WORLD.halfExtent);
    assert.equal(axis.at(-1).end, WORLD.halfExtent);
    for (const range of axis) assert.ok(range.end > range.start);
  }
  for(const location of [WORLD.playerSpawn, WORLD.dropOff]) assert.ok(isOnRoad(location.x,location.z));
});
