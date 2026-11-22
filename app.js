/**
 * 《莊子‧逍遙遊》「北冥有魚」— Three.js & WebGL Custom Shader Murmuration Engine
 *
 * Faithfully reconstructs the 5 documentary reference frames:
 * - Frame 1 (Act 1): Colossal Kun whale murmuration hovering in the center-left sky,
 *   crisp dark dorsal ridge & sweeping rounded belly, bifurcated tail stream to the right,
 *   and the coastal viewing pavilion cropped at the bottom-right edge with distant misty sea horizon.
 * - Frame 2 & 3 (Act 2): Telephoto view of the elongated Kun whale with internal diagonal density
 *   striations, sharp pointed snout on the left, and trailing mist.
 * - Frame 4 & 5 (Act 4-5): Colossal Peng bird with razor-sharp wingtip reaching far upper-left,
 *   massive layered wing-body sweeping down to the lower-right, and open-field utility poles
 *   with an osprey nest and perched birds on the sagging wires at the bottom-right.
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
    caption: '遠海觀景涼亭外，十萬飛鳥於灰藍天幕中凝聚成巨鯤之形：背脊深邃平緩、魚腹飽滿圓潤、尾翼流線延展，懸浮於海天之間。',
    tRange: [0.0, 0.22],
    targetT: 0.05,
    camPos: new THREE.Vector3(0.0, 0.0, 82.0),
    camLookAt: new THREE.Vector3(0.0, 0.0, 0.0)
  },
  {
    id: 1,
    shortTitle: '貳 · 幾千里也',
    verse: '鯤之大，不知其幾千里也。',
    caption: '長焦鏡頭推進特寫，巨鯤修長身軀橫貫蒼穹，銳利魚吻刺破冷風，內部鳥群如海流般呈斜向波紋層層翻湧。',
    tRange: [0.22, 0.42],
    targetT: 0.30,
    camPos: new THREE.Vector3(-4.5, 0.8, 66.0),
    camLookAt: new THREE.Vector3(-4.5, 0.8, 0.0)
  },
  {
    id: 2,
    shortTitle: '叁 · 化而爲鳥',
    verse: '化而爲鳥，其名爲鵬。',
    caption: '氣流翻湧旋捲，巨鯤修長的身軀在空中劇烈重組，前端延伸為修長銳利的巨翼前緣，腹尾舒展為層疊羽翼。',
    tRange: [0.42, 0.62],
    targetT: 0.52,
    camPos: new THREE.Vector3(18.0, 0.4, 80.0),
    camLookAt: new THREE.Vector3(18.0, 0.4, 0.0)
  },
  {
    id: 3,
    shortTitle: '肆 · 鵬之背',
    verse: '鵬之背，不知其幾千里也；',
    caption: '鏡頭隨大鵬橫移至曠野電線桿與鳥巢上方，大鵬左翼尖直指蒼穹，厚重寬廣的身軀與下方電線桿上渺小的停棲鳥群形成震撼對比。',
    tRange: [0.62, 0.82],
    targetT: 0.72,
    camPos: new THREE.Vector3(42.0, 0.0, 82.0),
    camLookAt: new THREE.Vector3(42.0, 0.0, 0.0)
  },
  {
    id: 4,
    shortTitle: '伍 · 垂天之雲',
    verse: '怒而飛，其翼若垂天之雲。',
    caption: '大鵬乘風怒飛，橫跨千里的巨翼在狂風中分化為三層階梯狀的濃密雲翼，尾羽煙消雲散，與北冥天際融為一體。',
    tRange: [0.82, 1.0],
    targetT: 0.92,
    camPos: new THREE.Vector3(46.0, 0.0, 84.0),
    camLookAt: new THREE.Vector3(46.0, 0.0, 0.0)
  }
];

const CAMERA_PRESETS = {
  pavilion: {
    pos: new THREE.Vector3(0.0, 0.0, 82.0),
    target: new THREE.Vector3(0.0, 0.0, 0.0)
  },
  telephoto: {
    pos: new THREE.Vector3(-5.0, 0.8, 65.0),
    target: new THREE.Vector3(-5.0, 0.8, 0.0)
  },
  poles: {
    pos: new THREE.Vector3(45.0, 0.0, 83.0),
    target: new THREE.Vector3(45.0, 0.0, 0.0)
  }
};

// ============================================================================
// Global State
// ============================================================================
const TOTAL_BIRDS = 110000;

const state = {
  timeline: 0.04,         // Starts right at Act 1 (Screenshot 1 Kun Whale)
  targetTimeline: null,
  isPlaying: true,
  playSpeed: 0.018,       // Smooth ~55 second cycle so Act 1 stays clearly visible on load
  turbulence: 1.0,
  densityRatio: 1.0,
  windSpeed: 1.0,
  cameraMode: 'narrative',
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

// 30-degree telephoto lens matches the compressed documentary perspective of the reference video
const camera = new THREE.PerspectiveCamera(
  30,
  window.innerWidth / window.innerHeight,
  0.5,
  600
);
camera.position.copy(NARRATIVE_STAGES[0].camPos);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.maxPolarAngle = Math.PI * 0.55;
controls.minPolarAngle = Math.PI * 0.35;
controls.minDistance = 30;
controls.maxDistance = 180;
controls.target.copy(NARRATIVE_STAGES[0].camLookAt);

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
// 1. Overcast Documentary Sky & Soft Misty Sea Horizon Shader
// ============================================================================
function createAtmosphericSky() {
  const skyGeo = new THREE.SphereGeometry(360, 48, 32);
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

      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
      }

      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        return mix(
          mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
          mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
          f.y
        );
      }

      float fbm(vec2 p) {
        float v = 0.0;
        float a = 0.5;
        mat2 rot = mat2(0.8, -0.6, 0.6, 0.8);
        for (int i = 0; i < 5; i++) {
          v += a * noise(p);
          p = rot * p * 2.02;
          a *= 0.5;
        }
        return v;
      }

      void main() {
        vec3 dir = normalize(vWorldPos);
        // dir.y is around 0 at horizon; map [-0.3, +0.4] smoothly
        float y = dir.y;

        // Exact colors sampled from reference screenshot 1 (2026-11-21_12_34_39.png):
        // Sky background: #a8cbe9 (RGB 0.66, 0.79, 0.91)
        // Upper cloud patches: #83a8cc (RGB 0.51, 0.66, 0.80)
        // Bottom misty sea horizon band: #6b8fb2 -> #4d6b88
        vec3 deepSeaMist = vec3(0.35, 0.48, 0.62);
        vec3 seaHorizon  = vec3(0.54, 0.70, 0.85);
        vec3 mainSky     = vec3(0.67, 0.80, 0.92);
        vec3 upperSky    = vec3(0.60, 0.75, 0.89);

        // Soft diffused horizontal sea-mist gradient near the very bottom of the frame (y ~ -0.18)
        vec3 col = mix(deepSeaMist, seaHorizon, smoothstep(-0.24, -0.16, y));
        col = mix(col, mainSky, smoothstep(-0.17, -0.10, y));
        col = mix(col, upperSky, smoothstep(0.05, 0.35, y));

        // Soft overcast cloud patches in the upper portion (matching screenshot 1 & 2 top clouds)
        vec2 cloudUV = vec2(dir.x * 2.8 + uTime * 0.012 * uWindSpeed, dir.y * 6.5);
        float c1 = fbm(cloudUV);
        float c2 = fbm(cloudUV * 1.9 - vec2(uTime * 0.008, 2.1));
        float cloudPatch = smoothstep(0.47, 0.76, c1 * 0.65 + c2 * 0.35);

        // Large soft cloud shadow on upper right and upper left
        vec3 cloudColor = vec3(0.49, 0.64, 0.79);
        float upperMask = smoothstep(-0.02, 0.14, y);
        col = mix(col, cloudColor, cloudPatch * upperMask * 0.62);

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
// 2. Exact Silhouette Profile Functions for Kun (巨鯤) & Peng (大鵬)
// ============================================================================
/**
 * KUN (巨鯤) 2D/3D Profile Curve matching Screenshot 1 (2026-11-21_12_34_39.png)
 * and Screenshot 2 (2026-11-21_12_35_08.png):
 *
 * - Leading Snout at X = -25.5, Y = +0.8 (crisp pointed whale rostrum)
 * - Main Whale Body from X = -25.5 to X = +11.5:
 *   - Dorsal (top) outline: rises slightly from +0.8 at snout to a flat/gently arched
 *     dark dorsal ridge around Y = +2.1, then slopes down toward Y = -2.2 at X = +11.5.
 *   - Ventral (belly) outline: drops steeply from the snout (+0.8) into a deep, full,
 *     convex baleen-whale belly reaching Y = -6.8 around X = -4..+2, then curves back up
 *     smoothly to the narrow caudal waist (Y = -3.8) at X = +11.5.
 * - Caudal Peduncle (waist) at X = +11.5 (strictly thick, ~1.8 units tall, NEVER pinches to a line!)
 * - Trailing Tail Fluke Stream from X = +11.5 to X = +33.0:
 *   - Sweeps upward and rightward from Y = -3.0 at waist to Y = +0.5 at X = +33.0,
 *     with a secondary lower wispy fin/vortex stream splitting down toward Y = -6.5.
 */
