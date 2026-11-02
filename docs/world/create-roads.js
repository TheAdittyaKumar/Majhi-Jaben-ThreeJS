import * as THREE from 'three';
import { WORLD } from './config.js';
import {
  ROADS, INTERSECTIONS, VERTICAL_SEGMENTS, HORIZONTAL_SEGMENTS,
  CITY_BLOCK_X, CITY_BLOCK_Z, roadTopologySummary,
} from './roads-data.js';

/**
 * PHASE 02 — road geometry only. No buildings, campus, water, cars or people.
 * Road centerlines/widths are original-game data; paving, curbs, sidewalks and
 * zebra markings are new visual detail and intentionally non-authoritative.
 */
export function createRoadNetwork(scene) {
  const root = new THREE.Group();
  root.name = 'Phase02RoadNetwork';
  scene.add(root);

  const terrain = new THREE.Group(); terrain.name = 'ReservedCityBlocks'; root.add(terrain);
  const pavement = new THREE.Group(); pavement.name = 'RoadPavement'; root.add(pavement);
  const intersections = new THREE.Group(); intersections.name = 'Intersections25'; root.add(intersections);
  const sidewalks = new THREE.Group(); sidewalks.name = 'SidewalksAndCurbs'; root.add(sidewalks);
  const markings = new THREE.Group(); markings.name = 'RoadMarkings'; root.add(markings);

  const asphalt = new THREE.MeshStandardMaterial({
    color: 0x35424b, roughness: 0.98, metalness: 0,
  });
  const junction = new THREE.MeshStandardMaterial({
    color: 0x35424b, roughness: 0.98, metalness: 0,
  });
  const blockMaterials = [0x385c50, 0x375448, 0x425b4a, 0x3b594f].map(color =>
    new THREE.MeshStandardMaterial({ color, roughness: 1 }));
  const walkMaterial = new THREE.MeshStandardMaterial({ color: 0x8a8d83, roughness: 0.96 });
  const curbMaterial = new THREE.MeshStandardMaterial({ color: 0xbabdb2, roughness: 0.97 });
  const lineMaterial = new THREE.MeshBasicMaterial({ color: 0xf1e2ac, side: THREE.DoubleSide });
  const borderMaterial = new THREE.MeshBasicMaterial({ color: 0xc7d7d5, side: THREE.DoubleSide, transparent: true, opacity: 0.70 });
  const zebraMaterial = new THREE.MeshBasicMaterial({ color: 0xe2e8dc, side: THREE.DoubleSide, transparent: true, opacity: 0.88 });

  // Reuse simple unit geometries with InstancedMeshes to reduce draw calls.
  const plane = new THREE.PlaneGeometry(1, 1);
  plane.rotateX(-Math.PI / 2);
  const cube = new THREE.BoxGeometry(1, 1, 1);
  const dummy = new THREE.Object3D();

  function instancedRect(parent, name, material, rectangles, geometry = plane) {
    if (!rectangles.length) return null;
    const mesh = new THREE.InstancedMesh(geometry, material, rectangles.length);
    mesh.name = name;
    mesh.instanceMatrix.setUsage(THREE.StaticDrawUsage);
    mesh.frustumCulled = false; // world-wide instances are sparse; prevent incorrect culling
    for (let i = 0; i < rectangles.length; i++) {
      const [x, y, z, w, h, d] = rectangles[i];
      dummy.position.set(x, y, z);
      if (geometry === plane) dummy.scale.set(w, 1, d);
      else dummy.scale.set(w, h, d);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }

  // Mark these as RESERVED LAND, not 'buildings'. They come in Phase 03.
  for (let ix = 0; ix < CITY_BLOCK_X.length; ix++) {
    const rects = [];
    for (let iz = 0; iz < CITY_BLOCK_Z.length; iz++) {
      if ((ix * 7 + iz * 3) % blockMaterials.length !== 0) continue;
      const bx = CITY_BLOCK_X[ix], bz = CITY_BLOCK_Z[iz];
      rects.push([(bx.start + bx.end) / 2, WORLD.roadY - 0.35,
        (bz.start + bz.end) / 2, bx.end - bx.start, 0, bz.end - bz.start]);
    }
    if (rects.length) instancedRect(terrain, `CityLotTone-${ix}`, blockMaterials[0], rects);
  }
  // Fill the remaining lots using the same four coherent muted colors.
  for (let tone = 1; tone < blockMaterials.length; tone++) {
    const rects = [];
    for (let ix = 0; ix < CITY_BLOCK_X.length; ix++) for (let iz = 0; iz < CITY_BLOCK_Z.length; iz++) {
      if ((ix * 7 + iz * 3) % blockMaterials.length !== tone) continue;
      const bx = CITY_BLOCK_X[ix], bz = CITY_BLOCK_Z[iz];
      rects.push([(bx.start + bx.end) / 2, WORLD.roadY - 0.35,
        (bz.start + bz.end) / 2, bx.end - bx.start, 0, bz.end - bz.start]);
    }
    instancedRect(terrain, `CityLotTone-${tone}`, blockMaterials[tone], rects);
  }

  const roadSections = [];
  const walkwayRects = [];
  const curbRects = [];
  const edgeLines = [];

  const W = ROADS.width, half = ROADS.halfWidth;
  const walk = ROADS.sidewalkWidth;
  const curb = ROADS.curbWidth;
  const sidewalkHeight = 2.4;
  const sidewalkY = WORLD.roadY + sidewalkHeight / 2;
  const pavementY = WORLD.roadY + 0.05;
  const lineY = WORLD.roadY + 0.10;

  for (const x of ROADS.verticalCenters) {
    for (const segment of VERTICAL_SEGMENTS) {
      const center = (segment.start + segment.end) / 2;
      roadSections.push([x, pavementY, center, W, 0, segment.length]);
      for (const side of [-1, 1]) {
        walkwayRects.push([x + side * (half + walk / 2), sidewalkY, center,
          walk, sidewalkHeight, segment.length]);
        curbRects.push([x + side * (half + curb / 2), sidewalkY + .45, center,
          curb, sidewalkHeight + .9, segment.length]);
        edgeLines.push([x + side * (half - 9), lineY, center, 2.5, 0, segment.length]);
      }
    }
  }
  for (const z of ROADS.horizontalCenters) {
    for (const segment of HORIZONTAL_SEGMENTS) {
      const center = (segment.start + segment.end) / 2;
      roadSections.push([center, pavementY, z, segment.length, 0, W]);
      for (const side of [-1, 1]) {
        walkwayRects.push([center, sidewalkY, z + side * (half + walk / 2),
          segment.length, sidewalkHeight, walk]);
        curbRects.push([center, sidewalkY + .45, z + side * (half + curb / 2),
          segment.length, sidewalkHeight + .9, curb]);
        edgeLines.push([center, lineY, z + side * (half - 9), segment.length, 0, 2.5]);
      }
    }
  }
  instancedRect(pavement, '60RoadSections', asphalt, roadSections);
  instancedRect(sidewalks, 'SidewalkSlabs', walkMaterial, walkwayRects, cube);
  instancedRect(sidewalks, 'RaisedCurbstones', curbMaterial, curbRects, cube);
  instancedRect(markings, 'RoadEdgePaint', borderMaterial, edgeLines);
  instancedRect(intersections, '25Junctions', junction,
    INTERSECTIONS.map(({ x, z }) => [x, pavementY, z, W, 0, W]));

  // Fill four inner sidewalk corners at every intersection, outside road area.
  const corners = [];
  const cornerCurbs = [];
  for (const { x, z } of INTERSECTIONS) for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    corners.push([x + sx * (half + walk / 2), sidewalkY,
      z + sz * (half + walk / 2), walk, sidewalkHeight, walk]);
    cornerCurbs.push([x + sx * (half + curb / 2), sidewalkY + .45,
      z + sz * (half + walk / 2), curb, sidewalkHeight + .9, walk]);
    cornerCurbs.push([x + sx * (half + walk / 2), sidewalkY + .45,
      z + sz * (half + curb / 2), walk, sidewalkHeight + .9, curb]);
  }
  instancedRect(sidewalks, 'JunctionSidewalkCorners', walkMaterial, corners, cube);
  instancedRect(sidewalks, 'JunctionCornerCurbs', curbMaterial, cornerCurbs, cube);

  // Honor the original game's 44-unit dash / 170-unit period, suppressing
  // dashes that could overlap junctions. Crosswalks are new Phase 02 detail.
  const dashRects = [];
  const first = ROADS.centerDashStart;
  for (const x of ROADS.verticalCenters) for (const segment of VERTICAL_SEGMENTS) {
    for (let p = first; p <= WORLD.halfExtent; p += ROADS.centerDashPeriod) {
      if (p < segment.start + 16 || p + ROADS.centerDashLength > segment.end - 16) continue;
      dashRects.push([x, lineY + .01, p + ROADS.centerDashLength / 2,
        5.5, 0, ROADS.centerDashLength]);
    }
  }
  for (const z of ROADS.horizontalCenters) for (const segment of HORIZONTAL_SEGMENTS) {
    for (let p = first; p <= WORLD.halfExtent; p += ROADS.centerDashPeriod) {
      if (p < segment.start + 16 || p + ROADS.centerDashLength > segment.end - 16) continue;
      dashRects.push([p + ROADS.centerDashLength / 2, lineY + .01, z,
        ROADS.centerDashLength, 0, 5.5]);
    }
  }
  instancedRect(markings, 'OriginalCadenceCenterDashes', lineMaterial, dashRects);

  // One marked pedestrian crossing just outside every approach to a junction.
  // 4 approaches x 25 junctions = 100 zebra crossings. These are not missions.
  const zebraRects = [];
  const crossingDepth = 42, crossingGap = 3.5, stripeLength = 6.5;
  const insideWidth = ROADS.width - 34;
  const stripeCount = 7;
  for (const { x, z } of INTERSECTIONS) {
    for (const side of [-1, 1]) {
      const crossZ = z + side * (half + 38);
      const crossX = x + side * (half + 38);
      // Zebra stripes run across the roadway width.
      for (let i = 0; i < stripeCount; i++) {
        const offset = (i - (stripeCount - 1) / 2) * (stripeLength + crossingGap);
        zebraRects.push([x, lineY + .025, crossZ + offset,
          insideWidth, 0, stripeLength]);
        zebraRects.push([crossX + offset, lineY + .025, z,
          stripeLength, 0, insideWidth]);
      }
    }
  }
  const zebra = instancedRect(markings, 'PedestrianCrossings', zebraMaterial, zebraRects);

  return {
    root, terrain, pavement, sidewalks, intersections, markings,
    summary: roadTopologySummary(),
    setRoadMarkingsVisible(visible) { markings.visible = Boolean(visible); },
    setSidewalksVisible(visible) { sidewalks.visible = Boolean(visible); },
    setCrosswalksVisible(visible) { if (zebra) zebra.visible = Boolean(visible); },
  };
}
