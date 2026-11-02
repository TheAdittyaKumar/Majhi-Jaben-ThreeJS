import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { WORLD } from './world/config.js';
import { ROADS, pointRoadClassification } from './world/roads-data.js';
import { createWorldReference } from './world/create-world.js';
import { createRoadNetwork } from './world/create-roads.js';
import { createBuildings } from './world/create-buildings.js';
import { createCampus } from './world/create-campus.js';
import { createWater } from './water/create-water.js';
import { createPlayerBoat } from './boat/create-boat.js';
import { BOAT, headingVector } from './boat/boat-data.js';

const canvas = document.querySelector('#world');
const status = document.querySelector('#status');
const hud = document.querySelector('#coordinate-readout');
const failure = document.querySelector('#failure');
const guidesCheckbox = document.querySelector('#toggle-guides');
const markingsCheckbox = document.querySelector('#toggle-markings');
const sidewalksCheckbox = document.querySelector('#toggle-sidewalks');
const crossingsCheckbox = document.querySelector('#toggle-crossings');
const buildingsCheckbox = document.querySelector('#toggle-buildings');
const campusCheckbox = document.querySelector('#toggle-campus');
const waterCheckbox = document.querySelector('#toggle-water');
const rainCheckbox = document.querySelector('#toggle-rain');
const reflectionsCheckbox = document.querySelector('#toggle-reflections');
const pausedCheckbox = document.querySelector('#toggle-pause');
const waterSummary = document.querySelector('#water-summary');
const summaryElement = document.querySelector('#road-summary');
const boatReadout = document.querySelector('#boat-readout');
const boatCheckbox = document.querySelector('#toggle-boat');
const wakeCheckbox = document.querySelector('#toggle-wakes');
const boatSoundCheckbox = document.querySelector('#toggle-paddle-audio');
const resetBoatButton = document.querySelector('#reset-boat');
const boatStatus = document.querySelector('#boat-summary');

function fail(message) {
  failure.hidden = false;
  failure.textContent = message;
  status.textContent = 'Renderer unavailable';
}

let renderer;
try {
  const gl2 = canvas.getContext('webgl2', { antialias: true, alpha: false, depth: true });
  if (!gl2) throw new Error('A browser/device with WebGL 2 support is required.');
  renderer = new THREE.WebGLRenderer({ canvas, context: gl2, antialias: true });
} catch (error) {
  fail(`Unable to start Three.js: ${error.message}`);
  throw error;
}
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.25;
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x8ba6b1);
scene.fog = new THREE.FogExp2(0x8ba6b1, 0.00012);
const camera = new THREE.PerspectiveCamera(58, 1, 2, 18000);
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.07;
controls.minDistance = 35;
controls.maxDistance = 11000;
controls.maxPolarAngle = Math.PI / 2 - 0.018;
controls.target.set(0, 0, 0);

// Neutral overcast preview lighting. Real storm/time-of-day logic comes later.
scene.add(new THREE.HemisphereLight(0xd4e3df, 0x405044, 2.5));
const directional = new THREE.DirectionalLight(0xe6ece3, 2.1);
directional.position.set(-500, 1800, -650);
scene.add(directional);

const world = createWorldReference(scene);
const roads = createRoadNetwork(scene);
const buildings = createBuildings(scene);
const campus = createCampus(scene);
const water = createWater(scene, renderer, camera);
waterSummary.textContent = water.summary;
const boat=createPlayerBoat(scene,water);
boatStatus.textContent=boat.summary;
boatCheckbox.addEventListener('change',()=>boat.setVisible(boatCheckbox.checked));
wakeCheckbox.addEventListener('change',()=>boat.setWakes(wakeCheckbox.checked));
boatSoundCheckbox.addEventListener('change',()=>boat.setSounds(boatSoundCheckbox.checked));
resetBoatButton.addEventListener('click',()=>{boat.reset();if(cameraMode==='boat'||cameraMode==='first')syncBoatCamera(1);});
waterCheckbox.addEventListener('change', () => water.setVisible(waterCheckbox.checked));
rainCheckbox.addEventListener('change', () => water.setRain(rainCheckbox.checked));
reflectionsCheckbox.addEventListener('change', () => water.setReflections(reflectionsCheckbox.checked));
pausedCheckbox.addEventListener('change', () => water.setPaused(pausedCheckbox.checked));
campusCheckbox.addEventListener('change',()=>campus.setVisible(campusCheckbox.checked));
buildingsCheckbox.addEventListener('change',()=>buildings.setVisible(buildingsCheckbox.checked));
world.setGuidesVisible(false);
summaryElement.textContent =
  `${roads.summary.verticalRoads} north–south roads · ${roads.summary.horizontalRoads} east–west roads · ${roads.summary.intersections} intersections · ${ROADS.width} units wide · ${buildings.count} buildings · BRACU campus`;