function sampleKunPoint(i, total) {
  const rGroup = Math.random();

  // Single lone dark scout bird hovering above the whale's back (exact match to Screenshot 1!)
  if (i === total - 1) {
    return { x: -3.2, y: 5.4, z: 2.0, densityRole: 0.02, isScout: true };
  }

  if (rGroup < 0.84) {
    // Longitudinal coordinate u in [0, 1] from sharp snout (-25.2) to right tail stream (+33.5)
    const isBody = Math.random() < 0.79;
    const u = isBody
      ? Math.pow(Math.random(), 0.90) * 0.63
      : 0.63 + Math.pow(Math.random(), 1.05) * 0.37;

    const x = -25.2 + u * 58.7; // -25.2 .. +33.5

    let topY, botY, halfZ;

    if (u <= 0.63) {
      // Main Whale Body (u: 0 -> 0.63, x: -25.2 -> +11.8)
      const s = u / 0.63; // 0..1 along whale body

      // Sharp pointed rostrum/snout tip at s = 0 (y = +0.75)
      // Dorsal line: nearly horizontal from snout to mid-back, gently rising to +1.85 around s=0.45,
      // then sloping smoothly down toward the caudal peduncle waist (y = -2.2 at s=1.0)
      const dorsalArch = Math.sin(Math.pow(s, 0.75) * Math.PI) * 1.15;
      const rearDrop = Math.pow(Math.max(0, (s - 0.50) / 0.50), 1.55) * 3.1;
      topY = 0.75 + dorsalArch - rearDrop;

      // Ventral belly line: starts right at the sharp snout tip (0.75 at s=0) so the nose is razor-pointed!
      // Sweeps down at a ~42-degree chin angle into a long, smooth baleen-whale belly reaching Y = -5.6,
      // then curves up smoothly to the waist (y = -3.85 at s=1.0).
      const chinAndBelly = Math.pow(Math.sin(Math.pow(s, 0.68) * Math.PI), 0.78);
      const baseLine = 0.75 * (1.0 - Math.pow(s, 0.65)) + (-3.85) * Math.pow(s, 0.65);
      botY = baseLine - 4.45 * chinAndBelly;

      // 3D Z-thickness
      halfZ = 0.25 + 6.2 * Math.sin(Math.pow(s, 0.68) * Math.PI);
    } else {
      // Sweeping Tail Fluke Stream (u: 0.63 -> 1.0, x: +11.8 -> +33.5)
      const t = (u - 0.63) / 0.37; // 0..1 along tail

      // Sweeps gracefully upward and rightward from waist (-3.0) to (+0.35)
      const centerLineY = -3.02 + Math.pow(t, 0.88) * 3.35;
      const halfH = 0.88 * (1.0 - t * 0.58) + Math.sin(t * Math.PI) * 0.25;

      topY = centerLineY + halfH;
      botY = centerLineY - halfH;
      halfZ = 1.1 + t * 3.2;
    }

    // Vertical placement v in [0, 1] between botY and topY
    let v;
    const rEdge = Math.random();
    if (rEdge < 0.26 && u < 0.60) {
      // Signature dark, dense dorsal ridge band along the whale's upper back (Screenshot 1 & 2)
      v = 0.78 + Math.random() * 0.22;
    } else if (rEdge < 0.42) {
      // Crisp lower belly boundary
      v = Math.pow(Math.random(), 1.65) * 0.35;
    } else {
      // Rich, continuous interior volume fill
      v = Math.random();
    }

    // Internal diagonal wave striations (matching the mottled flock bands inside the whale body)
    const striationOffset = Math.sin(x * 0.58 + v * 4.2) * 0.16 * (1.0 - Math.pow(2.0 * v - 1.0, 2));
    const y = botY + v * (topY - botY) + striationOffset;
    const z = (Math.random() - 0.5) * 2.0 * halfZ * Math.sqrt(1.0 - Math.pow(v * 2.0 - 1.0, 2) * 0.65);

    const densityRole = (u > 0.80) ? (0.62 + (u - 0.80) * 1.8) : (rEdge * 0.72);
    return { x, y, z, densityRole: Math.min(0.98, densityRole), isScout: false };

  } else if (rGroup < 0.94) {
    // Secondary Organic Fin Plumes accurately traced from Screenshot 1:
    // Softly connected to the dorsal back and tail, with Gaussian taper at both ends (never rigid bars!)
    const subType = i % 4;
    // Gaussian-like bell distribution along the plume length
    const t = Math.random();
    const bell = Math.sin(t * Math.PI);
    const gaussSpread = (Math.random() + Math.random() + Math.random() - 1.5) * 0.65;

    if (subType === 0 || subType === 1) {
      // Soft secondary dorsal mist layer emerging smoothly from the rear dorsal back (x = -1..+12)
      const x = -1.5 + t * 13.5;
      const yCurve = 1.25 - Math.pow(t, 1.25) * 2.15 + Math.sin(t * Math.PI) * 0.35;
      const y = yCurve + gaussSpread * (0.45 + 0.55 * bell);
      const z = (Math.random() - 0.5) * 3.8 * bell;
      return { x, y, z, densityRole: 0.72 + (1.0 - bell) * 0.26, isScout: false };
    } else if (subType === 2) {
      // Lower bifurcated tail fin wisp branching softly from the main tail stream (x = +19..+28.5)
      const x = 19.0 + t * 9.5;
      const yCurve = -2.25 + t * 1.15 - Math.sin(t * Math.PI) * 0.28;
      const y = yCurve + gaussSpread * (0.35 + 0.45 * bell);
      const z = (Math.random() - 0.5) * 2.8 * bell;
      return { x, y, z, densityRole: 0.74 + (1.0 - bell) * 0.24, isScout: false };
    } else {
      // Very faint, delicate smoke-like wisp in the lower right sky (x = +13.5..+18.0, y = -7.8..-9.2)
      // Only uses 25% of this bucket so it's a subtle ghostly trace just like Screenshot 1
      if (Math.random() < 0.72) {
        // Put the rest back into the main tail stream for extra lush tail feathers
        const x = 11.5 + t * 21.5;
        const y = -3.0 + Math.pow(t, 0.88) * 3.35 + gaussSpread * 0.85;
        const z = (Math.random() - 0.5) * 3.5;
        return { x, y, z, densityRole: 0.68 + t * 0.28, isScout: false };
      }
      const x = 14.2 + t * 3.8;
      const y = -8.0 - t * 1.15 + gaussSpread * (0.28 * bell + 0.12);
      const z = (Math.random() - 0.5) * 1.8;
      return { x, y, z, densityRole: 0.91 + (1.0 - bell) * 0.08, isScout: false };
    }

  } else {
    // Soft atmospheric boundary mist tightly hugging the whale contour
    const s = Math.pow(Math.random(), 0.9);
    const x = -24.5 + s * 54.0;
    const centerY = s < 0.63 ? (-1.8 - Math.sin((s / 0.63) * Math.PI) * 1.5) : (-2.6 + ((s - 0.63) / 0.37) * 2.8);
    const spreadY = s < 0.63 ? (0.8 + Math.sin((s / 0.63) * Math.PI) * 3.1) : 1.1;
    const y = centerY + (Math.random() - 0.5) * 2.0 * spreadY;
    const z = (Math.random() - 0.5) * 7.5;
    return { x, y, z, densityRole: 0.84 + Math.random() * 0.15, isScout: false };
  }
}

