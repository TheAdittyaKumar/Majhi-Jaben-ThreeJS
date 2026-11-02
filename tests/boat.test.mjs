import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import { WORLD } from '../docs/world/config.js';
import { BOAT, headingVector, boatFitsWorld, approachStep, steeringInput } from '../docs/boat/boat-data.js';

const read = path => readFileSync(new URL(path, new URL('../docs/', import.meta.url)), 'utf8');
test('boat keeps the heading and waterline but has proportionate 7.5m dimensions',()=>{
 assert.deepEqual(BOAT.spawn,{x:0,z:-2650});
 assert.equal(BOAT.initialHeading,90);
 assert.equal(BOAT.waterlineY,36);
 assert.equal(BOAT.rowingCycleSeconds,.65);
 assert.equal(BOAT.turnRateDegrees,102);
 assert.equal(BOAT.length,90);
 assert.equal(BOAT.width,31);
 assert.ok(BOAT.length/WORLD.gameUnitsPerMeter<8);
});
test('heading 90 degrees moves toward BRACU (+Z), not sideways',()=>{
 const north=headingVector(90);
 assert.ok(Math.abs(north.x)<1e-10);
 assert.ok(north.z>.999);
 const east=headingVector(0);
 assert.ok(east.x>.999);
 assert.ok(Math.abs(east.z)<1e-10);
});
test('spawn is navigable, map edge and buildings block the boat',()=>{
 assert.ok(boatFitsWorld(BOAT.spawn.x,BOAT.spawn.z,90));
 assert.equal(boatFitsWorld(3020,0,90),false);
 assert.equal(boatFitsWorld(0,WORLD.bracu.z,90),false);
 assert.equal(boatFitsWorld(Number.NaN,0,90),false);
});
test('original BRACU drop-off remains reachable by boat, plaza interior blocked',()=>{
 assert.ok(boatFitsWorld(WORLD.dropOff.x,WORLD.dropOff.z,90));
 assert.equal(boatFitsWorld(0,WORLD.bracu.z,90),false);
});
test('collision step advances along source heading and rejects invalid destinations',()=>{
 const progress=approachStep(0,-2650,90,10);
 assert.ok(Math.abs(progress.z+2640)<1e-10);
 assert.ok(!progress.blocked);
 const stop=approachStep(0,-2650,90,9000);
 assert.ok(stop.blocked);
 assert.equal(stop.z,-2650);
});
test('boat meshes, oars, wakes and controls have separate modules',()=>{
 const create=read('boat/create-boat.js');
 assert.match(create,/CylinderGeometry/);
 assert.match(create,/curvedBand/);
 assert.match(create,/hull.scale.set\(\.54,1,\.59\)/);
 assert.match(create,/StarboardOar/);
 assert.match(create,/PortOar/);
 assert.match(create,/water\.addInteraction/);
 assert.match(create,/BOAT\.rowingCycleSeconds/);
 assert.match(create,/\baudio\/\$\{name\}/);
 assert.ok(statSync(new URL('../docs/audio/paddle_1.mp3',import.meta.url)).isFile());
});
test('Three.js route maintains inspector and chase/first-person camera controls',()=>{
 const main=read('main.js'),html=read('index.html');
 assert.match(main,/createPlayerBoat/);
 assert.match(main,/syncBoatCamera/);
 assert.match(main,/boat\.update\(delta,keys\)/);
 assert.match(html,/data-view="boat"/);
 assert.match(html,/data-view="firstperson"/);
 assert.match(html,/toggle-wakes/);
 assert.match(html,/three@0\.187\.0/);
});

test('steering keys match the boat-facing view: A left, D right',()=>{
 assert.equal(steeringInput(new Set(['a'])),-1);
 assert.equal(steeringInput(new Set(['arrowleft'])),-1);
 assert.equal(steeringInput(new Set(['d'])),1);
 assert.equal(steeringInput(new Set(['arrowright'])),1);
 assert.equal(steeringInput(new Set(['a','d'])),0);
 assert.equal(steeringInput(new Set()),0);
 // From heading 90° toward +Z, the chase camera's screen-right axis is -X.
 // D turns the bow toward -X while A turns it toward +X.
 const dHeading=headingVector(90+BOAT.turnRateDegrees*.1);
 const aHeading=headingVector(90-BOAT.turnRateDegrees*.1);
 assert.ok(dHeading.x<0, 'D should rotate bow to screen right (-X)');
 assert.ok(aHeading.x>0, 'A should rotate bow to screen left (+X)');
 const updated=read('boat/create-boat.js');
 assert.match(updated,/const steering=steeringInput\(keys\)/);
});
