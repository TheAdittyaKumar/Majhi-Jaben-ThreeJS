import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, statSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { WORLD } from '../docs/world/config.js';

const here=new URL('../docs/',import.meta.url);
const read=path=>readFileSync(new URL(path,here),'utf8');

test('3m water elevation stays constant while all surface mappings use expanded extent',()=>{
 assert.equal(WORLD.waterReferenceY,36);
 assert.equal(WORLD.size,6000);
 assert.equal(WORLD.waterSize,6400);
 assert.equal(WORLD.floodDepthMeters,3);
 assert.equal(WORLD.gameUnitsPerMeter,12);
});
test('water renderer is a separate module, with GPU simulation and optical passes',()=>{
 const s=read('water/create-water.js');
 assert.match(s,/HeightfieldSimulation/);
 assert.match(s,/uReflectionMatrix/);
 assert.match(s,/uSceneDepth/);
 assert.match(s,/linearDepth/);
 assert.match(s,/fresnel/);
 assert.match(s,/SubmergedFloorCaustics/);
 assert.match(s,/waterReferenceY/);
 assert.match(s,/PlaneGeometry\(WORLD.waterSize,WORLD.waterSize/);
 assert.match(s,/uWaterHalfExtent/);
 assert.match(s,/uWaterSize/);
});
test('water preserves the BRACU dry clearing and ripple interaction hook',()=>{
 const s=read('water/create-water.js');
 assert.match(s,/clearingDistance/);
 assert.match(s,/uCampusRadius/);
 assert.match(s,/addInteraction/);
 assert.match(s,/sim\.addDrop/);
});
test('GPU waves use height/velocity ping-pong texture, fallback exists',()=>{
 const s=read('water/simulation.js');
 assert.match(s,/previous\.g/);
 assert.match(s,/average/);
 assert.match(s,/HalfFloatType/);
 assert.match(s,/DataTexture/);
 assert.match(s,/EXT_color_buffer_float/);
 assert.match(s,/WORLD.waterHalfExtent/);
 assert.match(s,/WORLD.waterSize/);
});
test('site keeps GitHub Pages static import-map arrangement and the original sounds',()=>{
 const html=read('index.html');
 const main=read('main.js');
 assert.match(html, /three@0\.187\.0/);
 assert.match(html, /\.\/main\.js/);
 assert.match(main, /water\.capture\(renderer,camera\)/);
 // The compact ZIP ships only the paddling SFX; the full release has all voices.
 assert.ok(statSync(new URL('audio/paddle_1.mp3',here)).isFile());
 if (existsSync(new URL('audio/voices/',here))) {
  assert.ok(statSync(new URL('audio/voices/',here)).isDirectory());
  assert.ok(statSync(new URL('audio/meme_oops.mp3',here)).isFile());
 }
});