/**
 * PENG (大鵬) 2D/3D Profile Curve matching Screenshot 4 (2026-11-21_13_18_14.png)
 * and Screenshot 5 (2026-11-21_13_18_38.png):
 *
 * Centered around camera X = 44..46 so it soars directly above the open-field utility poles!
 * - Far-left razor-sharp wingtip at X = +12.0, Y = +2.8
 * - Long straight/gently curved upper wing leading edge spanning from X = +12.0 to X = +76.0
 * - Three dramatic descending cloud-wing tiers on the lower right (X = +40..+72, Y = 0..-10.5)
 *   right above the utility poles and bird nest ("怒而飛，其翼若垂天之雲").
 */
function samplePengPoint(i, total) {
  if (i === total - 1) {
    // High lone scout bird in the upper right sky (exact match to Screenshot 5 upper-right bird!)
    return { x: 59.5, y: 9.2, z: 3.0 };
  }
  if (i === total - 2) {
    // Mid-sky lone bird slightly above the leading wing edge (Screenshot 5 center-left tiny bird)
    return { x: 40.5, y: 2.6, z: 2.0 };
  }

  const r = Math.random();

  if (r < 0.58) {
    // 1. Main Sweeping Wing Blade & Dense Upper Leading Edge (X: +12.0 to +74.0)
    const s = Math.pow(Math.random(), 0.92); // 0 at left wingtip (+12), 1 at far right wing (+74)
    const x = 12.0 + s * 62.0;

    // Upper leading edge: starts at Y = +2.6 on left tip, dips slightly in center (+0.2), rises to +0.8 on right
    const topY = 2.6 - Math.sin(s * Math.PI * 0.78) * 2.2 - s * 0.4;

    // Thickness of the main wing blade: razor-thin at left tip (0.35), swells into a deep chest/wing-belly
    let thickness;
    if (s < 0.52) {
      thickness = 0.35 + Math.pow(s / 0.52, 1.35) * 4.8;
    } else {
      thickness = 5.15 * (1.0 - Math.pow((s - 0.52) / 0.48, 1.1) * 0.65);
    }

    const botY = topY - thickness;
    const v = Math.pow(Math.random(), 0.85);
    const y = botY + v * (topY - botY);
    const z = (Math.random() - 0.5) * (1.0 + s * 10.0);

    return { x, y, z };

  } else if (r < 0.86) {
    // 2. Second Tier: Massive Central Belly / Cloud-Wing Lobe (Screenshot 4 & 5 dark lower-middle mass)
    const s = Math.random(); // spans X = +38.0 to +66.0
    const x = 38.0 + s * 28.0;

    const topY = -2.2 - s * 1.4;
    const lobeDepth = 4.6 * Math.sin(Math.pow(s, 0.75) * Math.PI);
    const botY = topY - (0.8 + lobeDepth);

    const v = Math.random();
    const y = botY + v * (topY - botY);
    const z = (Math.random() - 0.5) * 9.0;

    return { x, y, z };

  } else {
    // 3. Third Tier: Lower Trailing Cloud-Feathers hovering right above the utility poles (Screenshot 5 bottom-right)
    const s = Math.random(); // spans X = +45.0 to +68.0
    const x = 45.0 + s * 23.0;

    const topY = -6.2 - s * 1.2;
    const depth = 3.2 * Math.sin(s * Math.PI);
    const botY = topY - (0.6 + depth);

    const y = botY + Math.random() * (topY - botY);
    const z = (Math.random() - 0.5) * 7.5;

    return { x, y, z };
  }
}

