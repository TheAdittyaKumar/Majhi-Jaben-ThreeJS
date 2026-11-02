import * as THREE from 'three';
import { WORLD } from '../world/config.js';
import { HeightfieldSimulation } from './simulation.js';

const surfaceVertex = `
 precision highp float;
 varying vec2 vSimUV;
 varying vec3 vWorld;
 varying vec4 vReflection;
 varying float vWave;
 uniform sampler2D uHeightfield;
 uniform mat4 uReflectionMatrix;
 uniform float uTime;
 uniform float uWaveScale;
 float smallWaves(vec2 p){
  return sin(p.x*.014+uTime*.58)*cos(p.y*.019-uTime*.69)*.70+
         sin(p.x*.031-p.y*.018+uTime*.8)*.32;
 }
 void main(){
  vSimUV=uv;
  float h=texture2D(uHeightfield,uv).r*uWaveScale;
  float small=smallWaves(vec2(position.x,-position.y));
  vec3 position3=position;
  // PlaneGeometry XY, rotated into XZ by the mesh: local +Z means world +Y.
  position3.z=h+small;
  vWave=h+small;
  vec4 wp=modelMatrix*vec4(position3,1.0);
  vWorld=wp.xyz;
  vReflection=uReflectionMatrix*wp;
  gl_Position=projectionMatrix*viewMatrix*wp;
 }
`;

