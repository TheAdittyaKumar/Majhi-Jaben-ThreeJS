# Majhi Jaben?! — Three.js Edition · Phase 06.2: World Scale & Proportions

**This is the next update for the existing GitHub Pages project, not a separate tech demo.** It builds on Phase 06.1 (including fixed **A = left / D = right** steering). The repository still publishes from **`main` → `/docs`**, with Three.js r187 and WebGL 2.

## What changed in Phase 06.2

We used 12 game units per metre **consistently**, instead of enlarging the boat and squeezing buildings into a tiny map:

| Feature | Phase 06.1 | Phase 06.2 |
| --- | --- | --- |
| Map | 3,300 × 3,300 units ≈ 275 × 275 m | **6,000 × 6,000 units ≈ 500 × 500 m** |
| Rescue boat | 152 × 57 ≈ 12.7 × 4.75 m | **90 × 31 ≈ 7.5 × 2.6 m** |
| Main road width | 210 units ≈ 17.5 m | **180 units ≈ 15 m** |
| Road topology | 5 N–S / 5 E–W / 25 junctions | **same topology, newly spaced** |
| Typical buildings | many low 6–13 m blocks | **140 buildings, 3–9 floors** (≈9.5–31.5 m tall) |
| Water level above roads | 36 units = 3 m | **unchanged** |
| Water field | 3,600 units wide, 256² at high | **6,400 units wide, 384² at high** |
| Boat starting point | (0, -1450) | **(0, -2650)** |
| BRACU center | (0, 1378) | **(0, 2600)** |
| BRACU dock | (0, 1080) | **(0, 2220)**, on the wet shoreline |

### Technical notes

- **Boat:** The hull is scaled in X/Z, while its vertical freeboard remains unchanged. The collision geometry, foam and wave wake impulses have been scaled to match. Movement speed is also reduced from the unnaturally fast Phase 06.1 value; the boat remains intentionally arcade-like rather than a real hydraulic model.
- **Roads/buildings:** Re-spacing corridors and re-generating building lots avoids simply magnifying every structure. There are still 25 intersections. Setbacks keep balconies off roads; buildings maintain realistic floor heights and avoid overlap.
- **Water:** All heightfield impulse coordinates and caustic shader lookup coordinates use `WORLD.waterHalfExtent` / `WORLD.waterSize` rather than hardcoded map bounds. Rain drops now span the full map, and water continues past the boundary. The BRACU clearing moves with campus coordinates.
- **Camera:** Chase, first-person and inspector camera offsets are adjusted for the smaller boat and larger world.
- **Campus:** The geometry is unchanged except moving along +Z to the new site; gate, plaza, trees and drop-off all follow the new anchors.

**Scope:** Phase 06.2 fixes scale and placement. It does **not** fix the partial building reflections seen in earlier browser screenshots; that will be **Phase 06.3**. Building architectural variety, vehicles, passengers and the majhi character also remain future work.

## Update existing repository using the PATCH ZIP (recommended)

1. Download the *Phase 06.2 Patch* archive, extract it somewhere **outside** the Git project.
2. Copy its contents (`docs/`, `tests/`, `README.md`, `MIGRATION_PLAN.md`, `SCALE_NOTES.md`) **over** the matching files at the root of your already-published `Majhi-Jaben-ThreeJS` VS Code folder.
3. In VS Code Source Control, stage all changes and commit: `Phase 06.2 - Correct world and boat scale`.
4. Click **Sync Changes** / **Push**; GitHub Pages will redeploy from `/docs`.
5. Hard-refresh using **Ctrl + Shift + R** and test A/D, the boat’s first-person camera, water ripples, the full road network, and BRACU docking.

If you are unsure whether Phase 06.1 was installed, use the **full Phase 06.2 ZIP** instead; it contains all Phase 06.1 steering changes. Never create a second repository for the next phase.

## Run and test

```bash
npm test
python -m http.server 8080 --directory docs
```

Open http://localhost:8080 in a desktop browser. Note: browser networking must allow the pinned Three.js CDN import. `npm test` validates map topology, collision and static integration, **not GPU shader compilation, rendering or framerate**. Test the deployed game visually before continuing to Phase 06.3.

## Existing content retained

The complete package preserves the same **200 original audio files** with unchanged paths and bytes. No current gameplay voice trigger logic was added or changed; voice and ID-card gameplay return in later phases. The lightweight package contains only the paddle samples. Review rights to third-party clips before public release.

## Credits

GPU heightfield inspiration: Evan Wallace, [WebGL Water](https://madebyevan.com/webgl-water/). This game uses artist-directed water optics, not a full Navier–Stokes solver.
