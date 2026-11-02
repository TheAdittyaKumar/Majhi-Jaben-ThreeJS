import * as THREE from 'three';
import { WORLD } from './config.js';

function label(text, color = '#f3f9f4') {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 90;
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, c.width, c.height);
  ctx.font = 'bold 34px system-ui, sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.lineWidth = 5; ctx.strokeStyle = '#071521';
  ctx.strokeText(text, c.width / 2, c.height / 2);
  ctx.fillStyle = color;
  ctx.fillText(text, c.width / 2, c.height / 2);
  const texture = new THREE.CanvasTexture(c);
  texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, depthTest: false }));
  sprite.scale.set(460, 81, 1);
  return sprite;
}

function circularGuide(x, z, radius, color, segments = 128) {
  const points = [];
  for (let i = 0; i < segments; i++) {
    const t = i * Math.PI * 2 / segments;
    points.push(new THREE.Vector3(x + radius * Math.cos(t), WORLD.roadY + 2, z + radius * Math.sin(t)));
  }
  return new THREE.LineLoop(
    new THREE.BufferGeometry().setFromPoints(points),
    new THREE.LineBasicMaterial({ color })
  );
}

export function createWorldReference(scene) {
  const root = new THREE.Group();
  root.name = 'Phase01WorldReferenceOnly';
  scene.add(root);

  // Temporary ground reference, NOT a finished road or floodwater surface.
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(WORLD.size, WORLD.size),
    new THREE.MeshBasicMaterial({ color: 0x173343, side: THREE.DoubleSide })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = WORLD.roadY - 1;
  ground.name = 'TemporaryGroundReference';
  root.add(ground);

  const guides = new THREE.Group();
  guides.name = 'TemporaryCoordinateGuides';
  root.add(guides);

  const grid = new THREE.GridHelper(WORLD.size, 30, 0x7aabb7, 0x355564);
  grid.position.y = WORLD.roadY + 0.5;
  grid.material.transparent = true;
  grid.material.opacity = 0.55;
  guides.add(grid);

  // The boundary itself is the playable boundary; don't confuse it with
  // the old outer water mesh, which extended slightly beyond the map.
  const h = WORLD.halfExtent;
  const outline = new THREE.LineLoop(
    new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-h, 3, -h),
      new THREE.Vector3(h, 3, -h),
      new THREE.Vector3(h, 3, h),
      new THREE.Vector3(-h, 3, h),
    ]),
    new THREE.LineBasicMaterial({ color: 0xe3bc79 })
  );
  outline.name = `PlayableBoundary${WORLD.size}x${WORLD.size}`;
  guides.add(outline);

  function marker(name, coordinates, tint, ringSize, subtitle = '') {
    const x = coordinates.x, z = coordinates.z;
    const group = new THREE.Group();
    group.name = name;
    group.position.set(x, 0, z);
    const pin = new THREE.Mesh(
      new THREE.CylinderGeometry(9, 9, 24, 12),
      new THREE.MeshBasicMaterial({ color: tint })
    );
    pin.position.y = 15;
    group.add(pin);
    group.add(circularGuide(0, 0, ringSize, tint));
    const tag = label(subtitle || name);
    tag.position.y = 90;
    group.add(tag);
    guides.add(group);
  }

  marker('PlayerSpawn', WORLD.playerSpawn, 0xffb86a, 45, 'PLAYER START');
  marker('BracuCenter', WORLD.bracu, 0xdceaa0, 38, 'BRACU CENTER');
  marker('BracuDropOff', WORLD.dropOff, 0x71d8bb, 45, 'BRACU DROP-OFF');
  const circle = circularGuide(WORLD.bracu.x, WORLD.bracu.z, WORLD.bracu.clearingRadius, 0x91c48e);
  circle.name = 'CampusClearingRadiusReference';
  guides.add(circle);

  for (const [x, z] of [[-h,-h],[h,-h],[-h,h],[h,h]]) {
    const corner = label(`(${x}, ${z})`, '#d5c8aa');
    corner.position.set(x, 85, z);
    corner.scale.set(310, 55, 1);
    guides.add(corner);
  }

  return {
    root,
    guides,
    ground,
    setGuidesVisible(visible) { guides.visible = visible; },
  };
}