const surfaceFragment = `
 precision highp float;
 varying vec2 vSimUV;
 varying vec3 vWorld;
 varying vec4 vReflection;
 varying float vWave;
 uniform sampler2D uHeightfield;
 uniform sampler2D uReflection;
 uniform sampler2D uRefraction;
 uniform sampler2D uSceneDepth;
 uniform vec2 uResolution;
 uniform vec3 uEye;
 uniform float uTime;
 uniform float uWaveScale;
 uniform float uNear;
 uniform float uFar;
 uniform float uRain;
 uniform float uReflectionStrength;
 uniform float uWaveContrast;
 uniform vec2 uCampus;
 uniform float uCampusRadius;
 const float PI=3.141592653589793;
 float linearDepth(float depth){
  return uNear*uFar/(uFar-depth*(uFar-uNear));
 }
 vec3 atmosphericSky(vec3 d){
  float h=clamp(d.y*.5+.5,0.0,1.0);
  return mix(vec3(.12,.22,.26),vec3(.44,.58,.60),h);
 }
 float noise12(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453123);}
 void main(){
  float clearingDistance=length(vWorld.xz-uCampus);
  float wetness=smoothstep(uCampusRadius-85.0,uCampusRadius+5.0,clearingDistance);
  if(wetness<.005)discard;
  vec2 texel=vec2(1.0/uSimSize);
  float hL=texture2D(uHeightfield,vSimUV-vec2(texel.x,0.0)).r;
  float hR=texture2D(uHeightfield,vSimUV+vec2(texel.x,0.0)).r;
  float hT=texture2D(uHeightfield,vSimUV+vec2(0.0,texel.y)).r;
  float hB=texture2D(uHeightfield,vSimUV-vec2(0.0,texel.y)).r;
  vec2 slope=vec2((hL-hR)*uWaveScale,(hT-hB)*uWaveScale)*uWaveContrast/13.0;
  vec2 p=vWorld.xz;
  float t=uTime;
  // Layered short-range undulations ride on the numerical heightfield.
  slope+=vec2(sin(p.x*.021+t*.79),cos(p.y*.024-t*.67))*.049;
  slope+=vec2(cos(p.x*.063+p.y*.03+t*1.4),sin(p.y*.067-p.x*.024-t*1.23))*.017;
  // Dappled high-frequency rain micro-normal: avoids an unnaturally glassy plane.
  vec2 rainCell=floor((p+vec2(t*3.0,t*-2.0))*.085);
  float rainNoise=noise12(rainCell);
  vec2 rainRipple=vec2(sin(p.x*.17+t*3.5+rainNoise*6.28),cos(p.y*.18-t*3.1+rainNoise*6.28));
  slope+=rainRipple*.011*uRain;
  vec3 N=normalize(vec3(slope.x,1.0,slope.y));
  vec3 V=normalize(uEye-vWorld);
  float viewUp=max(dot(N,V),0.001);
  float fresnel=.0204+(1.0-.0204)*pow(1.0-viewUp,5.0);
  // A little extra reflection at medium grazing angles reads well in an overcast city.
  fresnel=clamp(fresnel*.99+.08*pow(1.0-viewUp,2.0),0.02,.97);

  vec2 screenUV=gl_FragCoord.xy/uResolution;
  vec2 refractionUV=clamp(screenUV+slope*.023,vec2(.001),vec2(.999));
  float depthBehind=texture2D(uSceneDepth,screenUV).r;
  float thickness=clamp(linearDepth(depthBehind)-linearDepth(gl_FragCoord.z),0.0,140.0);
  // The depth of roughly 36 game units is deliberately readable through the flood.
  float absorption=1.0-exp(-thickness*.017);
  vec3 transmitted=texture2D(uRefraction,refractionUV).rgb;
  vec3 submergedTint=vec3(.045,.225,.265);
  transmitted=mix(transmitted,submergedTint,clamp(absorption*.78,.0,.87));
  // Refractive sparkle/ripples only where they catch an appropriate angle.
  float rippleLight=clamp(dot(N,normalize(vec3(-.4,1.0,-.23))),0.0,1.0);
  transmitted+=vec3(.015,.035,.034)*pow(rippleLight,16.0);

  vec2 reflectionUV=vReflection.xy/max(vReflection.w,0.001);
  reflectionUV=clamp(reflectionUV+slope*.065,vec2(.002),vec2(.998));
  vec3 reflected=texture2D(uReflection,reflectionUV).rgb;
  vec3 skyFallback=atmosphericSky(reflect(-V,N));
  float valid=step(0.0,vReflection.w)*step(.0,vReflection.x/vReflection.w)*step(vReflection.x/vReflection.w,1.0)*step(.0,vReflection.y/vReflection.w)*step(vReflection.y/vReflection.w,1.0);
  reflected=mix(skyFallback,reflected,valid);
  vec3 reflectedLight=mix(atmosphericSky(reflect(-V,N)),reflected,uReflectionStrength);
  vec3 waterColor=mix(transmitted,reflectedLight,fresnel);

  vec3 L=normalize(vec3(-.34,.87,-.37));
  vec3 H=normalize(V+L);
  float glint=pow(max(dot(N,H),0.0),320.0)*(.40+uRain*.15);
  // Fine white caplets around rapid slopes, not a uniform opaque white overlay.
  float turbulent=clamp(abs(hL+hR+hT+hB-4.0*texture2D(uHeightfield,vSimUV).r)*2.3,0.0,1.0);
  float foam=smoothstep(.26,.90,turbulent)*.22;
  // Soft edge at BRACU's dry island; physically-inspired foam at the retreating waterline.
  float shore=smoothstep(uCampusRadius-55.0,uCampusRadius-27.0,clearingDistance)*(1.0-smoothstep(uCampusRadius+17.0,uCampusRadius+58.0,clearingDistance));
  foam+=shore*.13*wetness;
  waterColor+=vec3(.56,.76,.76)*glint;
  waterColor=mix(waterColor,vec3(.44,.64,.63),clamp(foam,0.0,.30));
  // Very slight warm sunlight on the BRACU edge, not a glowing blue swimming pool.
  float sunIsland=1.0-smoothstep(uCampusRadius+30.0,uCampusRadius+300.0,clearingDistance);
  waterColor+=vec3(.060,.054,.026)*sunIsland*(.35+fresnel);
  gl_FragColor=vec4(waterColor,wetness*.975);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
 }
`;
// Shader injection keeps GLSL source readable and avoids a generated duplicate file.
const waterFragment=surfaceFragment.replace(
  'uniform float uWaveContrast;',
  `uniform float uWaveContrast;
 uniform float uSimSize;
 uniform float uWaterHalfExtent;
 uniform float uWaterSize;`
);

