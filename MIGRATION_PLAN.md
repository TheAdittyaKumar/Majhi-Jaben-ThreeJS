# Majhi Jaben?! Three.js — migration phases

- [x] Phase 01 — original world size and anchors
- [x] Phase 02 — original roads, lanes and intersections
- [x] Phase 03 — Dhaka-style buildings and rooftop details
- [x] Phase 04 — BRAC University and entry / drop-off
- [x] Phase 05 — GPU heightfield floodwater, optical shading and rain interaction
- [x] Phase 06 — player rescue boat, paddles, W/S/A/D motion, water wake and boat cameras
- [ ] Phase 07 — boat operator / majhi character, rowing animation, first-person arms (without passengers)
- [ ] Phase 08 — other vehicles (rickshaw/CNG/cars), traffic and environment props
- [ ] Phase 09 — passenger characters, rescue missions, minimap and voice dialogue
- [ ] Phase 10 — campus ID check, scoring, UI, events, polish and integration

Each new phase should preserve working code, use source-game coordinates, and be tested independently. Phase 05 and later visual quality needs a real browser review after deployment; structural tests alone do not prove WebGL shader or 3D model correctness.
