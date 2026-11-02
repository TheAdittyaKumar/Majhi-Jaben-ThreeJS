# Phase 06.2 coordinate contract (for all subsequent features)

All map coordinates are **X east/west, Z north/south, Y vertical**. The camera/boat heading **90° means +Z toward BRACU**. **12 Three.js units = 1 metre** for both land and boat measurements.

| Item | New authoritative values | Source |
| --- | --- | --- |
| Playable map | X and Z: −3000 to +3000 | `docs/world/config.js` |
| Water mesh | X and Z: −3200 to +3200 | `WORLD.waterHalfExtent / WORLD.waterSize` |
| Road level | Y = 0 | `WORLD.roadY` |
| Water surface | Y = 36 ≈ 3 m depth | `WORLD.waterReferenceY` |
| Boat spawn | (X=0, Z=−2650), heading=90° | `WORLD.playerSpawn` |
| BRACU campus center | (X=0, Z=2600) | `WORLD.bracu` |
| BRACU gate | (X=0, Z=2372) | `CAMPUS.gate` |
| Boat drop-off | (X=0, Z=2220) | `WORLD.dropOff` |
| Campus water-clearing radius | 365 units (≈30 m) | `WORLD.bracu.clearingRadius` |
| Boat dimensions | 90×31 units ≈ 7.5×2.6 m | `BOAT` |
| Roads | X: -2000, -1000, 0, 1000, 2000; Z: -2050, -1050, -50, 950, 1950 | `ROADS` |
| Main roadway width | 180 units = 15 metres | `ROADS.width` |

## Important implementation invariants

1. Geometry, collisions, camera anchors and future minimap markers must use the **same** `WORLD`, `ROADS`, `CAMPUS`, `BOAT` data modules.
2. GPU water heightfield coordinates and boat wake impulses must map world coordinates to the shared 6400-unit water domain. The surface shader uses the mesh's original UVs; caustics calculate UVs from world X/Z. No legacy `(x+1800)/3600` maps.
3. Gameplay should not import any old Phase 06 world coordinate constants; this is a **deliberate map migration**. Reintroduce passengers and missions using new map-space positions during Phase 09.
4. The published audio filenames, relative paths and contents are unchanged.
5. The more detailed reflection fixes (mirror-camera clipping and UV artifacts) are explicitly deferred to Phase 06.3. Static tests cannot confirm that water optics render correctly.