const causticVertex = `
 varying vec2 vUv;
 varying vec3 vWorld;
 void main(){vUv=uv;vec4 p=modelMatrix*vec4(position,1.0);vWorld=p.xyz;gl_Position=projectionMatrix*viewMatrix*p;}
`;
const causticFragment = `
 precision highp float;
 varying vec2 vUv;
 varying vec3 vWorld;
 uniform sampler2D uHeightfield;
 uniform float uSimSize;
 uniform float uWaterHalfExtent;
 uniform float uWaterSize;
 uniform float uTime;
 uniform float uStrength;
 uniform vec2 uCampus;
 uniform float uCampusRadius;
 void main(){
  float dry=1.0-smoothstep(uCampusRadius-90.0,uCampusRadius+40.0,length(vWorld.xz-uCampus));
  if(dry>.995)discard;
  vec2 uv=vec2((vWorld.x+uWaterHalfExtent)/uWaterSize,(uWaterHalfExtent-vWorld.z)/uWaterSize);
  vec2 d=vec2(1.0/uSimSize);
  float h=texture2D(uHeightfield,uv).r;
  float hX=(texture2D(uHeightfield,uv+d*vec2(1,0)).r+texture2D(uHeightfield,uv-d*vec2(1,0)).r-2.0*h);
  float hY=(texture2D(uHeightfield,uv+d*vec2(0,1)).r+texture2D(uHeightfield,uv-d*vec2(0,1)).r-2.0*h);
  // Curvature approximates focusing of refracted rays on the submerged road.
  float focus=clamp(1.0/(.47+abs(1.0-(hX+hY)*12.0)),0.0,2.0);
  float streak=pow(max(0.0,sin(vWorld.x*.075+sin(vWorld.z*.032+uTime*.68)*4.0)*sin(vWorld.z*.084+sin(vWorld.x*.027-uTime*.48)*3.0)),12.0);
  float intensity=(streak*.36+pow(max(0.0,focus-.45),2.0)*.095)*uStrength;
  gl_FragColor=vec4(vec3(.24,.63,.61)*intensity,(1.0-dry)*.31);
 }
`;

