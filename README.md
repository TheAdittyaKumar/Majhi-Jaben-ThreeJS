# Majhi Jaben?! — Three.js Edition · Phase 06: Row the Rescue Boat

Phase 06 **continues directly from Phase 05**; it is not a separate demo. The main game is being reconstructed in small, testable systems for a **new GitHub Pages repository**.

## New in Phase 06

- A **player-controlled rescue boat** built entirely with Three.js `BufferGeometry`, `MeshStandardMaterial`, curved side-panels, detailed gunwales, interior wooden planking, bench seats, trim, rope fittings, bow post, and a curved pointed hull.
- Two separate animated **port/starboard paddles**, based on the original game's 0.65-second rowing rhythm.
- **W/S** forward/backward rowing; **A/D** turning, **Space** temporary speed boost; collisions with city building footprints, world boundaries and BRACU's dry interior.
- Animated **bob/pitch/roll**, and **GPU wake disturbances** injected into the existing Phase 05 heightfield (via `water.addInteraction`). Separate lightweight surface foam rings make wake movement readable; puddle-scale visual feedback still works if heightfield float textures are unavailable.
- Two chase/first-person boat camera modes; keep all original **orbit-map inspector** views and previous water/environment toggles.
- Reuse existing `docs/audio/paddle_1.mp3`, `paddle_2.mp3`, `paddle_3.mp3` for optional paddle audio. Playback begins only after keyboard interaction because browsers block unsolicited audio.

**Not restored yet:** 3D human characters, passengers/boarding, AI boats, vehicles, full missions, BRACU ID-card sequences, minimap, and final-game UI. This phase is an operable visual shell, not the complete game.

## Controls

| Control | Action |
|---|---|
| `W` or ↑ | Row forward |
| `S` or ↓ | Row backward |
| `A` / `D` or ← / → | Steer |
| `Space` while moving forward | Boost |
| `C` | Switch between chase and first-person ride cameras |
| `R` | Reset to original starting coordinates |
| Mouse drag / wheel in inspector camera | Orbit / zoom world |
| Click/tap water | Make independent manual ripple |

The **Ride boat** and **First person** buttons enter follow mode. The other camera buttons return to the original orbit inspector. The original game world coordinate system remains: X/Z horizontal, Y vertical; boat starts at **(0, -1450)** facing positive Z toward the BRACU area.

## Deploy to GitHub Pages

1. Create or open your **new** repository.
2. Upload the **contents** of the complete ZIP to the **repository root** so `docs/index.html` is directly under `/docs`.
3. In repository **Settings → Pages**, deploy from `main` branch and `/docs` folder.
4. Wait for the site to publish; open on a desktop/laptop browser with WebGL 2 enabled and working internet. The library uses a version-pinned Three.js `0.187.0` import map CDN (no build needed).

If using the lightweight package instead of full, only the three paddle audio clips are included; the full 200-file archive is in the complete package for future voice integration.

For local test with a web server, run:

```bash
python -m http.server 8080 --directory docs
```

Then open `http://localhost:8080`.

## Structure and testing

- `docs/boat/boat-data.js` — dimensions, original controls, world/building collision, and docking proximity. Independent of Three.js and testable in Node.
- `docs/boat/create-boat.js` — curved hull geometry, wooden details, dual animated oars, surface-foam pool, keyboard movement, audio, water disturbance injection.
- `docs/main.js` — Three.js scene and camera controls, keyboard state, Phase 05 water integration.
- `docs/water/` — **unchanged** Phase 05 GPU heightfield and optical rendering.
- `docs/world/` — **unchanged** Phase 01–04 world, roads, city buildings, BRACU campus.
- `docs/audio/` — preserved unchanged in the complete project (200 files).
- `tests/boat.test.mjs` — movement/heading, dock accessibility, collision boundaries, source integration, and import-map tests.

Run `npm test`. This verifies structure and collision logic but **cannot verify visually how Three.js renders**. Browser graphics and framerate still need to be checked on a deployed site. In particular, Phase 05 water shaders remain visually unverified in this environment; Phase 06 does not claim the final water appearance is production-ready.

## Water technique credit

The underlying GPU heightfield design is adapted from Evan Wallace's MIT-licensed WebGL Water project: https://madebyevan.com/webgl-water/. Boat and oar impulses use Phase 05's existing `water.addInteraction(x,z,strength,radius)` interface; they are not full fluid/rigid-body hydrodynamics.

Review licensing before publicly distributing third-party meme clips. Existing audio filenames were not renamed or altered.
