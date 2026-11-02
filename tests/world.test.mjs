import test from 'node:test';
import assert from 'node:assert/strict';
import { WORLD, insidePlayableArea, clampToPlayableArea } from '../docs/world/config.js';

test('playable boundaries match the original game', () => {
  assert.equal(WORLD.size, 3300);
  assert.equal(WORLD.halfExtent, 1650);
  assert.equal(WORLD.size, 2 * WORLD.halfExtent);
  assert.equal(insidePlayableArea(-1650, 1650), true);
  assert.equal(insidePlayableArea(1650.01, 0), false);
});

test('the original waterline and anchor points are retained', () => {
  assert.equal(WORLD.waterReferenceY, WORLD.floodDepthMeters * WORLD.gameUnitsPerMeter);
  assert.deepEqual([WORLD.playerSpawn.x, WORLD.playerSpawn.z], [0, -1450]);
  assert.deepEqual([WORLD.bracu.x, WORLD.bracu.z], [0, 1378]);
  assert.deepEqual([WORLD.dropOff.x, WORLD.dropOff.z], [0, 1080]);
  for (const place of [WORLD.playerSpawn, WORLD.bracu, WORLD.dropOff]) {
    assert.equal(insidePlayableArea(place.x, place.z), true);
  }
});

test('future player movement can be clamped inside boundaries', () => {
  assert.deepEqual(clampToPlayableArea(-1700, 1750), { x: -1650, z: 1650 });
  assert.deepEqual(clampToPlayableArea(1620, 0, 50), { x: 1600, z: 0 });
  assert.equal(insidePlayableArea(Infinity, 0), false);
});
