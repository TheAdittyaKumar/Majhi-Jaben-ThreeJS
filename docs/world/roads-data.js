/**
 * Phase 06.2 · Re-spaced original 5×5 road topology over a 500m neighborhood.
 * Road centers and roadway width were intentionally redesigned for scale.
 * Three.js uses X/Z for the map and Y for height.
 *
 * This file deliberately imports no Three.js or browser APIs so gameplay,
 * collision, pathfinding, minimaps, and Node tests can reuse the same data.
 */
import { WORLD } from './config.js';

export const ROADS = Object.freeze({
  verticalCenters: Object.freeze([-2000, -1000, 0, 1000, 2000]),
  horizontalCenters: Object.freeze([-2050, -1050, -50, 950, 1950]),
  width: 180,
  halfWidth: 90,
  sidewalkWidth: 26,
  curbWidth: 5,
  centerDashLength: 34,
  centerDashPeriod: 155,
  centerDashStart: -WORLD.halfExtent + 95,
});

function intervalSegments(centers) {
  const result = [];
  let cursor = -WORLD.halfExtent;
  for (const center of centers) {
    const end = center - ROADS.halfWidth;
    if (end > cursor) result.push(Object.freeze({ start: cursor, end, length: end - cursor }));
    cursor = center + ROADS.halfWidth;
  }
  if (cursor < WORLD.halfExtent) {
    result.push(Object.freeze({ start: cursor, end: WORLD.halfExtent, length: WORLD.halfExtent - cursor }));
  }
  return Object.freeze(result);
}

// Each vertical road is split into six uninterrupted sections between junctions.
// Likewise for horizontal roads, so asphalt meshes never overlap at crossings.
export const VERTICAL_SEGMENTS = intervalSegments(ROADS.horizontalCenters);
export const HORIZONTAL_SEGMENTS = intervalSegments(ROADS.verticalCenters);

export const INTERSECTIONS = Object.freeze(
  ROADS.verticalCenters.flatMap((x) =>
    ROADS.horizontalCenters.map((z) => Object.freeze({ x, z }))
  )
);

export function pointRoadClassification(x, z) {
  if (![x, z].every(Number.isFinite) ||
      Math.abs(x) > WORLD.halfExtent || Math.abs(z) > WORLD.halfExtent) {
    return 'outside';
  }
  const v = ROADS.verticalCenters.some((cx) => Math.abs(x - cx) <= ROADS.halfWidth);
  const h = ROADS.horizontalCenters.some((cz) => Math.abs(z - cz) <= ROADS.halfWidth);
  return v && h ? 'intersection' : v || h ? 'road' : 'block';
}

export function isOnRoad(x, z) {
  const type = pointRoadClassification(x, z);
  return type === 'road' || type === 'intersection';
}

/** City-block ranges from the rescaled corridors; no longer the original source positions. */
export function getCityBlockRanges(centers) {
  const ranges = [];
  let cursor = -WORLD.halfExtent;
  for (const center of centers) {
    ranges.push(Object.freeze({ start: cursor, end: center - ROADS.halfWidth }));
    cursor = center + ROADS.halfWidth;
  }
  ranges.push(Object.freeze({ start: cursor, end: WORLD.halfExtent }));
  return Object.freeze(ranges);
}

export const CITY_BLOCK_X = getCityBlockRanges(ROADS.verticalCenters);
export const CITY_BLOCK_Z = getCityBlockRanges(ROADS.horizontalCenters);

export function roadTopologySummary() {
  return Object.freeze({
    verticalRoads: ROADS.verticalCenters.length,
    horizontalRoads: ROADS.horizontalCenters.length,
    intersections: INTERSECTIONS.length,
    uninterruptedSections: ROADS.verticalCenters.length * VERTICAL_SEGMENTS.length +
      ROADS.horizontalCenters.length * HORIZONTAL_SEGMENTS.length,
    blocks: CITY_BLOCK_X.length * CITY_BLOCK_Z.length,
    width: ROADS.width,
  });
}
