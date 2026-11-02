/**
 * Phase 06.2: rescaled fictional neighborhood (500 x 500 m).
 * X east/west, Y height, Z north/south; 12 units = 1 metre.
 * Original Phase 1–6 coordinates are intentionally migrated (not retained).
 * All geometry, water UVs, cameras, collision and future missions import this data.
 */
export const WORLD = Object.freeze({
  halfExtent: 3000,
  size: 6000,
  waterMargin: 200,
  waterHalfExtent: 3200,
  waterSize: 6400,
  roadY: 0,
  waterReferenceY: 36,
  floodDepthMeters: 3,
  gameUnitsPerMeter: 12,
  playerSpawn: Object.freeze({ x: 0, y: 0, z: -2650, headingDegrees: 90 }),
  bracu: Object.freeze({ x: 0, y: 0, z: 2600, clearingRadius: 365 }),
  dropOff: Object.freeze({ x: 0, y: 0, z: 2220 }),
});

export function insidePlayableArea(x, z, margin = 0) {
  if (!Number.isFinite(x) || !Number.isFinite(z)) return false;
  const extent = WORLD.halfExtent - Math.max(0, margin);
  return extent >= 0 && Math.abs(x) <= extent && Math.abs(z) <= extent;
}

export function clampToPlayableArea(x, z, margin = 0) {
  const extent = Math.max(0, WORLD.halfExtent - Math.max(0, margin));
  return {
    x: Math.max(-extent, Math.min(extent, x)),
    z: Math.max(-extent, Math.min(extent, z)),
  };
}
