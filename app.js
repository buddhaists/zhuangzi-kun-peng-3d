/**
 * 《莊子‧逍遙遊》「北冥有魚」— Three.js & WebGL Custom Shader Murmuration Engine
 *
 * Recreates the surreal coastal/open-field documentary aesthetic of 85,000 birds
 * forming the colossal Kun (巨鯤) and transforming into the Peng (大鵬) whose wings
 * sweep across the overcast sky like hanging clouds (垂天之雲).
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// ============================================================================
// Five Narrative Acts of 《莊子‧逍遙遊》
// ============================================================================
const NARRATIVE_STAGES = [
  {
    id: 0,
    shortTitle: '壹 · 北冥潛鯤',
    verse: '北冥有魚，其名爲鯤。',
    caption: '遠海觀景涼亭外，八萬五千隻飛鳥於冷冽灰藍天幕中凝聚成巨鯤之形，貼近海平線深沉游動。',
    tRange: [0.0, 0.2],
    targetT: 0.08,
    camPos: new THREE.Vector3(6.0, -10.5, 92.0),
    camLookAt: new THREE.Vector3(-4.0, 1.5, 0.0)
  },
  {
    id: 1,
    shortTitle: '貳 · 幾千里也',
    verse: '鯤之大，不知其幾千里也。',
    caption: '長焦視角推進，巨鯤修長的身軀橫貫天際，內部鳥群如海流般翻湧，尾鰭流線延展不知幾千里。',
    tRange: [0.2, 0.4],
    targetT: 0.30,
    camPos: new THREE.Vector3(-12.0, -7.5, 76.0),
    camLookAt: new THREE.Vector3(-12.0, 2.5, 0.0)
  },
  {
    id: 2,
    shortTitle: '叁 · 化而爲鳥',
    verse: '化而爲鳥，其名爲鵬。',
    caption: '氣流劇烈渦旋，魚腹與尾鰭的數萬飛鳥在空中翻騰重組，向兩側猛然舒展為遮天巨翼。',
    tRange: [0.4, 0.6],
    targetT: 0.50,
    camPos: new THREE.Vector3(14.0, -9.5, 86.0),
    camLookAt: new THREE.Vector3(-2.0, 4.0, 0.0)
  },
  {
    id: 3,
    shortTitle: '肆 · 鵬之背',
    verse: '鵬之背，不知其幾千里也；',
    caption: '鏡頭橫移至曠野電線桿與鳥巢下方，仰望大鵬厚重寬廣的脊背與左翼尖刺破蒼穹，與電線上渺小停棲的鳥群形成震撼對比。',
    tRange: [0.6, 0.8],
    targetT: 0.72,
    camPos: new THREE.Vector3(28.0, -11.2, 88.0),
    camLookAt: new THREE.Vector3(6.0, 5.5, 0.0)
  },
  {
    id: 4,
    shortTitle: '伍 · 垂天之雲',
    verse: '怒而飛，其翼若垂天之雲。',
    caption: '大鵬乘風怒飛，長達千里的巨翼在狂風中層層疊疊，尾羽與翼緣化作漫天流散的墨雲，與北冥天際融為一體。',
    tRange: [0.8, 1.0],
    targetT: 0.92,
    camPos: new THREE.Vector3(32.0, -11.8, 94.0),
    camLookAt: new THREE.Vector3(8.0, 6.2, 0.0)
  }
];

const CAMERA_PRESETS = {
  pavilion: {
    pos: new THREE.Vector3(4.0, -10.8, 92.0),
    target: new THREE.Vector3(-3.0, 1.2, 0.0)
  },
  telephoto: {
    pos: new THREE.Vector3(-18.0, -5.0, 64.0),
    target: new THREE.Vector3(-19.0, 2.2, 0.0)
  },
  poles: {
    pos: new THREE.Vector3(30.0, -11.5, 90.0),
    target: new THREE.Vector3(7.0, 5.2, 0.0)
  }
};

// ============================================================================
// Global State
// ============================================================================
const TOTAL_BIRDS = 85000;

const state = {
  timeline: 0.04,         // 0.0 (Kun) -> 1.0 (Peng / Hanging Clouds)
  targetTimeline: null,   // If user clicked a stage tab, smoothly scrub towards it
  isPlaying: true,
  playSpeed: 0.022,       // Full 5-act cycle in ~45 seconds
  turbulence: 1.0,
  densityRatio: 1.0,
  windSpeed: 1.0,
  cameraMode: 'narrative', // 'narrative' | 'pavilion' | 'telephoto' | 'poles' | 'free'
  activeStageIndex: 0,
  audioEnabled: false
};

// ============================================================================
// WebGL Scene Initialization
// ============================================================================
const canvas = document.getElementById('webgl-canvas');
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  powerPreference: 'high-performance'
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x98badc, 0.0028);

// Telephoto camera FOV (32 deg) gives authentic documentary flattening & monumental scale
const camera = new THREE.PerspectiveCamera(
  32,
  window.innerWidth / window.innerHeight,
  0.5,
  600
);
camera.position.copy(NARRATIVE_STAGES[0].camPos);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.maxPolarAngle = Math.PI * 0.53;
controls.minPolarAngle = Math.PI * 0.30;
controls.minDistance = 25;
controls.maxDistance = 190;
controls.target.copy(NARRATIVE_STAGES[0].camLookAt);

// Switch to 'free' camera mode when user manually drags canvas
controls.addEventListener('start', () => {
  if (state.cameraMode === 'narrative') {
    const selectEl = document.getElementById('select-viewpoint');
    if (selectEl) {
      selectEl.value = 'free';
      state.cameraMode = 'free';
    }
  }
});

// ============================================================================
// 1. Overcast Documentary Sky & Cloud Bank Shader Dome
// ============================================================================
function createAtmosphericSky() {
  const skyGeo = new THREE.SphereGeometry(320, 48, 32);
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: {
      uTime: { value: 0 },
      uWindSpeed: { value: 1.0 }
    },
    vertexShader: /* glsl */ `
      varying vec3 vWorldPos;
      void main() {
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWorldPos = wp.xyz;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: /* glsl */ `
      varying vec3 vWorldPos;
      uniform float uTime;
      uniform float uWindSpeed;

      // 2D Fractional Brownian Motion for overcast stratus clouds
      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
      }

      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        float a = hash(i);
        float b = hash(i + vec2(1.0, 0.0));
        float c = hash(i + vec2(0.0, 1.0));
        float d = hash(i + vec2(1.0, 1.0));
        return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
      }

      float fbm(vec2 p) {
        float v = 0.0;
        float a = 0.5;
        mat2 rot = mat2(0.8, -0.6, 0.6, 0.8);
        for (int i = 0; i < 5; i++) {
          v += a * noise(p);
          p = rot * p * 2.03;
          a *= 0.5;
        }
        return v;
      }

      void main() {
        vec3 dir = normalize(vWorldPos);
        float elev = clamp(dir.y * 0.5 + 0.5, 0.0, 1.0);

        // Exact palette from reference photos: cool steel-blue overcast sky
        vec3 horizonDark = vec3(0.41, 0.55, 0.70); // Distant sea/mist band at bottom
        vec3 lowerSky    = vec3(0.67, 0.80, 0.92); // Luminous pale blue behind bird swarm
        vec3 midSky      = vec3(0.62, 0.76, 0.89); // Main sky body
        vec3 zenithSky   = vec3(0.51, 0.67, 0.82); // Overcast cloud top

        vec3 col = mix(horizonDark, lowerSky, smoothstep(0.42, 0.49, elev));
        col = mix(col, midSky, smoothstep(0.49, 0.62, elev));
        col = mix(col, zenithSky, smoothstep(0.62, 0.88, elev));

        // Soft diffused stratus cloud patches (like screenshot 2 & 3 top-left clouds)
        vec2 cloudUV = dir.xy * vec2(2.6, 5.2) + vec2(uTime * 0.015 * uWindSpeed, 0.0);
        float c1 = fbm(cloudUV);
        float c2 = fbm(cloudUV * 1.8 - vec2(uTime * 0.01, 1.4));
        float cloudMask = smoothstep(0.45, 0.78, c1 * 0.65 + c2 * 0.35);

        // Soft grey-blue cloud shadow modulation
        vec3 cloudShadow = vec3(0.50, 0.64, 0.79);
        float heightMask = smoothstep(0.47, 0.56, elev);
        col = mix(col, cloudShadow, cloudMask * heightMask * 0.55);

        // Subtle atmospheric horizon glow line
        float horizonGlow = exp(-pow((elev - 0.475) * 28.0, 2.0));
        col += vec3(0.06, 0.09, 0.12) * horizonGlow;

        gl_FragColor = vec4(col, 1.0);
      }
    `
  });

  const skyMesh = new THREE.Mesh(skyGeo, skyMat);
  scene.add(skyMesh);
  return skyMat;
}

const skyMaterial = createAtmosphericSky();

// ============================================================================
// 2. Algorithmic 3D Target Generators for Kun (巨鯤) & Peng (大鵬)
// ============================================================================
/**
 * Generates dual 3D morphological coordinates for 85,000 birds:
 * - `aPosKun`: The colossal Whale/Fish (鯤) seen in screenshots 1, 2, 3
 *   Sharp pointed snout on the left (-X), curved dense belly below, flat/arched
 *   dorsal ridge, narrowing caudal peduncle, and sweeping trailing tail stream on right (+X).
 * - `aPosPeng`: The mythical Roc/Bird (鵬) seen in screenshots 4, 5
 *   Long razor-sharp leading wingtip reaching far left-upward, massive dense chest/belly
 *   curving down toward the lower right, and multiple trailing cloud-like feather wakes
 *   sweeping rightward ("其翼若垂天之雲").
 */
function buildMurmurationGeometry(count) {
  const geometry = new THREE.BufferGeometry();

  const posKun = new Float32Array(count * 3);
  const posPeng = new Float32Array(count * 3);
  const birdSeeds = new Float32Array(count * 4); // x: phase, y: speed, z: roleWeight, w: size

  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    const i4 = i * 4;

    // Role distribution:
    // 0.00 - 0.74: Core volumetric body & dense shell boundary
    // 0.74 - 0.92: Trailing wake & layered cloud feathers
    // 0.92 - 1.00: Wispy outer boundary & stray scout birds
    const rRole = Math.random();

    // ------------------------------------------------------------------------
    // A. KUN (巨鯤 — Colossal Sky-Whale Profile matching Screenshots 1-3)
    // ------------------------------------------------------------------------
    let kx, ky, kz;
    // Normalized longitudinal parameter u in [0, 1] from snout (left) to tail (right)
    // Bias distribution slightly toward the front/belly where density is darkest
    const uKun = Math.pow(Math.random(), 0.88);

    // X spans from -42 (sharp snout on left) to +46 (streaming tail on right)
    kx = -42.0 + uKun * 88.0;

    // Upper dorsal contour & lower ventral belly contour of Kun
    let dorsalY, ventralY, halfWidthZ;

    if (uKun < 0.62) {
      // Main whale body (snout to caudal peduncle)
      const s = uKun / 0.62; // 0..1 along main body
      // Dorsal ridge: slightly arched, flat-topped like screenshot 1 & 2
      dorsalY = 4.2 * Math.pow(Math.sin(Math.pow(s, 0.55) * Math.PI), 0.75) + 0.8;
      // Ventral belly: deep sweeping curve like a baleen whale (screenshot 1)
      ventralY = -10.2 * Math.pow(Math.sin(Math.pow(s, 0.62) * Math.PI), 1.15) + 0.8;
      // Z thickness
      halfWidthZ = 9.5 * Math.sin(Math.pow(s, 0.6) * Math.PI);
    } else {
      // Narrowing waist (peduncle) into sweeping bifurcated tail streams (screenshot 1 right side)
      const tTail = (uKun - 0.62) / 0.38; // 0..1 along tail
      const flare = Math.sin(tTail * Math.PI * 0.85);
      const upwardSweep = Math.pow(tTail, 1.25) * 5.8;
      dorsalY = 0.8 + upwardSweep + (1.2 + 2.8 * flare);
      ventralY = 0.8 + upwardSweep - (1.0 + 2.2 * flare);
      halfWidthZ = 2.0 + 7.5 * flare;
    }

    // Shell concentration: real murmurations have dark crisp edges (limb darkening)
    const theta = Math.random() * Math.PI * 2.0;
    // Bias radial distribution toward outer shell (0.65..1.0) so silhouette boundary is crisp
    const radialBias = rRole < 0.74
      ? Math.pow(Math.random(), 0.38)
      : (rRole < 0.92 ? 0.85 + Math.random() * 0.45 : 1.1 + Math.random() * 1.6);

    const midY = 0.5 * (dorsalY + ventralY);
    const ampY = 0.5 * (dorsalY - ventralY);

    ky = midY + Math.sin(theta) * ampY * radialBias;
    kz = Math.cos(theta) * halfWidthZ * radialBias;

    // Add internal Diagonal Striation Bands (seen in screenshot 2 where bird density forms waves)
    const striation = Math.sin(kx * 0.25 + kz * 0.35) * 0.65;
    ky += striation;

    // For tail streams, split into upper main tail plume and lower wispy tendril (screenshot 1 bottom-right)
    if (uKun > 0.68 && (i % 7 === 0)) {
      const tSub = (uKun - 0.68) / 0.32;
      ky -= tSub * 9.5;
      kz += (Math.random() - 0.5) * 4.0;
    }

    posKun[i3]     = kx;
    posKun[i3 + 1] = ky;
    posKun[i3 + 2] = kz;

    // ------------------------------------------------------------------------
    // B. PENG (大鵬 — Colossal Winged Roc / Hanging Clouds matching Screenshots 4-5)
    // ------------------------------------------------------------------------
    let px, py, pz;

    if (rRole < 0.52) {
      // 1. Massive Left Leading Wing & Dorsal Ridge (Screenshot 4 & 5: razor-sharp tip on far left,
      // widening into a colossal sweeping wing-body across the sky)
      const s = Math.pow(Math.random(), 1.05); // 0 at far-left wingtip (-50), 1 at center-right body (+18)
      px = -50.0 + s * 68.0;

      // Leading edge rises toward the left tip (+9.5 at tip, +3.5 at body center)
      const leadingEdgeY = 9.8 - s * 5.2 + Math.sin(s * Math.PI) * 1.4;
      // Chord thickness grows smoothly from sharp tip (0.3) to deep chest/wing-root (14.5)
      const chordDepth = 0.35 + Math.pow(s, 1.35) * 14.8;
      const lowerEdgeY = leadingEdgeY - chordDepth;

      // Cross-sectional airfoil distribution (dense near leading & lower edges)
      const vWing = Math.pow(Math.random(), 0.72);
      py = mix(leadingEdgeY, lowerEdgeY, vWing);

      // 3D wingspan depth (swept back in Z)
      const zSpan = (0.4 + Math.pow(s, 1.1) * 13.5) * (Math.random() * 2.0 - 1.0);
      pz = zSpan - (1.0 - s) * 8.0;

    } else if (rRole < 0.88) {
      // 2. Layered Cloud-Wings & Trailing Feather Plumes ("其翼若垂天之雲", Screenshot 5 right side)
      // Three distinct horizontal strata of dark bird-clouds trailing toward the right (+X)
      const layerIdx = i % 3; // 0: Upper canopy wing, 1: Middle dense belly cloud, 2: Lower sweeping tail-cloud
      const s = Math.pow(Math.random(), 0.85); // 0..1 from mid-body to far right horizon

      if (layerIdx === 0) {
        // Upper right wing extension (sweeping toward far right top)
        px = -4.0 + s * 58.0;
        const topY = 5.2 + s * 1.8;
        const botY = topY - (8.5 * (1.0 - s * 0.72));
        py = mix(topY, botY, Math.pow(Math.random(), 0.8));
        pz = (Math.random() - 0.5) * (16.0 * (1.0 - s * 0.5)) + 4.0;
      } else if (layerIdx === 1) {
        // Middle dense body & trailing vortex shelf (Screenshot 5 dark central lobe)
        px = -2.0 + s * 46.0;
        const topY = -1.5 - s * 1.2;
        const botY = topY - (8.2 * Math.sin(Math.pow(1.0 - s, 0.7) * Math.PI * 0.85) + 1.0);
        py = mix(topY, botY, Math.random());
        pz = (Math.random() - 0.5) * 14.0;
      } else {
        // Lower dramatic cloud step descending near the utility poles (Screenshot 4 & 5 bottom-right)
        px = 6.0 + s * 40.0;
        const topY = -7.8 - s * 2.2;
        const botY = topY - (5.2 * (1.0 - s * 0.65));
        py = mix(topY, botY, Math.random());
        pz = (Math.random() - 0.5) * 11.0 - 2.0;
      }

    } else {
      // 3. Wispy Cloud-Edge Mist & Lone Scout Birds (like the single distinct birds seen above the flock in Screenshots 1 & 5)
      const isLoneScout = i > count - 45;
      if (isLoneScout) {
        // Discrete individual scout birds hovering above or below the giant formation
        px = -35.0 + Math.random() * 80.0;
        py = 9.0 + Math.random() * 14.0 * (Math.random() > 0.25 ? 1.0 : -1.8);
        pz = (Math.random() - 0.5) * 20.0;
      } else {
        // Diffuse boundary mist particles around the Peng
        const s = Math.random();
        px = -46.0 + s * 96.0;
        py = (4.0 - s * 10.0) + (Math.random() - 0.5) * 14.0;
        pz = (Math.random() - 0.5) * 24.0;
      }
    }

    posPeng[i3]     = px;
    posPeng[i3 + 1] = py;
    posPeng[i3 + 2] = pz;

    // ------------------------------------------------------------------------
    // C. Per-Bird Attributes (Phase, Wing-Flap Speed, Role Weight, Scale)
    // ------------------------------------------------------------------------
    const isScout = i > count - 45;
    birdSeeds[i4]     = Math.random() * Math.PI * 2.0; // Random phase
    birdSeeds[i4 + 1] = 0.75 + Math.random() * 0.65;   // Flap & flow speed multiplier
    birdSeeds[i4 + 2] = rRole;                         // Used for density slider & edge dissipation
    birdSeeds[i4 + 3] = isScout ? (2.2 + Math.random() * 1.2) : (0.7 + Math.random() * 0.9);
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(posKun, 3));
  geometry.setAttribute('aPosKun', new THREE.BufferAttribute(posKun, 3));
  geometry.setAttribute('aPosPeng', new THREE.BufferAttribute(posPeng, 3));
  geometry.setAttribute('aSeed', new THREE.BufferAttribute(birdSeeds, 4));

  return geometry;
}

function mix(a, b, t) {
  return a + (b - a) * t;
}

// ============================================================================
// 3. Custom WebGL Shader for 85,000 Flapping Starling Silhouettes & Curl Flow
// ============================================================================
const murmurationUniforms = {
  uTime: { value: 0 },
  uMorph: { value: state.timeline },
  uTurbulence: { value: state.turbulence },
  uDensityLimit: { value: state.densityRatio },
  uWindSpeed: { value: state.windSpeed },
  uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) }
};

const murmurationMaterial = new THREE.ShaderMaterial({
  transparent: true,
  depthWrite: false,
  blending: THREE.NormalBlending,
  uniforms: murmurationUniforms,
  vertexShader: /* glsl */ `
    attribute vec3 aPosKun;
    attribute vec3 aPosPeng;
    attribute vec4 aSeed;

    uniform float uTime;
    uniform float uMorph;
    uniform float uTurbulence;
    uniform float uDensityLimit;
    uniform float uWindSpeed;
    uniform float uPixelRatio;

    varying float vAlpha;
    varying float vFlapPhase;
    varying float vShade;
    varying float vTilt;

    // Simplex-inspired 3D value noise for fluid murmuration waves
    float hash3(vec3 p) {
      p = fract(p * 0.3183099 + 0.1);
      p *= 17.0;
      return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
    }

    float noise3(vec3 x) {
      vec3 i = floor(x);
      vec3 f = fract(x);
      f = f * f * (3.0 - 2.0 * f);
      return mix(
        mix(mix(hash3(i + vec3(0,0,0)), hash3(i + vec3(1,0,0)), f.x),
            mix(hash3(i + vec3(0,1,0)), hash3(i + vec3(1,1,0)), f.x), f.y),
        mix(mix(hash3(i + vec3(0,0,1)), hash3(i + vec3(1,0,1)), f.x),
            mix(hash3(i + vec3(0,1,1)), hash3(i + vec3(1,1,1)), f.x), f.y),
        f.z
      );
    }

    // Approximate 3D Curl-like Swirl Field
    vec3 curlSwirl(vec3 p, float t) {
      float n1 = noise3(p + vec3(t, 0.0, 0.0));
      float n2 = noise3(p + vec3(0.0, t, 11.3));
      float n3 = noise3(p + vec3(7.1, 0.0, t));
      return vec3(n2 - n3, n3 - n1, n1 - n2);
    }

    void main() {
      float phase = aSeed.x;
      float speed = aSeed.y;
      float role  = aSeed.z;
      float scale = aSeed.w;

      // Cull particles smoothly if user lowers Swarm Density slider
      float densityFade = smoothstep(uDensityLimit, uDensityLimit - 0.08, role * 0.92);

      // Five-Act Narrative Curve from uMorph in [0..1]:
      // [0.00 - 0.25]: Kun swimming serenely
      // [0.25 - 0.42]: Kun elongating ("不知其幾千里也")
      // [0.42 - 0.66]: Boiling vortex transition Kun -> Peng ("化而爲鳥，其名爲鵬")
      // [0.66 - 0.85]: Colossal Peng soaring ("鵬之背，不知其幾千里也")
      // [0.85 - 1.00]: Mighty wings dispersing into hanging clouds ("怒而飛，其翼若垂天之雲")

      // Propagate transformation wave from head (-X) to tail (+X)
      float xNorm = clamp((aPosKun.x + 45.0) / 90.0, 0.0, 1.0);
      float localMorph = smoothstep(0.32 + xNorm * 0.16, 0.64 + xNorm * 0.16, uMorph);

      // Elongate Kun in Act 2
      vec3 kunPos = aPosKun;
      float kunStretch = smoothstep(0.15, 0.42, uMorph) * (1.0 - localMorph);
      kunPos.x *= (1.0 + kunStretch * 0.22);

      // Base morphed position
      vec3 pos = mix(kunPos, aPosPeng, localMorph);

      // Swirling metamorphosis vortex during Act 3 ("化而爲鳥")
      float metamorphosisBell = sin(localMorph * 3.14159265);
      float tFlow = uTime * 0.45 * uWindSpeed;

      // Travelling internal density wave (creates the characteristic dark/light ripples inside a starling flock)
      vec3 swirl = curlSwirl(pos * 0.065, tFlow) * (2.2 + metamorphosisBell * 7.5) * uTurbulence;

      // Helical roll during transformation
      float rollAngle = metamorphosisBell * 1.65 * sin(xNorm * 4.5 - tFlow * 2.0);
      float cy = pos.y * cos(rollAngle) - pos.z * sin(rollAngle);
      float cz = pos.y * sin(rollAngle) + pos.z * cos(rollAngle);
      pos.y = mix(pos.y, cy, metamorphosisBell * 0.65);
      pos.z = mix(pos.z, cz, metamorphosisBell * 0.65);

      // Act 5: "怒而飛，其翼若垂天之雲" — Wing undulation & cloud-edge billowing
      float cloudAct = smoothstep(0.75, 1.0, uMorph);
      float wingWave = sin(pos.x * 0.075 - uTime * 1.6 * uWindSpeed) * (0.9 + cloudAct * 1.6);
      pos.y += wingWave * localMorph;

      // Edge birds billow outward into trailing clouds in Act 5
      float edgeFactor = smoothstep(0.65, 1.0, role);
      pos.x += cloudAct * edgeFactor * 8.5 * sin(phase + tFlow);
      pos.y -= cloudAct * edgeFactor * 3.2 * cos(phase * 1.3);

      // Gentle undulating swimming motion when in Kun state
      float swimWave = sin(pos.x * 0.11 - uTime * 1.9 * uWindSpeed) * 0.85 * (1.0 - localMorph);
      pos.y += swimWave;

      // Apply organic curl turbulence
      pos += swirl * (0.45 + 0.85 * edgeFactor);

      // High-frequency individual bird micro-flight oscillation
      float flapFreq = (9.5 + speed * 5.0) * (1.0 + cloudAct * 0.35);
      vFlapPhase = uTime * flapFreq + phase * 6.2831;
      pos.y += sin(vFlapPhase) * 0.08;

      vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
      gl_Position = projectionMatrix * mvPosition;

      // Perspective point size (individual birds are crisp tiny silhouettes; scouts slightly larger)
      float dist = max(-mvPosition.z, 10.0);
      gl_PointSize = (185.0 / dist) * scale * uPixelRatio;

      // Internal shading wave (simulates 3D flock compression & orientation changes)
      float compressionWave = noise3(pos * 0.12 - vec3(tFlow * 1.8, 0.0, 0.0));
      vShade = clamp(0.25 + compressionWave * 0.75, 0.0, 1.0);

      // Banking tilt angle for the bird silhouette
      vTilt = sin(phase + uTime * 1.4 + pos.x * 0.05) * 0.45;

      // Opacity: dense core vs wispy mist edges
      float baseAlpha = mix(0.62, 0.24, edgeFactor);
      // Slight dissolution at the very far right trailing edge (+X > 36)
      float tailFade = 1.0 - smoothstep(34.0, 56.0, pos.x) * 0.55;
      vAlpha = baseAlpha * tailFade * densityFade;
    }
  `,
  fragmentShader: /* glsl */ `
    varying float vAlpha;
    varying float vFlapPhase;
    varying float vShade;
    varying float vTilt;

    void main() {
      if (vAlpha < 0.01) discard;

      // Transform gl_PointCoord into a banking, wing-flapping bird silhouette
      vec2 uv = gl_PointCoord * 2.0 - 1.0;

      float c = cos(vTilt);
      float s = sin(vTilt);
      vec2 p = vec2(c * uv.x - s * uv.y, s * uv.x + c * uv.y);

      // Wing flapping curvature: V-upstroke to M-downstroke gull/starling profile
      float flap = sin(vFlapPhase);
      float absX = abs(p.x);
      float wingCurve = -flap * 0.52 * pow(absX, 1.35) + 0.12 * absX;

      // Thickness tapers from avian torso (center) to sharp wingtips
      float wingThickness = mix(0.26, 0.04, smoothstep(0.0, 0.95, absX));
      float dy = abs(p.y - wingCurve);

      // Soft antialiased silhouette mask
      float birdMask = (1.0 - smoothstep(wingThickness * 0.45, wingThickness, dy))
                     * (1.0 - smoothstep(0.78, 1.0, absX));

      if (birdMask < 0.05) discard;

      // Documentary color matching: deep slate-charcoal birds blended with cool overcast haze
      vec3 deepCharcoal = vec3(0.09, 0.14, 0.20);
      vec3 slateMist    = vec3(0.24, 0.35, 0.47);
      vec3 birdColor    = mix(deepCharcoal, slateMist, vShade * 0.65);

      gl_FragColor = vec4(birdColor, birdMask * vAlpha);
    }
  `
});

const murmurationGeometry = buildMurmurationGeometry(TOTAL_BIRDS);
const murmurationPoints = new THREE.Points(murmurationGeometry, murmurationMaterial);
scene.add(murmurationPoints);

// ============================================================================
// 4. Documentary Foreground Anchors (Coastal Pavilion & Utility Poles with Nest)
// ============================================================================
/**
 * Recreates the exact foreground compositional anchors from the 5 reference photos:
 * - Left/Center-Right Coastal Zone (Acts 1-2, Screenshot 1):
 *   A hexagonal dark-wood viewing pavilion (觀海涼亭) on the lower right with subtle
 *   silhouettes of spectators inside watching the Kun whale in the sky, plus distant coastline.
 * - Right Open-Field Zone (Acts 4-5, Screenshots 4-5):
 *   A row of wooden utility poles with double crossarms, a large stork/osprey bird nest
 *   perched atop the double-pole frame, sagging power lines, and dozens of tiny perched birds
 *   lined up along the wires and crossarms.
 */
function createDocumentaryForeground() {
  const fgGroup = new THREE.Group();
  const silhouetteMat = new THREE.MeshBasicMaterial({
    color: 0x151d26,
    fog: false
  });
  const wireMat = new THREE.LineBasicMaterial({
    color: 0x1c2733,
    transparent: true,
    opacity: 0.78
  });

  // --------------------------------------------------------------------------
  // A. Distant Horizon Coastline & Treeline Silhouette Band
  // --------------------------------------------------------------------------
  const coastlineGeo = new THREE.PlaneGeometry(360, 5.5, 180, 1);
  const posAttr = coastlineGeo.attributes.position;
  for (let i = 0; i < posAttr.count; i++) {
    const x = posAttr.getX(i);
    const y = posAttr.getY(i);
    if (y > 0) {
      // Procedural uneven distant coastal treeline bumps (like bottom of screenshots 1, 3, 5)
      const treeBump =
        Math.sin(x * 0.45) * 0.25 +
        Math.sin(x * 1.3) * 0.15 +
        Math.cos(x * 3.7) * 0.08;
      posAttr.setY(i, y + Math.max(-0.2, treeBump));
    }
  }
  coastlineGeo.computeVertexNormals();
  const coastlineMesh = new THREE.Mesh(
    coastlineGeo,
    new THREE.MeshBasicMaterial({ color: 0x1c2836, transparent: true, opacity: 0.88 })
  );
  coastlineMesh.position.set(10, -21.2, 22);
  fgGroup.add(coastlineMesh);

  // --------------------------------------------------------------------------
  // B. Coastal Viewing Pavilion (觀海涼亭 — Screenshot 1 Bottom-Right)
  // Positioned so that in Acts 1-2 camera (camPos.x ~ 6), it sits cleanly in bottom-right
  // --------------------------------------------------------------------------
  const pavilion = new THREE.Group();
  pavilion.position.set(17.5, -15.4, 52.0);

  // Base Deck & Railing
  const deck = new THREE.Mesh(new THREE.BoxGeometry(7.2, 1.3, 5.2), silhouetteMat);
  deck.position.y = -2.2;
  pavilion.add(deck);

  // Four main pillars
  const pillarPositions = [
    [-2.8, -0.4, 1.8],
    [-0.9, -0.4, 2.1],
    [0.9, -0.4, 2.1],
    [2.8, -0.4, 1.8]
  ];
  pillarPositions.forEach(([px, py, pz]) => {
    const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.26, 2.6, 0.26), silhouetteMat);
    pillar.position.set(px, py, pz);
    pavilion.add(pillar);
  });

  // Spectators silhouettes standing inside the pavilion looking at the sky
  const spectatorOffsets = [-2.2, -1.6, -1.1, -0.3, 0.3, 1.3, 1.8, 2.3];
  spectatorOffsets.forEach((sx, idx) => {
    const h = 0.72 + (idx % 3) * 0.1;
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.32, h, 0.25), silhouetteMat);
    body.position.set(sx, -1.2 + h * 0.5, 1.9);
    pavilion.add(body);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.13, 8, 8), silhouetteMat);
    head.position.set(sx, -1.2 + h + 0.12, 1.9);
    pavilion.add(head);
  });

  // Eave beam & pyramidal hipped roof (亭頂)
  const eave = new THREE.Mesh(new THREE.BoxGeometry(8.4, 0.32, 6.0), silhouetteMat);
  eave.position.y = 0.9;
  pavilion.add(eave);

  const roofGeo = new THREE.ConeGeometry(5.6, 2.6, 4);
  roofGeo.rotateY(Math.PI * 0.25);
  const roof = new THREE.Mesh(roofGeo, silhouetteMat);
  roof.scale.set(1.15, 1.0, 0.85);
  roof.position.y = 2.35;
  pavilion.add(roof);

  fgGroup.add(pavilion);

  // --------------------------------------------------------------------------
  // C. Open-Field Utility Poles, Crossarms, Osprey Nest & Perched Birds
  // (Screenshots 4 & 5 Bottom-Right & Mid-Bottom)
  // Positioned around X = 22..46 so they enter the lower frame during Acts 4 & 5
  // --------------------------------------------------------------------------
  const polesGroup = new THREE.Group();

  // Helper to build a double or single utility pole with crossarms
  function addUtilityPoleFrame(x, yBase, z, scale, hasNest = false) {
    const poleUnit = new THREE.Group();
    poleUnit.position.set(x, yBase, z);
    poleUnit.scale.setScalar(scale);

    // Dual H-frame poles (like the prominent right-side structure in Screenshot 4 & 5)
    const poleH = 8.2;
    const leftPole = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.13, poleH, 8), silhouetteMat);
    leftPole.position.set(-0.85, poleH * 0.5, 0);
    poleUnit.add(leftPole);

    const rightPole = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.13, poleH, 8), silhouetteMat);
    rightPole.position.set(0.85, poleH * 0.5, 0);
    poleUnit.add(rightPole);

    // Horizontal crossbars
    const bar1 = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.11, 0.11), silhouetteMat);
    bar1.position.set(0, poleH - 0.9, 0);
    poleUnit.add(bar1);

    const bar2 = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.09, 0.09), silhouetteMat);
    bar2.position.set(0, poleH - 1.9, 0);
    poleUnit.add(bar2);

    // Insulator pins
    for (let k = -1.5; k <= 1.5; k += 0.75) {
      const pin = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.24, 0.06), silhouetteMat);
      pin.position.set(k, poleH - 0.75, 0);
      poleUnit.add(pin);
    }

    // Large bushy bird nest on top of the right pole (exact match to Screenshot 4 & 5)
    if (hasNest) {
      const nestGroup = new THREE.Group();
      nestGroup.position.set(0.85, poleH - 0.75, 0);
      for (let n = 0; n < 14; n++) {
        const twigBlob = new THREE.Mesh(
          new THREE.DodecahedronGeometry(0.35 + (n % 3) * 0.12, 0),
          silhouetteMat
        );
        twigBlob.scale.set(1.6, 0.75, 1.2);
        twigBlob.position.set(
          (Math.sin(n * 2.1) * 0.35),
          (Math.cos(n * 1.7) * 0.18),
          (Math.sin(n * 3.3) * 0.2)
        );
        twigBlob.rotation.set(n * 0.4, n * 0.8, n * 0.3);
        nestGroup.add(twigBlob);
      }
      poleUnit.add(nestGroup);
    }

    polesGroup.add(poleUnit);
    return new THREE.Vector3(x, yBase + (poleH - 1.0) * scale, z);
  }

  // Place receding line of poles from far center-left to close bottom-right (matching Screenshot 5)
  const p1 = addUtilityPoleFrame(15.5, -20.8, 44.0, 0.42, false);
  const p2 = addUtilityPoleFrame(22.0, -20.6, 46.0, 0.52, false);
  const p3 = addUtilityPoleFrame(29.2, -20.2, 48.0, 0.68, false);
  const p4 = addUtilityPoleFrame(39.8, -19.8, 52.0, 0.96, true); // Main close H-pole with bird nest!
  const p5 = addUtilityPoleFrame(47.5, -19.6, 54.0, 1.02, false);

  const poleTops = [p1, p2, p3, p4, p5];

  // Connect poles with sagging catenary power lines and perch tiny birds along them!
  const perchedBirdGeo = new THREE.BoxGeometry(0.11, 0.17, 0.08);

  for (let i = 0; i < poleTops.length - 1; i++) {
    const startA = poleTops[i];
    const endB = poleTops[i + 1];

    // Three parallel wires per span
    [-1.1, 0.0, 1.1].forEach((offsetX, wireIdx) => {
      const points = [];
      const segments = 24;
      for (let s = 0; s <= segments; s++) {
        const t = s / segments;
        const wx = mix(startA.x + offsetX * 0.5, endB.x + offsetX * 0.8, t);
        const wz = mix(startA.z, endB.z, t);
        // Catenary sag
        const sag = Math.sin(t * Math.PI) * (0.45 + i * 0.25);
        const wy = mix(startA.y, endB.y, t) - sag - wireIdx * 0.35;
        points.push(new THREE.Vector3(wx, wy, wz));

        // Add tiny perched starlings along the close wires (Screenshot 4 & 5 bottom-right detail!)
        if (i >= 2 && s > 1 && s < segments - 1 && ((s + wireIdx * 3) % 2 === 0)) {
          const bird = new THREE.Mesh(perchedBirdGeo, silhouetteMat);
          bird.position.set(wx, wy + 0.09, wz);
          bird.rotation.z = (Math.sin(s * 3.7) * 0.18);
          polesGroup.add(bird);
        }
      }
      const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
      polesGroup.add(new THREE.Line(lineGeo, wireMat));
    });
  }

  fgGroup.add(polesGroup);
  scene.add(fgGroup);
  return fgGroup;
}

createDocumentaryForeground();

// ============================================================================
// 5. Procedural Web Audio API Soundscape (Northern Ocean Wind & 85,000 Wings)
// ============================================================================
class MurmurationSoundscape {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.windFilter = null;
    this.wingsFilter = null;
    this.wingsGain = null;
    this.subDroneGain = null;
    this.isRunning = false;
  }

  init() {
    if (this.ctx) return;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AudioCtx();

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.01;
    this.masterGain.connect(this.ctx.destination);

    // Create 4-second looping pink-ish noise buffer for wind & wing rush
    const bufferSize = this.ctx.sampleRate * 4;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.04;
      b6 = white * 0.115926;
    }

    // 1. Coastal Overcast Wind Layer (Low-pass / Band-pass filtered noise)
    const windSource = this.ctx.createBufferSource();
    windSource.buffer = noiseBuffer;
    windSource.loop = true;

    this.windFilter = this.ctx.createBiquadFilter();
    this.windFilter.type = 'bandpass';
    this.windFilter.frequency.value = 220;
    this.windFilter.Q.value = 1.8;

    const windGain = this.ctx.createGain();
    windGain.gain.value = 0.55;

    windSource.connect(this.windFilter);
    this.windFilter.connect(windGain);
    windGain.connect(this.masterGain);
    windSource.start();

    // 2. 85,000 Flapping Wings Rush Layer (Mid-frequency fluttering wave)
    const wingsSource = this.ctx.createBufferSource();
    wingsSource.buffer = noiseBuffer;
    wingsSource.loop = true;

    this.wingsFilter = this.ctx.createBiquadFilter();
    this.wingsFilter.type = 'bandpass';
    this.wingsFilter.frequency.value = 580;
    this.wingsFilter.Q.value = 1.1;

    this.wingsGain = this.ctx.createGain();
    this.wingsGain.gain.value = 0.25;

    wingsSource.connect(this.wingsFilter);
    this.wingsFilter.connect(this.wingsGain);
    this.wingsGain.connect(this.masterGain);
    wingsSource.start();

    // 3. Deep Oceanic / Leviathan Sub-harmonic Resonance ("北冥有魚")
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 58;

    this.subDroneGain = this.ctx.createGain();
    this.subDroneGain.gain.value = 0.14;

    osc.connect(this.subDroneGain);
    this.subDroneGain.connect(this.masterGain);
    osc.start();
  }

  toggle(enable) {
    if (!this.ctx) this.init();
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    this.isRunning = enable;
    const now = this.ctx.currentTime;
    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.setTargetAtTime(enable ? 0.55 : 0.0001, now, 0.35);
  }

  update(time, morph, windSpeed, turbulence) {
    if (!this.isRunning || !this.ctx) return;
    const now = this.ctx.currentTime;

    // Swell wind frequency & wing rush intensity during Act 3 ("化而爲鳥") & Act 5 ("怒而飛")
    const metamorphosisSurge = Math.sin(morph * Math.PI);
    const mightyFlightSurge = Math.max(0, (morph - 0.65) / 0.35);

    const targetWindFreq = (180 + metamorphosisSurge * 140 + mightyFlightSurge * 190) * windSpeed;
    this.windFilter.frequency.setTargetAtTime(targetWindFreq, now, 0.1);

    const flutterWave = 0.5 + 0.5 * Math.sin(time * 3.2 * windSpeed);
    const targetWingsGain = (0.18 + metamorphosisSurge * 0.28 + mightyFlightSurge * 0.35) * (0.75 + 0.25 * flutterWave) * Math.min(turbulence, 1.6);
    this.wingsGain.gain.setTargetAtTime(targetWingsGain, now, 0.1);
  }
}

const soundscape = new MurmurationSoundscape();

// ============================================================================
// 6. UI Binding & Five-Act Director Synchronization
// ============================================================================
const ui = {
  scrubber: document.getElementById('timeline-scrubber'),
  scrubFill: document.getElementById('scrub-progress-fill'),
  btnPlayPause: document.getElementById('btn-play-pause'),
  iconPlay: document.getElementById('icon-play'),
  iconPause: document.getElementById('icon-pause'),
  stageTabs: Array.from(document.querySelectorAll('.stage-tab')),
  verseColumns: Array.from(document.querySelectorAll('.verse-column')),
  verseCaption: document.getElementById('verse-caption'),
  stageLabelShort: document.getElementById('stage-label-short'),
  particleReadout: document.getElementById('particle-count-readout'),
  sliderTurbulence: document.getElementById('slider-turbulence'),
  valTurbulence: document.getElementById('val-turbulence'),
  sliderDensity: document.getElementById('slider-density'),
  valDensity: document.getElementById('val-density'),
  sliderWind: document.getElementById('slider-wind'),
  valWind: document.getElementById('val-wind'),
  selectViewpoint: document.getElementById('select-viewpoint'),
  btnCameraReset: document.getElementById('btn-camera-reset'),
  btnAudioToggle: document.getElementById('btn-audio-toggle'),
  iconAudioOff: document.getElementById('icon-audio-off'),
  iconAudioOn: document.getElementById('icon-audio-on'),
  audioLabel: document.getElementById('audio-label'),
  btnUiCollapse: document.getElementById('btn-ui-collapse')
};

function getStageIndexForT(t) {
  if (t < 0.2) return 0;
  if (t < 0.4) return 1;
  if (t < 0.6) return 2;
  if (t < 0.8) return 3;
  return 4;
}

function updateStageUI(t) {
  const pct = (t * 100).toFixed(1);
  ui.scrubber.value = t.toFixed(3);
  ui.scrubFill.style.width = `${pct}%`;

  const stageIdx = getStageIndexForT(t);
  if (stageIdx !== state.activeStageIndex) {
    state.activeStageIndex = stageIdx;
    const stageData = NARRATIVE_STAGES[stageIdx];

    ui.stageLabelShort.textContent = stageData.shortTitle;
    ui.verseCaption.textContent = stageData.caption;

    ui.stageTabs.forEach((tab, idx) => {
      const active = idx === stageIdx;
      tab.classList.toggle('active', active);
      tab.setAttribute('aria-selected', String(active));
    });

    ui.verseColumns.forEach((col, idx) => {
      col.classList.toggle('active', idx === stageIdx);
    });
  }
}

function jumpToStage(stageIdx) {
  const stage = NARRATIVE_STAGES[stageIdx];
  if (!stage) return;
  state.targetTimeline = stage.targetT;
  if (state.cameraMode === 'free') {
    state.cameraMode = 'narrative';
    ui.selectViewpoint.value = 'narrative';
  }
}

// Event Listeners
ui.btnPlayPause.addEventListener('click', () => {
  state.isPlaying = !state.isPlaying;
  state.targetTimeline = null;
  ui.iconPause.classList.toggle('hidden', !state.isPlaying);
  ui.iconPlay.classList.toggle('hidden', state.isPlaying);
});

ui.scrubber.addEventListener('input', (e) => {
  state.timeline = parseFloat(e.target.value);
  state.targetTimeline = null;
  murmurationUniforms.uMorph.value = state.timeline;
  updateStageUI(state.timeline);
});

ui.stageTabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    const idx = parseInt(tab.dataset.stage, 10);
    jumpToStage(idx);
  });
});

ui.verseColumns.forEach((col) => {
  col.addEventListener('click', () => {
    const idx = parseInt(col.dataset.stage, 10);
    jumpToStage(idx);
  });
  col.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      jumpToStage(parseInt(col.dataset.stage, 10));
    }
  });
});

ui.sliderTurbulence.addEventListener('input', (e) => {
  state.turbulence = parseFloat(e.target.value);
  murmurationUniforms.uTurbulence.value = state.turbulence;
  ui.valTurbulence.textContent = `${state.turbulence.toFixed(2)}×`;
});

ui.sliderDensity.addEventListener('input', (e) => {
  state.densityRatio = parseFloat(e.target.value);
  murmurationUniforms.uDensityLimit.value = state.densityRatio;
  const count = Math.round(TOTAL_BIRDS * state.densityRatio);
  const formatted = count.toLocaleString('en-US');
  ui.valDensity.textContent = formatted;
  ui.particleReadout.textContent = `${formatted} 羽`;
});

ui.sliderWind.addEventListener('input', (e) => {
  state.windSpeed = parseFloat(e.target.value);
  murmurationUniforms.uWindSpeed.value = state.windSpeed;
  skyMaterial.uniforms.uWindSpeed.value = state.windSpeed;
  ui.valWind.textContent = `${state.windSpeed.toFixed(2)}×`;
});

ui.selectViewpoint.addEventListener('change', (e) => {
  state.cameraMode = e.target.value;
});

ui.btnCameraReset.addEventListener('click', () => {
  state.cameraMode = 'narrative';
  ui.selectViewpoint.value = 'narrative';
});

ui.btnAudioToggle.addEventListener('click', () => {
  state.audioEnabled = !state.audioEnabled;
  soundscape.toggle(state.audioEnabled);
  ui.btnAudioToggle.setAttribute('aria-pressed', String(state.audioEnabled));
  ui.iconAudioOff.classList.toggle('hidden', state.audioEnabled);
  ui.iconAudioOn.classList.toggle('hidden', !state.audioEnabled);
  ui.audioLabel.textContent = state.audioEnabled ? '環境音場：開啟' : '環境音場：靜音';
});

ui.btnUiCollapse.addEventListener('click', () => {
  document.body.classList.toggle('ui-collapsed');
});

window.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
  if (e.code === 'Space') {
    e.preventDefault();
    ui.btnPlayPause.click();
  } else if (e.key === 'm' || e.key === 'M') {
    ui.btnAudioToggle.click();
  } else if (e.key === 'h' || e.key === 'H') {
    ui.btnUiCollapse.click();
  } else if (e.key === 'r' || e.key === 'R') {
    ui.btnCameraReset.click();
  } else if (e.key >= '1' && e.key <= '5') {
    jumpToStage(parseInt(e.key, 10) - 1);
  }
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  murmurationUniforms.uPixelRatio.value = Math.min(window.devicePixelRatio, 2);
});

// ============================================================================
// 7. Continuous Narrative Camera Interpolation & Animation Loop
// ============================================================================
const tempCamPos = new THREE.Vector3();
const tempLookAt = new THREE.Vector3();

function computeNarrativeCamera(t, outPos, outLook) {
  // Smooth piecewise interpolation across the 5 narrative stage camera keyframes
  const scaled = Math.max(0, Math.min(0.9999, t)) * (NARRATIVE_STAGES.length - 1);
  const idx = Math.floor(scaled);
  const frac = scaled - idx;
  const smoothFrac = frac * frac * (3.0 - 2.0 * frac);

  const stageA = NARRATIVE_STAGES[idx];
  const stageB = NARRATIVE_STAGES[Math.min(idx + 1, NARRATIVE_STAGES.length - 1)];

  outPos.lerpVectors(stageA.camPos, stageB.camPos, smoothFrac);
  outLook.lerpVectors(stageA.camLookAt, stageB.camLookAt, smoothFrac);
}

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  const dt = Math.min(clock.getDelta(), 0.1);
  const elapsed = clock.getElapsedTime();

  // 1. Advance or interpolate narrative timeline
  if (state.targetTimeline !== null) {
    const diff = state.targetTimeline - state.timeline;
    if (Math.abs(diff) < 0.002) {
      state.timeline = state.targetTimeline;
      state.targetTimeline = null;
    } else {
      state.timeline += diff * Math.min(1.0, dt * 4.5);
    }
    updateStageUI(state.timeline);
  } else if (state.isPlaying) {
    state.timeline += dt * state.playSpeed;
    if (state.timeline > 1.0) {
      state.timeline = 0.0;
    }
    updateStageUI(state.timeline);
  }

  // 2. Update Shader Uniforms
  murmurationUniforms.uTime.value = elapsed;
  murmurationUniforms.uMorph.value = state.timeline;
  skyMaterial.uniforms.uTime.value = elapsed;

  // 3. Camera Choreography (Documentary handheld breathing + stage tracking)
  const breathX = Math.sin(elapsed * 0.55) * 0.25;
  const breathY = Math.cos(elapsed * 0.42) * 0.16;

  if (state.cameraMode === 'narrative') {
    computeNarrativeCamera(state.timeline, tempCamPos, tempLookAt);
    tempCamPos.x += breathX;
    tempCamPos.y += breathY;
    camera.position.lerp(tempCamPos, Math.min(1.0, dt * 2.8));
    controls.target.lerp(tempLookAt, Math.min(1.0, dt * 2.8));
  } else if (CAMERA_PRESETS[state.cameraMode]) {
    const preset = CAMERA_PRESETS[state.cameraMode];
    tempCamPos.copy(preset.pos);
    tempCamPos.x += breathX;
    tempCamPos.y += breathY;
    camera.position.lerp(tempCamPos, Math.min(1.0, dt * 3.5));
    controls.target.lerp(preset.target, Math.min(1.0, dt * 3.5));
  }

  controls.update();

  // 4. Update Procedural Soundscape
  soundscape.update(elapsed, state.timeline, state.windSpeed, state.turbulence);

  // 5. Render Scene
  renderer.render(scene, camera);
}

updateStageUI(state.timeline);
animate();