let cameraMode='boat';
const keys=new Set();
const ignoredTags=new Set(['INPUT','TEXTAREA','SELECT']);
window.addEventListener('keydown',e=>{
  if(ignoredTags.has(document.activeElement?.tagName))return;
  const k=e.key.toLowerCase();
  if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright',' '].includes(k)){
    e.preventDefault(); keys.add(k);
  }
  if(k==='c'&&!e.repeat){cameraMode=cameraMode==='first'?'boat':'first';controls.enabled=false;syncBoatCamera(1);}
  if(k==='r'&&!e.repeat){boat.reset();syncBoatCamera(1);}
});
window.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));
window.addEventListener('blur',()=>keys.clear());
document.addEventListener('visibilitychange',()=>{if(document.hidden)keys.clear();});
const cameraAim=new THREE.Vector3();
function syncBoatCamera(alpha=.12){
  const p=boat.state,heading=headingVector(p.angle),first=cameraMode==='first';
  const x=p.x,z=p.z,level=WORLD.waterReferenceY;
  const dest=first?new THREE.Vector3(x-heading.x*12,level+21,z-heading.z*12):
    new THREE.Vector3(x-heading.x*126-heading.z*16,level+75,z-heading.z*126+heading.x*16);
  const focus=first?new THREE.Vector3(x+heading.x*108,level+16,z+heading.z*108):
    new THREE.Vector3(x+heading.x*36,level+6,z+heading.z*36);
  camera.position.lerp(dest,alpha);
  cameraAim.lerp(focus,alpha);
  camera.up.set(0,1,0);
  camera.lookAt(cameraAim);
  controls.target.copy(cameraAim);
}
function setView(name) {
  cameraMode=name==='boat'?'boat':name==='firstperson'?'first':'inspector';
  controls.enabled=cameraMode==='inspector';
  if(!controls.enabled){syncBoatCamera(1);return;}
  const target = new THREE.Vector3(0, 0, 0);
  camera.up.set(0, 1, 0);
  if (name === 'water') {
    target.set(-120, WORLD.waterReferenceY, WORLD.playerSpawn.z+900);
    camera.position.set(380, 205, WORLD.playerSpawn.z+340);
  } else if (name === 'spawn') {
    target.set(WORLD.playerSpawn.x, 0, WORLD.playerSpawn.z);
    camera.position.set(WORLD.playerSpawn.x+400, 430, WORLD.playerSpawn.z-480);
  } else if (name === 'bracu') {
    target.set(WORLD.bracu.x, 0, WORLD.bracu.z);
    camera.position.set(WORLD.bracu.x+510, 505, WORLD.bracu.z+460);
  } else if (name === 'top') {
    // +Z at the top of the screen; matches the source map north orientation.
    camera.up.set(0, 0, 1);
    camera.position.set(0, WORLD.size*1.4, 0.1);
  } else if (name === 'intersection') {
    target.set(0, 0, ROADS.horizontalCenters[2]);
    camera.position.set(450, 345, ROADS.horizontalCenters[2]-440);
  } else {
    camera.position.set(WORLD.size*.83, WORLD.size*.89, -WORLD.size*.96);
  }
  camera.lookAt(target);
  controls.target.copy(target);
  controls.update();
}
for (const button of document.querySelectorAll('[data-view]')) {
  button.addEventListener('click', () => setView(button.dataset.view));
}

guidesCheckbox.addEventListener('change', () =>
  world.setGuidesVisible(guidesCheckbox.checked));
markingsCheckbox.addEventListener('change', () =>
  roads.setRoadMarkingsVisible(markingsCheckbox.checked));