export function createWater(scene, renderer, camera, opts={}){
 const state={quality:opts.quality||'high',paused:false,visible:true,rain:true,reflections:true};
 const qualitySpec={high:{sim:384,mesh:200,render:.60},medium:{sim:256,mesh:152,render:.42},low:{sim:128,mesh:96,render:.30}};
 const q=qualitySpec[state.quality]||qualitySpec.high;
 const sim=new HeightfieldSimulation(renderer,q.sim);
 // Thin water plane at the exact source-game flood elevation.
 const uniforms={
  uHeightfield:{value:sim.texture},uReflection:{value:null},uRefraction:{value:null},uSceneDepth:{value:null},
  uResolution:{value:new THREE.Vector2(1,1)},uEye:{value:new THREE.Vector3()},uReflectionMatrix:{value:new THREE.Matrix4()},
  uTime:{value:0},uWaveScale:{value:2.2},uNear:{value:camera.near},uFar:{value:camera.far},
  uRain:{value:1},uReflectionStrength:{value:.93},uWaveContrast:{value:4.0},uSimSize:{value:q.sim},
  uCampus:{value:new THREE.Vector2(WORLD.bracu.x,WORLD.bracu.z)},uCampusRadius:{value:WORLD.bracu.clearingRadius},
  uWaterHalfExtent:{value:WORLD.waterHalfExtent},uWaterSize:{value:WORLD.waterSize}
 };
 const waterMaterial=new THREE.ShaderMaterial({
  uniforms,vertexShader:surfaceVertex,fragmentShader:waterFragment,
  transparent:true,depthWrite:false,side:THREE.DoubleSide,polygonOffset:false,
 });
 const plane=new THREE.Mesh(new THREE.PlaneGeometry(WORLD.waterSize,WORLD.waterSize,q.mesh,q.mesh),waterMaterial);
 plane.rotation.x=-Math.PI/2;plane.position.y=WORLD.waterReferenceY;
 plane.name='Phase05HeightfieldReflectiveFloodwater';
 plane.frustumCulled=false; // wave deformation can extend beyond geometry bounds
 plane.renderOrder=15;
 scene.add(plane);
 const causticMaterial=new THREE.ShaderMaterial({vertexShader:causticVertex,fragmentShader:causticFragment,
  uniforms:{uHeightfield:{value:sim.texture},uSimSize:{value:q.sim},uTime:{value:0},uStrength:{value:1.0},uCampus:{value:uniforms.uCampus.value},uCampusRadius:{value:WORLD.bracu.clearingRadius},
    uWaterHalfExtent:{value:WORLD.waterHalfExtent},uWaterSize:{value:WORLD.waterSize}},
  transparent:true,depthWrite:false,depthTest:true,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,
 });
 const caustic=new THREE.Mesh(new THREE.PlaneGeometry(WORLD.size,WORLD.size),causticMaterial);
 caustic.name='SubmergedFloorCaustics';caustic.rotation.x=-Math.PI/2;caustic.position.y=WORLD.roadY+1.15;
 caustic.renderOrder=8;
 scene.add(caustic);
 const sceneCapture=new THREE.WebGLRenderTarget(1,1,{depthBuffer:true,stencilBuffer:false});
 sceneCapture.depthTexture=new THREE.DepthTexture(1,1,THREE.UnsignedIntType);
 sceneCapture.texture.colorSpace=THREE.SRGBColorSpace;
 const reflectionCapture=new THREE.WebGLRenderTarget(1,1,{depthBuffer:true,stencilBuffer:false});
 reflectionCapture.texture.colorSpace=THREE.SRGBColorSpace;
 uniforms.uRefraction.value=sceneCapture.texture;uniforms.uSceneDepth.value=sceneCapture.depthTexture;
 uniforms.uReflection.value=reflectionCapture.texture;
 const mirrorCamera=camera.clone();
 const mirrorPosition=new THREE.Vector3(),mirrorTarget=new THREE.Vector3(),mirrorUp=new THREE.Vector3();
 const reflectionMatrix=uniforms.uReflectionMatrix.value;
 const bias=new THREE.Matrix4().set(.5,0,0,.5, 0,.5,0,.5, 0,0,.5,.5, 0,0,0,1);
 const clippingPlane=new THREE.Plane(new THREE.Vector3(0,1,0),-WORLD.waterReferenceY+1.0);
 let waveTime=0,rainSeed=8113,accumulator=0;
 function random(){rainSeed=(Math.imul(rainSeed,1664525)+1013904223)>>>0;return rainSeed/4294967296;}
 function resize(width,height,pixelRatio){
  const scale=q.render;
  const x=Math.max(1,Math.floor(width*pixelRatio)),y=Math.max(1,Math.floor(height*pixelRatio));
  sceneCapture.setSize(x,y);
  reflectionCapture.setSize(Math.max(1,Math.floor(x*scale)),Math.max(1,Math.floor(y*scale)));
  uniforms.uResolution.value.set(x,y);
  sceneCapture.depthTexture.image.width=x;sceneCapture.depthTexture.image.height=y;
 }
 function update(delta){
  if(state.paused)return;
  const dt=Math.min(delta,.066);
  waveTime+=dt;
  uniforms.uTime.value=waveTime;
  causticMaterial.uniforms.uTime.value=waveTime;
  if(!sim.gpu)return;
  accumulator=Math.min(.08,accumulator+dt);
  // Two 60Hz substeps max to keep mobile/large scenes responsive.
  let passes=0;
  while(accumulator>=1/60&&passes<2){
   if(state.rain){
    for(let i=0;i<3;i++){
     const x=(random()*2-1)*(WORLD.halfExtent-50),z=(random()*2-1)*(WORLD.halfExtent-50);
     const nearCampus=Math.hypot(x-WORLD.bracu.x,z-WORLD.bracu.z)<WORLD.bracu.clearingRadius;
     if(!nearCampus)sim.addDrop(x,z,22+random()*34,(random()-.35)*.34);
    }
   }
   sim.step();accumulator-=1/60;passes++;
  }
  uniforms.uHeightfield.value=sim.texture;
  causticMaterial.uniforms.uHeightfield.value=sim.texture;
 }
 function capture(rendererToUse,activeCamera){
  if(!state.visible)return;
  const originalTarget=rendererToUse.getRenderTarget();
  const originalClips=rendererToUse.clippingPlanes;
  const originalXR=rendererToUse.xr.enabled;
  const originalShadow=rendererToUse.shadowMap.autoUpdate;
  plane.visible=false;
  uniforms.uEye.value.copy(activeCamera.position);
  try{
   rendererToUse.xr.enabled=false;
   rendererToUse.shadowMap.autoUpdate=false;
   // Background render: submerged streets, windows and caustics become refracted scene color.
   rendererToUse.setRenderTarget(sceneCapture);
   rendererToUse.render(scene,activeCamera);
   if(state.reflections&&activeCamera.position.y>WORLD.waterReferenceY+2){
    mirrorPosition.copy(activeCamera.position);mirrorPosition.y=2*WORLD.waterReferenceY-mirrorPosition.y;
    mirrorTarget.set(0,WORLD.waterReferenceY,0).add(activeCamera.getWorldDirection(new THREE.Vector3()).multiplyScalar(1000));
    mirrorTarget.y=2*WORLD.waterReferenceY-mirrorTarget.y;
    mirrorUp.copy(activeCamera.up);mirrorUp.y*=-1;
    mirrorCamera.position.copy(mirrorPosition);mirrorCamera.up.copy(mirrorUp);
    mirrorCamera.lookAt(mirrorTarget);
    mirrorCamera.projectionMatrix.copy(activeCamera.projectionMatrix);
    mirrorCamera.projectionMatrixInverse.copy(activeCamera.projectionMatrixInverse);
    mirrorCamera.updateMatrixWorld(true);
    reflectionMatrix.copy(bias).multiply(mirrorCamera.projectionMatrix).multiply(mirrorCamera.matrixWorldInverse);
    rendererToUse.clippingPlanes=[clippingPlane];
    caustic.visible=false; // Never mirror caustics from below the water surface.
    rendererToUse.setRenderTarget(reflectionCapture);
    rendererToUse.render(scene,mirrorCamera);
    caustic.visible=true;
    rendererToUse.clippingPlanes=originalClips;
   }
  }finally{
   rendererToUse.setRenderTarget(originalTarget);
   rendererToUse.clippingPlanes=originalClips;
   rendererToUse.xr.enabled=originalXR;
   rendererToUse.shadowMap.autoUpdate=originalShadow;
   plane.visible=true;
   caustic.visible=state.visible;
  }
 }
 function addInteraction(x,z,strength=.5,radius=40){sim.addDrop(x,z,radius,strength);}
 function setRain(v){state.rain=v;uniforms.uRain.value=v?1:0;}
 function setReflections(v){state.reflections=v;uniforms.uReflectionStrength.value=v?.93:0;}
 function setVisible(v){state.visible=v;plane.visible=v;caustic.visible=v;}
 // Remove color-space transfer mismatch only if Three's renderer cannot compile shader.
 return {state,plane,caustic,sim,resize,update,capture,addInteraction,setRain,setReflections,setVisible,
  setPaused(v){state.paused=v;},
  get summary(){return `GPU ${sim.gpu?'heightfield '+q.sim+'²':'analytic-wave fallback'} · Fresnel + reflection/refraction · caustic floor`;},
  dispose(){plane.geometry.dispose();waterMaterial.dispose();caustic.geometry.dispose();causticMaterial.dispose();sim.dispose();sceneCapture.dispose();reflectionCapture.dispose();},
 };
}
