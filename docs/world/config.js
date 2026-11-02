/**
 * Phase 01: original game coordinates preserved from custom WebGL game.js.
 * Coordinate system: X east/west, Y height, Z north/south (same as old game).
 * NO scene geometry in this file. Later systems must import these constants.
 */
export const WORLD = Object.freeze({
  halfExtent: 1650,
  size: 3300,
  roadY: 0,
  waterReferenceY: 36,
  floodDepthMeters: 3,
  gameUnitsPerMeter: 12,
  playerSpawn: Object.freeze({ x: 0, y: 0, z: -1450, headingDegrees: 90 }),
  bracu: Object.freeze({ x: 0, y: 0, z: 1378, clearingRadius: 365 }),
  dropOff: Object.freeze({ x: 0, y: 0, z: 1080 }),
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