function buildMurmurationGeometry(count) {
  const geometry = new THREE.BufferGeometry();

  const posKun = new Float32Array(count * 3);
  const posPeng = new Float32Array(count * 3);
  const birdSeeds = new Float32Array(count * 4); // x: phase, y: speed, z: densityRole, w: scale

  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    const i4 = i * 4;

    const kun = sampleKunPoint(i, count);
    const peng = samplePengPoint(i, count);

    posKun[i3]     = kun.x;
    posKun[i3 + 1] = kun.y;
    posKun[i3 + 2] = kun.z;

    posPeng[i3]     = peng.x;
    posPeng[i3 + 1] = peng.y;
    posPeng[i3 + 2] = peng.z;

    birdSeeds[i4]     = Math.random() * Math.PI * 2.0;
    birdSeeds[i4 + 1] = 0.75 + Math.random() * 0.65;
    birdSeeds[i4 + 2] = kun.densityRole;
    birdSeeds[i4 + 3] = kun.isScout ? 3.8 : (0.85 + Math.random() * 0.90);
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(posKun, 3));
  geometry.setAttribute('aPosKun', new THREE.BufferAttribute(posKun, 3));
  geometry.setAttribute('aPosPeng', new THREE.BufferAttribute(posPeng, 3));
  geometry.setAttribute('aSeed', new THREE.BufferAttribute(birdSeeds, 4));

  return geometry;
}