sidewalksCheckbox.addEventListener('change', () =>
  roads.setSidewalksVisible(sidewalksCheckbox.checked));
crossingsCheckbox.addEventListener('change', () =>
  roads.setCrosswalksVisible(crossingsCheckbox.checked));

// Raycast against horizontal world plane for a non-intrusive map inspector.
const pointer = new THREE.Vector2();
const raycaster = new THREE.Raycaster();
const horizontal = new THREE.Plane(new THREE.Vector3(0, 1, 0), -WORLD.roadY);
const waterPlaneForPicking = new THREE.Plane(new THREE.Vector3(0, 1, 0), -WORLD.waterReferenceY);
let downPoint = null;
canvas.addEventListener('pointerdown', event => { downPoint = {x:event.clientX,y:event.clientY}; });
canvas.addEventListener('pointerup', event => {
  if(!downPoint || Math.hypot(event.clientX-downPoint.x,event.clientY-downPoint.y)>8){downPoint=null;return;}
  downPoint=null;
  const r=canvas.getBoundingClientRect();
  pointer.set(((event.clientX-r.left)/r.width)*2-1,-((event.clientY-r.top)/r.height)*2+1);
  raycaster.setFromCamera(pointer,camera);
  if(raycaster.ray.intersectPlane(waterPlaneForPicking,worldPoint)){
    water.addInteraction(worldPoint.x,worldPoint.z,.85,85);
  }
});
const worldPoint = new THREE.Vector3();
const coordinateInfo = document.querySelector('#pointer-readout');
let lastPointer = null;
canvas.addEventListener('pointermove', (event) => {
  const rect = canvas.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / Math.max(1, rect.width)) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / Math.max(1, rect.height)) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  if (raycaster.ray.intersectPlane(horizontal, worldPoint)) {
    lastPointer = { x: worldPoint.x, z: worldPoint.z };
    coordinateInfo.textContent = `Pointer: (${Math.round(lastPointer.x)}, ${Math.round(lastPointer.z)}) · ${pointRoadClassification(lastPointer.x, lastPointer.z)}`;
  }
});
canvas.addEventListener('pointerleave', () => {
  lastPointer = null;
  coordinateInfo.textContent = 'Hover the map to inspect coordinates';
});

function resize() {
  const width = Math.max(1, canvas.clientWidth), height = Math.max(1, canvas.clientHeight);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height, false);
  water.resize(width,height,renderer.getPixelRatio());
}
window.addEventListener('resize', resize);
canvas.addEventListener('webglcontextlost', (event) => {
  event.preventDefault();
  fail('WebGL context lost. Reload the page to continue.');
});

setView('boat');
resize();
status.textContent = `WebGL 2 · Three.js r${THREE.REVISION} · ${water.sim.gpu?'GPU water':'water fallback'} · rowable rescue boat + ${buildings.count} buildings`;
let lastFrame = performance.now();
function animate(now = performance.now()) {
  requestAnimationFrame(animate);
  const delta = Math.min((now - lastFrame)/1000, 0.066);
  lastFrame = now;
  if(cameraMode==='inspector')controls.update();
  boat.update(delta,keys);
  if(cameraMode==='boat'||cameraMode==='first')syncBoatCamera(Math.min(1,delta*8));
  water.update(delta);
  water.capture(renderer,camera);
  renderer.render(scene, camera);
  const t = controls.target;
  hud.textContent = cameraMode==='inspector' ?
    `Camera focus: X ${Math.round(t.x)} · Z ${Math.round(t.z)} · Map ${WORLD.size} × ${WORLD.size}`:
    `Boat: X ${Math.round(boat.state.x)} · Z ${Math.round(boat.state.z)} · Heading ${Math.round(boat.state.angle)}°`;
  boatReadout.textContent=`${Math.abs(boat.state.speed/BOAT.forwardSpeed*100).toFixed(0)}% speed · ${boat.state.blocked?'Obstacle ahead':boat.state.boost?'BOOST':boat.state.rowing?'ROWING':'Floating'} · ${cameraMode==='first'?'First-person':cameraMode==='boat'?'Chase camera':'Map inspector'}`;
}
animate();
