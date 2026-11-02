import * as THREE from 'three';
import { WORLD } from '../world/config.js';

/**
 * Inspired by Evan Wallace's MIT-licensed GPU heightfield approach:
 * height and vertical velocity are stored in RG channels of ping-pong targets;
 * each step pulls velocity toward the average of four neighboring heights.
 * Implementation is original Three.js ShaderMaterial code (not his LightGL renderer).
 */
const vertex = `
 varying vec2 vUv;
 void main(){vUv=uv;gl_Position=vec4(position.xy,0.0,1.0);}
`;
const advanceFragment = `
 precision highp float;
 varying vec2 vUv;
 uniform sampler2D uPrevious;
 uniform vec2 uTexel;
 uniform vec4 uDrops[6];
 uniform float uDropCount;
 uniform float uWaveDamping;
 void main(){
  vec4 previous=texture2D(uPrevious,vUv);
  vec2 dx=vec2(uTexel.x,0.0), dy=vec2(0.0,uTexel.y);
  float average=(texture2D(uPrevious,clamp(vUv+dx,0.0,1.0)).r+
    texture2D(uPrevious,clamp(vUv-dx,0.0,1.0)).r+
    texture2D(uPrevious,clamp(vUv+dy,0.0,1.0)).r+
    texture2D(uPrevious,clamp(vUv-dy,0.0,1.0)).r)*0.25;
  float velocity=(previous.g+(average-previous.r)*1.78)*uWaveDamping;
  float height=previous.r+velocity;
  for(int i=0;i<6;i++){
    if(float(i)>=uDropCount)break;
    vec4 d=uDrops[i];
    float distanceToDrop=length((vUv-d.xy)/max(0.0001,d.z));
    float smoothBump=max(0.0,1.0-distanceToDrop);
    float cosine=0.5-0.5*cos(smoothBump*3.14159265359);
    height+=cosine*d.w;
  }
  height=clamp(height,-5.0,5.0);
  velocity=clamp(velocity,-2.0,2.0);
  gl_FragColor=vec4(height,velocity,0.0,1.0);
 }
`;

export class HeightfieldSimulation {
 constructor(renderer, size=256){
  this.renderer=renderer;
  this.size=size;
  const gl=renderer.getContext();
  this.gpu=Boolean(gl.getExtension('EXT_color_buffer_float'));
  this.drops=[];
  this.steps=0;
  this.camera=new THREE.OrthographicCamera(-1,1,1,-1,0,1);
  this.scene=new THREE.Scene();
  this.uniforms={uPrevious:{value:null},uTexel:{value:new THREE.Vector2(1/size,1/size)},uDrops:{value:Array.from({length:6},()=>new THREE.Vector4(-10,-10,.01,0))},uDropCount:{value:0},uWaveDamping:{value:.994}};
  const material=new THREE.ShaderMaterial({vertexShader:vertex,fragmentShader:advanceFragment,uniforms:this.uniforms,depthTest:false,depthWrite:false});
  this.quad=new THREE.Mesh(new THREE.PlaneGeometry(2,2),material);
  this.quad.frustumCulled=false;
  this.scene.add(this.quad);
  this.fallbackData=new Float32Array(size*size*4);
  for(let i=3;i<this.fallbackData.length;i+=4)this.fallbackData[i]=1;
  this.fallback=new THREE.DataTexture(this.fallbackData,size,size,THREE.RGBAFormat,THREE.FloatType);
  this.fallback.needsUpdate=true;
  this.fallback.magFilter=THREE.LinearFilter;
  this.fallback.minFilter=THREE.LinearFilter;
  this.fallback.wrapS=this.fallback.wrapT=THREE.ClampToEdgeWrapping;
  if(this.gpu){
   const opts={format:THREE.RGBAFormat,type:THREE.HalfFloatType,minFilter:THREE.LinearFilter,magFilter:THREE.LinearFilter,wrapS:THREE.ClampToEdgeWrapping,wrapT:THREE.ClampToEdgeWrapping,depthBuffer:false,stencilBuffer:false};
   this.a=new THREE.WebGLRenderTarget(size,size,opts);
   this.b=new THREE.WebGLRenderTarget(size,size,opts);
   this.a.texture.generateMipmaps=false;
   this.b.texture.generateMipmaps=false;
   const original=renderer.getRenderTarget();
   const oldColor=renderer.getClearColor(new THREE.Color()).clone();
   const oldAlpha=renderer.getClearAlpha();
   renderer.setRenderTarget(this.a);renderer.setClearColor(0x000000,0);renderer.clear();
   renderer.setRenderTarget(this.b);renderer.clear();
   renderer.setRenderTarget(original);
   renderer.setClearColor(oldColor,oldAlpha);
  }
 }
 get texture(){return this.gpu?this.a.texture:this.fallback;}
 addDrop(x,z,radius,strength){
  if(!this.gpu)return;
  const u=(x+WORLD.waterHalfExtent)/WORLD.waterSize, v=(WORLD.waterHalfExtent-z)/WORLD.waterSize;
  if(u<0||u>1||v<0||v>1)return;
  // Bound queued impulses if the simulation is paused while the player moves.
  if(this.drops.length>=24)this.drops.shift();
  this.drops.push(new THREE.Vector4(u,v,radius/WORLD.waterSize,strength));
 }
 step(){
  if(!this.gpu)return;
  const renderer=this.renderer;
  this.uniforms.uPrevious.value=this.a.texture;
  const drops=this.drops.splice(0,6);
  this.uniforms.uDropCount.value=drops.length;
  for(let i=0;i<6;i++)this.uniforms.uDrops.value[i].copy(drops[i]??new THREE.Vector4(-10,-10,.01,0));
  const previousTarget=renderer.getRenderTarget();
  const previousClear=renderer.getClearColor(new THREE.Color()).clone();
  const previousAlpha=renderer.getClearAlpha();
  renderer.setRenderTarget(this.b);
  renderer.render(this.scene,this.camera);
  renderer.setRenderTarget(previousTarget);
  renderer.setClearColor(previousClear,previousAlpha);
  [this.a,this.b]=[this.b,this.a];
  this.steps++;
 }
 dispose(){this.a?.dispose();this.b?.dispose();this.fallback.dispose();this.quad.geometry.dispose();this.quad.material.dispose();}
}