// ============================================================================
// 3. Custom WebGL Shader for 110,000 Birds with Internal Density Waves
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

      float densityFade = smoothstep(uDensityLimit, uDensityLimit - 0.08, role * 0.92);

      // Progressive head-to-tail morphing wave from Kun (uMorph < 0.35) to Peng (uMorph > 0.65)
      float xNorm = clamp((aPosKun.x + 26.0) / 58.0, 0.0, 1.0);
      float localMorph = smoothstep(0.32 + xNorm * 0.14, 0.62 + xNorm * 0.14, uMorph);

      // Act 2 ("鯤之大，不知其幾千里也"): Kun elongates and streamlines like Screenshot 2 & 3
      vec3 kunPos = aPosKun;
      float act2Stretch = smoothstep(0.16, 0.38, uMorph) * (1.0 - localMorph);
      kunPos.x *= (1.0 + act2Stretch * 0.28);
      kunPos.y *= (1.0 - act2Stretch * 0.22);

      vec3 pos = mix(kunPos, aPosPeng, localMorph);

      // Act 3 ("化而爲鳥"): Swirling metamorphosis vortex
      float metamorphosisBell = sin(localMorph * 3.14159265);
      float tFlow = uTime * 0.42 * uWindSpeed;

      // Internal turbulence stays tightly bounded in Acts 1-2 & 4-5 so the Kun whale and
      // Peng bird profiles match the reference photos with crisp contours!
      vec3 swirl = curlSwirl(pos * 0.11, tFlow);
      float baseDisplacement = 0.28 + 0.45 * smoothstep(0.55, 1.0, role);
      float vortexSurge = metamorphosisBell * 4.8;
      pos += swirl * (baseDisplacement + vortexSurge) * uTurbulence;

      // Subtle living breathing wave along the body
      float bodyWave = sin(pos.x * 0.11 - uTime * 1.25 * uWindSpeed) * 0.16;
      pos.y += bodyWave;

      // Individual wing-flapping oscillation
      float flapFreq = 10.0 + speed * 5.0;
      vFlapPhase = uTime * flapFreq + phase * 6.2831;
      pos.y += sin(vFlapPhase) * 0.04;

      vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
      gl_Position = projectionMatrix * mvPosition;

      float dist = max(-mvPosition.z, 10.0);
      gl_PointSize = (205.0 / dist) * scale * uPixelRatio;

      // Internal Diagonal Density Striations (recreates the dark/light undulating bands
      // inside the whale body seen in Screenshot 1 & 2)
      float striation = sin(pos.x * 0.55 + pos.y * 1.15 - tFlow * 2.4) * 0.5 + 0.5;
      float noiseWave = noise3(pos * 0.18 - vec3(tFlow * 1.5, 0.0, 0.0));
      vShade = clamp(striation * 0.45 + noiseWave * 0.55, 0.0, 1.0);

      vTilt = sin(phase + uTime * 1.2 + pos.x * 0.06) * 0.38;

      // Core & dorsal ridge birds have rich smoky opacity; trailing tail wisps fade softly into the sky
      float baseAlpha = mix(0.58, 0.16, smoothstep(0.42, 0.98, role));
      vAlpha = baseAlpha * densityFade;
    }
  `,
  fragmentShader: /* glsl */ `
    varying float vAlpha;
    varying float vFlapPhase;
    varying float vShade;
    varying float vTilt;

    void main() {
      if (vAlpha < 0.01) discard;

      vec2 uv = gl_PointCoord * 2.0 - 1.0;

      float c = cos(vTilt);
      float s = sin(vTilt);
      vec2 p = vec2(c * uv.x - s * uv.y, s * uv.x + c * uv.y);

      // Wing flapping profile (V-upstroke to M-downstroke starling silhouette)
      float flap = sin(vFlapPhase);
      float absX = abs(p.x);
      float wingCurve = -flap * 0.48 * pow(absX, 1.35) + 0.10 * absX;

      float wingThickness = mix(0.32, 0.06, smoothstep(0.0, 0.95, absX));
      float dy = abs(p.y - wingCurve);

      float birdMask = (1.0 - smoothstep(wingThickness * 0.35, wingThickness, dy))
                     * (1.0 - smoothstep(0.72, 1.0, absX));

      if (birdMask < 0.05) discard;

      // Exact documentary color matching: slate charcoal darks + misty blue-grey midtones
      vec3 darkSlate = vec3(0.16, 0.25, 0.35);
      vec3 mistyBlue = vec3(0.42, 0.56, 0.71);
      vec3 birdColor = mix(darkSlate, mistyBlue, vShade * 0.72);

      gl_FragColor = vec4(birdColor, birdMask * vAlpha);
    }
  `
});

const murmurationGeometry = buildMurmurationGeometry(TOTAL_BIRDS);
const murmurationPoints = new THREE.Points(murmurationGeometry, murmurationMaterial);
scene.add(murmurationPoints);

// ============================================================================
// 4. Documentary Foreground Anchors (Exact Framing for Screenshots 1 & 4-5)
// ============================================================================
function createDocumentaryForeground() {
  const fgGroup = new THREE.Group();

  const darkWoodMat = new THREE.MeshBasicMaterial({ color: 0x1a1512 });
  const darkSilhouetteMat = new THREE.MeshBasicMaterial({ color: 0x141b22 });
  const whiteJacketMat = new THREE.MeshBasicMaterial({ color: 0xd8e4f0 });
  const wireMat = new THREE.LineBasicMaterial({
    color: 0x1b2530,
    transparent: true,
    opacity: 0.82
  });

  function createWeatheredRoofMaterial() {
    const texCanvas = document.createElement('canvas');
    texCanvas.width = 256;
    texCanvas.height = 256;
    const ctx = texCanvas.getContext('2d');

    ctx.fillStyle = '#3a3734';
    ctx.fillRect(0, 0, 256, 256);

    for (let y = 0; y < 256; y += 8) {
      ctx.fillStyle = (y % 16 === 0) ? '#292522' : '#4a4845';
      ctx.fillRect(0, y, 256, 3);
      for (let k = 0; k < 18; k++) {
        const rx = Math.random() * 256;
        const rw = 6 + Math.random() * 18;
        ctx.fillStyle = Math.random() > 0.45 ? '#6e7b85' : '#231f1c';
        ctx.fillRect(rx, y + 1, rw, 5);
      }
    }

    const texture = new THREE.CanvasTexture(texCanvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 2);
    return new THREE.MeshBasicMaterial({ map: texture });
  }

  // --------------------------------------------------------------------------
  // B. Coastal Viewing Pavilion (觀海涼亭 — Screenshot 1 Bottom-Right Corner)
  // Raised to Y = -7.85 so the 4 pillars, seated/standing crowd with white hoodies,
  // and weathered shingle roof are all prominently visible above the bottom edge!
  // --------------------------------------------------------------------------
  const pavilion = new THREE.Group();
  pavilion.position.set(18.6, -7.85, 40.0);
  pavilion.scale.setScalar(1.08);

  // Lower solid wooden railing / deck base
  const deckBase = new THREE.Mesh(new THREE.BoxGeometry(6.2, 1.8, 4.2), darkWoodMat);
  deckBase.position.y = -1.65;
  pavilion.add(deckBase);

  // 4 Vertical Timber Columns (open frame with sky shining through behind them!)
  const colX = [-2.4, -1.05, 0.35, 1.75];
  colX.forEach((cx) => {
    const col = new THREE.Mesh(new THREE.BoxGeometry(0.24, 1.85, 0.24), darkWoodMat);
    col.position.set(cx, 0.05, 1.4);
    pavilion.add(col);
  });

  // Crowd of spectators inside the pavilion watching the Kun whale (with white-hoodie figures like Screenshot 1!)
  const crowdData = [
    { x: -2.65, h: 0.62, white: false },
    { x: -2.15, h: 0.68, white: true },
    { x: -1.75, h: 0.65, white: false },
    { x: -1.42, h: 0.72, white: true },
    { x: -0.75, h: 0.66, white: false },
    { x: -0.35, h: 0.70, white: false },
    { x: 0.05,  h: 0.64, white: false },
    { x: 0.75,  h: 0.68, white: false },
    { x: 1.25,  h: 0.65, white: true }
  ];
  crowdData.forEach((person) => {
    const torsoMat = person.white ? whiteJacketMat : darkWoodMat;
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.26, person.h, 0.22), torsoMat);
    torso.position.set(person.x, -0.75 + person.h * 0.5, 1.35);
    pavilion.add(torso);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 8), darkWoodMat);
    head.position.set(person.x, -0.75 + person.h + 0.09, 1.35);
    pavilion.add(head);
  });

  // Upper eave fascia beam
  const eaveBeam = new THREE.Mesh(new THREE.BoxGeometry(6.8, 0.24, 4.8), darkWoodMat);
  eaveBeam.position.y = 0.92;
  pavilion.add(eaveBeam);

  // Pyramidal Hipped Shingle Roof (亭頂)
  const roofMat = createWeatheredRoofMaterial();
  const roofGeo = new THREE.ConeGeometry(4.7, 2.15, 4);
  roofGeo.rotateY(Math.PI * 0.25);
  const roofMesh = new THREE.Mesh(roofGeo, roofMat);
  roofMesh.scale.set(1.15, 1.0, 0.85);
  roofMesh.position.y = 2.08;
  pavilion.add(roofMesh);

  fgGroup.add(pavilion);

  // --------------------------------------------------------------------------
  // C. Subtle Bottom-Edge Treeline Scrub (Only the very top tips peeking at bottom edge,
  // leaving the left horizon open misty sea just like Screenshot 1!)
  // --------------------------------------------------------------------------
  const scrubGroup = new THREE.Group();
  for (let k = 0; k < 42; k++) {
    const tx = 1.0 + k * 0.45 + (Math.random() - 0.5) * 0.2;
    const ty = -11.35 + Math.sin(k * 0.7) * 0.12;
    const scrub = new THREE.Mesh(
      new THREE.DodecahedronGeometry(0.22 + (k % 3) * 0.08, 0),
      darkSilhouetteMat
    );
    scrub.scale.set(1.8, 0.7, 1.0);
    scrub.position.set(tx, ty, 40.0);
    scrubGroup.add(scrub);
  }
  fgGroup.add(scrubGroup);

  // --------------------------------------------------------------------------
  // D. Open-Field Utility Poles, Osprey Bird Nest & Perched Birds on Wires
  // (Visible in Acts 4 & 5 when camera pans right to X = 42..46, matching Screenshots 4 & 5)
  // --------------------------------------------------------------------------
  const polesGroup = new THREE.Group();

  function addUtilityPole(x, yBase, z, scale, hasNest = false) {
    const unit = new THREE.Group();
    unit.position.set(x, yBase, z);
    unit.scale.setScalar(scale);

    const poleH = 7.6;
    const leftPole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.11, poleH, 8), darkSilhouetteMat);
    leftPole.position.set(-0.75, poleH * 0.5, 0);
    unit.add(leftPole);

    const rightPole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.11, poleH, 8), darkSilhouetteMat);
    rightPole.position.set(0.75, poleH * 0.5, 0);
    unit.add(rightPole);

    // Double horizontal crossbars
    const bar1 = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.09, 0.09), darkSilhouetteMat);
    bar1.position.set(0, poleH - 0.85, 0);
    unit.add(bar1);

    const bar2 = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.08, 0.08), darkSilhouetteMat);
    bar2.position.set(0, poleH - 1.75, 0);
    unit.add(bar2);

    // Insulator pins & perched birds on crossbars
    for (let p = -1.3; p <= 1.3; p += 0.52) {
      const pin = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.22, 0.06), darkSilhouetteMat);
      pin.position.set(p, poleH - 0.72, 0);
      unit.add(pin);
    }

    // Large Osprey / Stork Nest perched atop the right pole (Screenshot 4 & 5 signature landmark!)
    if (hasNest) {
      const nest = new THREE.Group();
      nest.position.set(0.75, poleH - 0.72, 0);
      for (let n = 0; n < 12; n++) {
        const twig = new THREE.Mesh(
          new THREE.DodecahedronGeometry(0.28 + (n % 3) * 0.09, 0),
          darkSilhouetteMat
        );
        twig.scale.set(1.65, 0.72, 1.2);
        twig.position.set(
          Math.sin(n * 2.1) * 0.28,
          Math.cos(n * 1.7) * 0.14,
          Math.sin(n * 3.1) * 0.18
        );
        nest.add(twig);
      }
      unit.add(nest);
    }

    polesGroup.add(unit);
    return new THREE.Vector3(x, yBase + (poleH - 0.9) * scale, z);
  }

  // Placed at X = 37..66 so they are completely off-screen in Act 1 (camera X=0, max visible X=20),
  // and enter the bottom-right frame during Acts 4 & 5 (camera X=42..46)!
  const pt1 = addUtilityPole(37.5, -14.8, 40.0, 0.45, false);
  const pt2 = addUtilityPole(43.5, -14.6, 40.0, 0.55, false);
  const pt3 = addUtilityPole(50.2, -14.2, 40.0, 0.68, false);
  const pt4 = addUtilityPole(59.8, -14.0, 40.0, 0.95, true);  // Prominent foreground H-pole with bird nest!
  const pt5 = addUtilityPole(66.5, -13.8, 40.0, 1.00, false);

  const poleTops = [pt1, pt2, pt3, pt4, pt5];
  const perchedBirdGeo = new THREE.BoxGeometry(0.09, 0.15, 0.07);

  for (let i = 0; i < poleTops.length - 1; i++) {
    const a = poleTops[i];
    const b = poleTops[i + 1];

    [-0.9, 0.0, 0.9].forEach((offsetX, wIdx) => {
      const pts = [];
      const segs = 22;
      for (let s = 0; s <= segs; s++) {
        const t = s / segs;
        const wx = a.x + offsetX * 0.4 + (b.x + offsetX * 0.7 - (a.x + offsetX * 0.4)) * t;
        const wz = a.z + (b.z - a.z) * t;
        const sag = Math.sin(t * Math.PI) * (0.35 + i * 0.18);
        const wy = a.y + (b.y - a.y) * t - sag - wIdx * 0.28;
        pts.push(new THREE.Vector3(wx, wy, wz));

        // Tiny birds perched in rows along the wires (Screenshot 4 & 5 bottom-right detail)
        if (i >= 2 && s > 1 && s < segs - 1 && ((s + wIdx * 2) % 2 === 0)) {
          const bird = new THREE.Mesh(perchedBirdGeo, darkSilhouetteMat);
          bird.position.set(wx, wy + 0.08, wz);
          polesGroup.add(bird);
        }
      }
      const lineGeo = new THREE.BufferGeometry().setFromPoints(pts);
      polesGroup.add(new THREE.Line(lineGeo, wireMat));
    });
  }

  fgGroup.add(polesGroup);
  scene.add(fgGroup);
  return fgGroup;
}

createDocumentaryForeground();

// ============================================================================
// 5. Procedural Web Audio API Soundscape (Northern Ocean Wind & 110,000 Wings)
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
  if (t < 0.22) return 0;
  if (t < 0.42) return 1;
  if (t < 0.62) return 2;
  if (t < 0.82) return 3;
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

  murmurationUniforms.uTime.value = elapsed;
  murmurationUniforms.uMorph.value = state.timeline;
  skyMaterial.uniforms.uTime.value = elapsed;

  const breathX = Math.sin(elapsed * 0.5) * 0.15;
  const breathY = Math.cos(elapsed * 0.38) * 0.10;

  if (state.cameraMode === 'narrative') {
    computeNarrativeCamera(state.timeline, tempCamPos, tempLookAt);
    tempCamPos.x += breathX;
    tempCamPos.y += breathY;
    camera.position.lerp(tempCamPos, Math.min(1.0, dt * 3.0));
    controls.target.lerp(tempLookAt, Math.min(1.0, dt * 3.0));
  } else if (CAMERA_PRESETS[state.cameraMode]) {
    const preset = CAMERA_PRESETS[state.cameraMode];
    tempCamPos.copy(preset.pos);
    tempCamPos.x += breathX;
    tempCamPos.y += breathY;
    camera.position.lerp(tempCamPos, Math.min(1.0, dt * 3.5));
    controls.target.lerp(preset.target, Math.min(1.0, dt * 3.5));
  }

  controls.update();
  soundscape.update(elapsed, state.timeline, state.windSpeed, state.turbulence);
  renderer.render(scene, camera);
}

// Initialize UI readouts
ui.particleReadout.textContent = '110,000 羽';
ui.valDensity.textContent = '110,000';
updateStageUI(state.timeline);
animate();
