import test from 'node:test';
import assert from 'node:assert/strict';
import { WORLD, insidePlayableArea, clampToPlayableArea } from '../docs/world/config.js';

test('new fictional city covers 500 metres, at a consistent 12 game-units per metre', () => {
  assert.equal(WORLD.size, 6000);
  assert.equal(WORLD.halfExtent, 3000);
  assert.equal(WORLD.gameUnitsPerMeter, 12);
  assert.equal(WORLD.size/WORLD.gameUnitsPerMeter, 500);
  assert.equal(WORLD.waterSize, WORLD.size + 2 * WORLD.waterMargin);
  assert.equal(WORLD.waterSize, 2 * WORLD.waterHalfExtent);
  assert.equal(insidePlayableArea(-3000, 3000), true);
  assert.equal(insidePlayableArea(3000.01, 0), false);
});

test('water depth remains 3 metres, all mission anchors are migrated together', () => {
  assert.equal(WORLD.waterReferenceY, WORLD.floodDepthMeters * WORLD.gameUnitsPerMeter);
  assert.deepEqual([WORLD.playerSpawn.x, WORLD.playerSpawn.z], [0, -2650]);
  assert.deepEqual([WORLD.bracu.x, WORLD.bracu.z], [0, 2600]);
  assert.deepEqual([WORLD.dropOff.x, WORLD.dropOff.z], [0, 2220]);
  for (const place of [WORLD.playerSpawn, WORLD.bracu, WORLD.dropOff]) {
    assert.equal(insidePlayableArea(place.x, place.z), true);
  }
});

test('new city boundaries clamp player movement to the new outer map', () => {
  assert.deepEqual(clampToPlayableArea(-3400, 3750), { x: -3000, z: 3000 });
  assert.deepEqual(clampToPlayableArea(2980, 0, 50), { x: 2950, z: 0 });
  assert.equal(insidePlayableArea(Infinity, 0), false);
});
