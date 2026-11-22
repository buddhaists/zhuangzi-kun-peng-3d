/**
 * 《莊子‧逍遙遊》「北冥有魚」— Three.js & WebGL Five-Keyframe Sequential Murmuration Engine
 *
 * Strictly interpolates across the 5 exact morphological stages corresponding to:
 * - 鯤鵬001.png (Stage 0 / t = 0.00): 壹 · 北冥有魚，其名爲鯤 (Full Kun whale + right viewing pavilion)
 * - 鯤鵬002.png (Stage 1 / t = 0.25): 貳 · 鯤之大，不知其幾千里也 (Elongated Kun close-up + diagonal striations, no foreground)
 * - 鯤鵬003.png (Stage 2 / t = 0.50): 叁 · 化而爲鳥，其名爲鵬 (Flattening ribbon wing-stream + faint upper ghost mist + tiny bottom treetops)
 * - 鯤鵬004.png (Stage 3 / t = 0.75): 肆 · 鵬之背，不知其幾千里也 (Colossal sweeping Peng wing + deep descending belly + utility poles & nest)
 * - 鯤鵬005.png (Stage 4 / t = 1.00): 伍 · 怒而飛，其翼若垂天之雲 (Three-tiered hanging cloud-wings + receding utility poles & perched birds)
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// ============================================================================
// Five Narrative Keyframes (1:1 Mapped to 鯤鵬001.png ~ 鯤鵬005.png)
// ============================================================================
const NARRATIVE_STAGES = [
  {
    id: 0,
    refImage: '鯤鵬001.png',
    shortTitle: '壹 · 北冥潛鯤 (001)',
    verse: '北冥有魚，其名爲鯤。',
    caption: '【對應 鯤鵬001】遠海觀景涼亭外，十萬飛鳥凝聚成巨鯤之形：魚吻朝左破風前行，背脊深邃平緩、魚腹飽滿圓潤、尾翼流線延展。',
    targetT: 0.00,
    camPos: new THREE.Vector3(0.0, 0.0, 82.0),
    camLookAt: new THREE.Vector3(0.0, 0.0, 0.0)
  },
  {
    id: 1,
    refImage: '鯤鵬002.png',
    shortTitle: '貳 · 幾千里也 (002)',
    verse: '鯤之大，不知其幾千里也。',
    caption: '【對應 鯤鵬002】巨鯤迎風向前疾馳推進，修長身軀橫貫天際，左側銳利魚吻刺破冷風，內部鳥群如海流般向後奔涌、層層幻化。',
    targetT: 0.25,
    camPos: new THREE.Vector3(-60.0, 0.0, 82.0),
    camLookAt: new THREE.Vector3(-60.0, 0.0, 0.0)
  },
  {
    id: 2,
    refImage: '鯤鵬003.png',
    shortTitle: '叁 · 化而爲鳥 (003)',
    verse: '化而爲鳥，其名爲鵬。',
    caption: '【對應 鯤鵬003】向前飛馳中巨鯤腹尾收束壓平、翻湧蛻變為橫跨天際的流線型波浪翼帶，下緣凝集如墨，上方散逸出萬千羽霧。',
    targetT: 0.50,
    camPos: new THREE.Vector3(-120.0, 0.0, 82.0),
    camLookAt: new THREE.Vector3(-120.0, 0.0, 0.0)
  },
  {
    id: 3,
    refImage: '鯤鵬004.png',
    shortTitle: '肆 · 鵬之背 (004)',
    verse: '鵬之背，不知其幾千里也；',
    caption: '【對應 鯤鵬004】大鵬展翅向前破空，左翼尖直刺前方天際，寬廣厚重的鵬背與腹部隨氣流劇烈鼓盪傾瀉，氣勢遮天蔽日。',
    targetT: 0.75,
    camPos: new THREE.Vector3(-180.0, 0.0, 82.0),
    camLookAt: new THREE.Vector3(-180.0, 0.0, 0.0)
  },
  {
    id: 4,
    refImage: '鯤鵬005.png',
    shortTitle: '伍 · 垂天之雲 (005)',
    verse: '怒而飛，其翼若垂天之雲。',
    caption: '【對應 鯤鵬005】大鵬乘風向前怒飛，長達千里的巨翼昂揚舒展，下方翻湧分化為三層階梯狀的垂天雲翼，姿態萬千。',
    targetT: 1.00,
    camPos: new THREE.Vector3(-240.0, 0.0, 82.0),
    camLookAt: new THREE.Vector3(-240.0, 0.0, 0.0)
  }
];

const CAMERA_PRESETS = {
  pavilion: {
    pos: new THREE.Vector3(0.0, 0.0, 82.0),
    target: new THREE.Vector3(0.0, 0.0, 0.0),
    snapT: 0.00
  },
  telephoto: {
    pos: new THREE.Vector3(-60.0, 0.0, 82.0),
    target: new THREE.Vector3(-60.0, 0.0, 0.0),
    snapT: 0.25
  },
  poles: {
    pos: new THREE.Vector3(-240.0, 0.0, 82.0),
    target: new THREE.Vector3(-240.0, 0.0, 0.0),
    snapT: 1.00
  }
};

// ============================================================================
// Global State
// ============================================================================
const TOTAL_BIRDS = 110000;

const state = {
  timeline: 0.00,         // Starts strictly at Stage 0 (鯤鵬001.png)
  targetTimeline: null,
  isPlaying: true,
  playSpeed: 0.032,       // Continuous forward flight speed across 0.00 -> 1.00
  pauseTimer: 0.6,        // Brief initial hold before continuous forward flight
  turbulence: 1.0,
  densityRatio: 1.0,
  windSpeed: 1.0,
  cameraMode: 'narrative',
  activeStageIndex: -1,
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

// 30-degree telephoto FOV gives a visible frustum at Z=0 (distance 82) of:
// Y in [-21.97, +21.97], X in [-39.08, +39.08] (at 16:9 aspect)
// And at foreground plane Z=40 (distance 42):
// Y in [-11.25, +11.25], X in [-20.0, +20.0]
const camera = new THREE.PerspectiveCamera(
  30,
  window.innerWidth / window.innerHeight,
  0.5,
  700
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
  const skyGeo = new THREE.SphereGeometry(450, 48, 32);
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: {
      uTime: { value: 0 },
      uWindSpeed: { value: 1.0 },
      uMorph: { value: 0.0 }
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
      uniform float uMorph;

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
        // Compute view-relative vertical angle so horizon stays locked to bottom of frame
        vec3 rel = vWorldPos - cameraPosition;
        vec3 dir = normalize(rel);
        float y = dir.y;

        // Exact sky & bottom mist palette sampled from 鯤鵬001 ~ 鯤鵬005
        vec3 deepSeaMist = vec3(0.37, 0.50, 0.64);
        vec3 seaHorizon  = vec3(0.55, 0.71, 0.86);
        vec3 mainSky     = vec3(0.67, 0.80, 0.92);
        vec3 upperSky    = vec3(0.61, 0.75, 0.89);

        vec3 col = mix(deepSeaMist, seaHorizon, smoothstep(-0.24, -0.17, y));
        col = mix(col, mainSky, smoothstep(-0.18, -0.11, y));
        col = mix(col, upperSky, smoothstep(0.04, 0.32, y));

        // Soft stratus cloud patches in the upper sky (prominent in 鯤鵬001, 002, 003)
        // Drift toward +X relative to view so the left-facing Kun-Peng visibly flies forward into the headwind
        vec2 cloudUV = vec2(dir.x * 3.0 - uTime * 0.024 * uWindSpeed - uMorph * 1.4, dir.y * 6.2);
        float c1 = fbm(cloudUV);
        float c2 = fbm(cloudUV * 1.85 + vec2(uTime * 0.014, -1.7));
        float cloudPatch = smoothstep(0.45, 0.75, c1 * 0.65 + c2 * 0.35);

        // In 鯤鵬003 (uMorph ~ 0.5), upper clouds are slightly more pronounced; in 004/005 sky is smoother
        float cloudStrength = mix(0.62, 0.35, smoothstep(0.55, 0.85, uMorph));
        vec3 cloudColor = vec3(0.49, 0.64, 0.79);
        float upperMask = smoothstep(-0.02, 0.14, y);
        col = mix(col, cloudColor, cloudPatch * upperMask * cloudStrength);

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
// 2. Five-Stage Coherent Parametric Bird Generators (鯤鵬001 ~ 鯤鵬005)
// ============================================================================
// Smooth cubic-Hermite profile through [x, y] control points (sorted by x)
function makeProfile(pts) {
  const n = pts.length;
  return (x) => {
    if (x <= pts[0][0]) return pts[0][1];
    if (x >= pts[n - 1][0]) return pts[n - 1][1];
    let i = 0;
    while (x > pts[i + 1][0]) i++;
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(n - 1, i + 2)];
    const w = p2[0] - p1[0];
    const t = (x - p1[0]) / w;
    const m1 = ((p2[1] - p0[1]) / (p2[0] - p0[0])) * w;
    const m2 = ((p3[1] - p1[1]) / (p3[0] - p1[0])) * w;
    const t2 = t * t;
    const t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * p1[1] + (t3 - 2 * t2 + t) * m1
      + (-2 * t3 + 3 * t2) * p2[1] + (t3 - t2) * m2;
  };
}

// Stage-1 whale silhouette traced from 鯤鵬001.png, shifted up by Y_OFF so the
// whale floats above the bottom control bar while keeping the photo's proportions.
const KUN1 = (() => {
  const Y_OFF = 4.6;
  const lift = (arr) => arr.map(([x, y]) => [x, y + Y_OFF]);
  const top = makeProfile(lift([
    [-24.2, -2.95], [-21.0, -2.35], [-16.0, -2.05], [-8.0, -1.9], [0.0, -1.95],
    [7.0, -2.2], [12.0, -2.65], [16.0, -3.4], [20.0, -4.2], [25.0, -4.55],
    [31.0, -4.35], [37.0, -4.25]
  ]));
  const bot = makeProfile(lift([
    [-24.2, -3.05], [-22.0, -4.6], [-19.8, -6.1], [-16.0, -7.85], [-12.0, -9.2],
    [-6.0, -10.3], [-2.0, -10.7], [3.0, -10.6], [8.0, -9.95], [13.0, -8.6],
    [17.0, -7.3], [21.0, -6.4], [26.0, -5.75], [31.0, -5.3], [37.0, -4.7]
  ]));
  const X0 = -24.2;
  const X1 = 37.0;
  const BINS = 512;
  const cdf = new Float32Array(BINS + 1);
  for (let b = 0; b < BINS; b++) {
    const x = X0 + ((b + 0.5) / BINS) * (X1 - X0);
    cdf[b + 1] = cdf[b] + Math.pow(Math.max(0.05, top(x) - bot(x)), 0.8);
  }
  const total = cdf[BINS];
  const invCdf = (u) => {
    const target = Math.min(0.99999, Math.max(0, u)) * total;
    let lo = 0;
    let hi = BINS;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (cdf[mid] <= target) lo = mid; else hi = mid;
    }
    const f = (target - cdf[lo]) / Math.max(1e-6, cdf[lo + 1] - cdf[lo]);
    return X0 + ((lo + f) / BINS) * (X1 - X0);
  };
  return { top, bot, invCdf };
})();

/**
 * To ensure the transformation from 001 -> 002 -> 003 -> 004 -> 005 is completely
 * coherent and organic (no chaotic scrambling), each bird `i` is assigned normalized
 * material coordinates `(u, v, w, role)` that map smoothly across all 5 keyframes!
 *
 * Since the Kun/Peng head and leading wingtip point LEFT (-X), the flock flies FORWARD
 * toward -X across the 5 stages:
 * - Stage 0 (鯤鵬001): center X =    0.0
 * - Stage 1 (鯤鵬002): center X =  -60.0
 * - Stage 2 (鯤鵬003): center X = -120.0
 * - Stage 3 (鯤鵬004): center X = -180.0
 * - Stage 4 (鯤鵬005): center X = -240.0
 */
function buildFiveStageGeometry(count) {
  const geometry = new THREE.BufferGeometry();

  const pos1 = new Float32Array(count * 3); // 鯤鵬001
  const pos2 = new Float32Array(count * 3); // 鯤鵬002
  const pos3 = new Float32Array(count * 3); // 鯤鵬003
  const pos4 = new Float32Array(count * 3); // 鯤鵬004
  const pos5 = new Float32Array(count * 3); // 鯤鵬005
  const birdSeeds = new Float32Array(count * 4); // x: phase, y: speed, z: role/alphaWeight, w: size

  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    const i4 = i * 4;

    // Coherent longitudinal coordinate u in [0, 1] (left tip to right trailing edge)
    // and vertical coordinate v in [0, 1] (bottom edge to top edge)
    const rGroup = Math.random();
    const uBase = Math.pow(Math.random(), 0.92);

    // Shape vertical distribution so top/bottom edges & internal bands are rich and crisp
    let vBase;
    const rEdge = Math.random();
    if (rEdge < 0.25) {
      vBase = 0.78 + Math.random() * 0.22; // Dense upper ridge
    } else if (rEdge < 0.45) {
      vBase = Math.pow(Math.random(), 1.7) * 0.32; // Dense lower belly edge
    } else {
      vBase = Math.random(); // Continuous interior volume
    }

    const zRand = (Math.random() - 0.5) * 2.0;
    const gauss = (Math.random() + Math.random() + Math.random() - 1.5) * 0.65;
    const isScout1 = (i === count - 1);
    const isScout2 = (i === count - 2);

    // ========================================================================
    // KEYFRAME 1: 鯤鵬001.png (Center X = 0.0)
    // Full Kun Whale hovering above sea horizon, viewing pavilion at bottom-right.
    // Silhouette = continuous spline profiles traced from the reference photo
    // (sharp snout → deep rounded belly → long tapering peduncle → tail tip).
    // ========================================================================
    let x1, y1, z1, roleWeight = 0.35;

    if (isScout1) {
      // Tiny lone bird above the whale's mid-back in 鯤鵬001
      x1 = -5.5; y1 = 6.2; z1 = 2.0; roleWeight = 0.02;
    } else if (isScout2) {
      // Second lone bird tucked into body in 001, emerges in 005
      x1 = -10.0; y1 = -1.0; z1 = 0.0; roleWeight = 0.02;
    } else if (rGroup < 0.87) {
      // Main body: x distributed by inverse-CDF of local body height so the
      // flock density stays visually continuous from snout to tail tip.
      x1 = KUN1.invCdf(uBase);
      const topY = KUN1.top(x1);
      const botY = KUN1.bot(x1);
      const h = topY - botY;

      const striation = Math.sin(x1 * 0.58 + vBase * 4.2) * 0.16 * (1.0 - Math.pow(2.0 * vBase - 1.0, 2));
      y1 = botY + vBase * h + striation;
      const halfZ = 0.35 + h * 0.62;
      z1 = zRand * halfZ * Math.sqrt(Math.max(0.0, 1.0 - Math.pow(vBase * 2.0 - 1.0, 2) * 0.7));
      roleWeight = (x1 > 18.0)
        ? Math.min(0.95, 0.5 + (x1 - 18.0) / 19.0 * 0.4)
        : (rEdge * 0.70);
    } else {
      // Organic dorsal mist & lower tail-fluke wisp in 鯤鵬001
      const t = uBase;
      const bell = Math.sin(t * Math.PI);
      if (i % 3 !== 0) {
        // Faint mist haze rising softly off the rear dorsal ridge (attached, not a separate streak)
        x1 = 3.0 + t * 15.0 + gauss * 0.8;
        y1 = KUN1.top(x1) - 0.25 + Math.abs(gauss) * (0.5 + 0.9 * bell) + bell * 0.2;
        z1 = zRand * 2.4 * bell;
        roleWeight = 0.78 + (1.0 - bell) * 0.2;
      } else {
        // Small soft lower fluke lobe beneath the tail
        x1 = 25.0 + t * 5.5;
        y1 = KUN1.bot(x1) - 0.35 - bell * 0.6 + gauss * (0.35 + 0.4 * bell);
        z1 = zRand * 1.4 * bell;
        roleWeight = 0.75 + (1.0 - bell) * 0.2;
      }
    }

    pos1[i3]     = x1;
    pos1[i3 + 1] = y1;
    pos1[i3 + 2] = z1;

    // ========================================================================
    // KEYFRAME 2: 鯤鵬002.png (Center X = -60.0)
    // Telephoto close-up of elongated Kun whale spanning from X_local = -35.5 (left tip)
    // right off the right edge of the frame (X_local = +39.0)!
    // Prominent dark diagonal density bands inside, dark lower belly band on the right,
    // and delicate upper dorsal mist wisps trailing to the right.
    // ========================================================================
    let x2, y2, z2;
    const cx2 = -60.0;

    if (isScout1 || isScout2) {
      // Tiny bird speck in far upper-right of 鯤鵬002
      x2 = cx2 + 34.5; y2 = 4.6; z2 = 1.0;
    } else if (rGroup < 0.86) {
      const s = uBase; // 0 at sharp left snout (-35.5), 1 at right edge (+39.5)
      const lx = -35.5 + s * 75.0;

      let topY, botY;
      if (s < 0.55) {
        const k = s / 0.55;
        topY = 1.05 + Math.sin(Math.pow(k, 0.65) * Math.PI) * 1.85 - k * 0.6;
      } else {
        const k = (s - 0.55) / 0.45;
        topY = 0.45 - k * 2.1 + Math.sin(k * Math.PI) * 0.4;
      }

      if (s < 0.14) {
        const k = s / 0.14;
        botY = 1.05 - Math.pow(k, 0.82) * 4.85;
      } else if (s < 0.78) {
        const k = (s - 0.14) / 0.64;
        botY = -3.80 - Math.pow(k, 0.95) * 3.45;
      } else {
        const k = (s - 0.78) / 0.22;
        botY = -7.25 + Math.pow(k, 1.1) * 1.75;
      }

      const diagWave = Math.sin(lx * 0.42 + vBase * 5.5) * 0.28;
      x2 = cx2 + lx;
      y2 = botY + vBase * (topY - botY) + diagWave;
      z2 = zRand * (1.2 + Math.sin(s * Math.PI) * 5.0);
    } else {
      const t = uBase;
      const bell = Math.sin(t * Math.PI);
      const branch = i % 2;
      if (branch === 0) {
        const lx = -4.0 + t * 29.0;
        x2 = cx2 + lx;
        y2 = 1.8 + t * 1.55 + gauss * (0.35 * bell + 0.15);
        z2 = zRand * 2.5;
      } else {
        const lx = 2.0 + t * 31.0;
        x2 = cx2 + lx;
        y2 = 0.4 - t * 2.2 + gauss * (0.65 * bell + 0.25);
        z2 = zRand * 3.2;
      }
    }

    pos2[i3]     = x2;
    pos2[i3 + 1] = y2;
    pos2[i3 + 2] = z2;

    // ========================================================================
    // KEYFRAME 3: 鯤鵬003.png (Center X = -120.0)
    // "化而爲鳥，其名爲鵬" — The whale flattens and elongates into a sleek, undulating
    // wing-like ribbon spanning from lx = -30.5 (rounded-pointed left head) all the way
    // to the right edge (lx = +39.5).
    // ========================================================================
    let x3, y3, z3;
    const cx3 = -120.0;

    if (isScout1 || isScout2) {
      x3 = cx3 - 5.2; y3 = 1.9; z3 = 1.0;
    } else if (rGroup < 0.78) {
      const s = uBase;
      const lx = -30.5 + s * 70.0;

      let lowerEdgeY, ribbonThickness;
      if (s < 0.52) {
        const k = s / 0.52;
        lowerEdgeY = -2.1 - Math.pow(k, 0.85) * 4.3 + Math.sin(k * Math.PI * 2.0) * 0.25;
        ribbonThickness = 1.8 * Math.sin(Math.pow(k, 0.55) * Math.PI) + 0.55 + 1.1 * k * k;
      } else {
        const k = (s - 0.52) / 0.48;
        lowerEdgeY = -6.4 + Math.sin(k * Math.PI * 2.2) * 0.55 + k * 0.35;
        ribbonThickness = 1.65 * (1.0 - k * 0.45) + Math.sin(k * Math.PI * 3.0) * 0.3;
      }

      const vBias = Math.pow(vBase, 1.45);
      x3 = cx3 + lx;
      y3 = lowerEdgeY + vBias * ribbonThickness;
      z3 = zRand * (0.8 + ribbonThickness * 1.6);
    } else {
      const t = uBase;
      const lx = -27.5 + t * 42.0;
      // Ride on top of the ribbon's lower edge and taper smoothly to nothing on the right
      const sR = (lx + 30.5) / 70.0;
      const kR = Math.min(1.0, sR / 0.52);
      const ribbonLower = -2.1 - Math.pow(kR, 0.85) * 4.3 + Math.sin(kR * Math.PI * 2.0) * 0.25;
      const taper = Math.pow(1.0 - t, 0.9);
      const domeBot = ribbonLower + 0.4;
      const domeTop = domeBot + 0.3 + (1.4 + Math.sin(t * Math.PI) * 1.2) * taper;
      x3 = cx3 + lx;
      y3 = domeBot + vBase * (domeTop - domeBot) + gauss * 0.35 * taper;
      z3 = zRand * (1.0 + 2.5 * taper);
    }

    pos3[i3]     = x3;
    pos3[i3 + 1] = y3;
    pos3[i3 + 2] = z3;

    // ========================================================================
    // KEYFRAME 4: 鯤鵬004.png (Center X = -180.0)
    // "鵬之背，不知其幾千里也" — Massive sweeping Peng wing & deep descending body!
    // ========================================================================
    let x4, y4, z4;
    const cx4 = -180.0;

    if (isScout1 || isScout2) {
      x4 = cx4 - 7.5; y4 = -7.8; z4 = 2.0;
    } else {
      const s = Math.pow(uBase, 0.88);
      const lx = -37.0 + s * 76.5;

      let topY, botY;
      if (s < 0.65) {
        const k = s / 0.65;
        topY = 0.6 - Math.pow(k, 0.7) * 1.75 + Math.sin(k * Math.PI) * 0.25;
      } else {
        const k = (s - 0.65) / 0.35;
        topY = -1.15 + Math.sin(k * Math.PI * 0.65) * 0.85;
      }

      if (s < 0.28) {
        const k = s / 0.28;
        botY = 0.6 - Math.pow(k, 1.05) * 5.2;
      } else if (s < 0.58) {
        const k = (s - 0.28) / 0.30;
        botY = -4.6 - Math.pow(k, 1.1) * 1.65;
      } else {
        const k = (s - 0.58) / 0.42;
        botY = -6.25 - Math.pow(Math.sin(k * Math.PI * 0.65), 1.15) * 9.2;
      }

      let yVal = botY + vBase * (topY - botY);
      if (s > 0.56 && rEdge < 0.30) {
        const kFold = (s - 0.56) / 0.44;
        yVal = mix(yVal, botY + 0.8 + kFold * 1.2, 0.65);
      }

      const striation4 = Math.sin(lx * 0.48 + vBase * 5.0) * 0.22;
      x4 = cx4 + lx;
      y4 = yVal + striation4;
      z4 = zRand * (0.5 + Math.pow(s, 0.9) * 7.5);
    }

    pos4[i3]     = x4;
    pos4[i3 + 1] = y4;
    pos4[i3 + 2] = z4;

    // ========================================================================
    // KEYFRAME 5: 鯤鵬005.png (Center X = -240.0)
    // "怒而飛，其翼若垂天之雲" — The iconic three-tiered cloud-wing Peng formation!
    // ========================================================================
    let x5, y5, z5;
    const cx5 = -240.0;

    if (isScout1) {
      // Prominent dark lone bird high in upper-right sky of 鯤鵬005!
      x5 = cx5 + 24.8; y5 = 9.2; z5 = 2.0;
    } else if (isScout2) {
      // Second tiny lone bird above center-left wing in 鯤鵬005!
      x5 = cx5 - 4.5; y5 = 1.9; z5 = 1.5;
    } else if (rGroup < 0.56) {
      // Tier 1: Main Upper Wing Blade spanning from left tip (lx = -33.5, y = +2.2) to right tip (lx = +36.5, y = -0.3)
      const s = uBase;
      const lx = -33.5 + s * 70.0;

      // Top leading edge dips smoothly in center and extends flatly to right wingtip
      const topY = 2.2 * Math.pow(1.0 - s, 1.35) - 1.35 * Math.sin(s * Math.PI) - 0.3 * s;

      // Thickness of upper wing blade: sharp at both left tip (0.25) and right tip (0.35),
      // thickest in the middle-right wing root (4.4 units)
      const bladeThick = 0.25 + 4.35 * Math.pow(Math.sin(Math.pow(s, 0.82) * Math.PI), 1.15);
      const botY = topY - bladeThick;

      x5 = cx5 + lx;
      y5 = botY + Math.pow(vBase, 0.88) * (topY - botY);
      z5 = zRand * (0.4 + Math.sin(s * Math.PI) * 5.5);

    } else if (rGroup < 0.84) {
      // Tier 2: Middle Hanging Cloud-Wing Lobe (lx = +2.5 to +27.5, y = -3.8 down to -9.2)
      const s = uBase;
      const lx = 2.5 + s * 25.0;

      const topY = -3.5 - s * 1.2;
      const lobeDepth = 4.6 * Math.sin(Math.pow(s, 0.72) * Math.PI);
      const botY = topY - (0.6 + lobeDepth);

      x5 = cx5 + lx;
      y5 = botY + vBase * (topY - botY);
      z5 = zRand * 4.5;

    } else {
      // Tier 3: Lower Horizontal Cloud Step hovering above the utility poles (lx = +11.5 to +27.0, y = -8.8 to -12.6)
      const s = uBase;
      const lx = 11.5 + s * 15.5;

      const topY = -8.6 - s * 0.6;
      const stepDepth = 3.6 * Math.sin(Math.pow(s, 0.65) * Math.PI);
      const botY = topY - (0.4 + stepDepth);

      // Concentrate a crisp dark horizontal bottom shelf at y ~ -12.3 (seen in 鯤鵬005 bottom of flock!)
      const vStep = (Math.random() < 0.35) ? (Math.random() * 0.25) : vBase;
      x5 = cx5 + lx;
      y5 = botY + vStep * (topY - botY);
      z5 = zRand * 3.5;
    }

    pos5[i3]     = x5;
    pos5[i3 + 1] = y5;
    pos5[i3 + 2] = z5;

    // ========================================================================
    // Per-Bird Attributes
    // ========================================================================
    birdSeeds[i4]     = Math.random() * Math.PI * 2.0;
    birdSeeds[i4 + 1] = 0.75 + Math.random() * 0.65;
    birdSeeds[i4 + 2] = roleWeight;
    birdSeeds[i4 + 3] = (isScout1 || isScout2) ? 4.2 : (0.85 + Math.random() * 0.90);
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(pos1, 3));
  geometry.setAttribute('aPos1', new THREE.BufferAttribute(pos1, 3));
  geometry.setAttribute('aPos2', new THREE.BufferAttribute(pos2, 3));
  geometry.setAttribute('aPos3', new THREE.BufferAttribute(pos3, 3));
  geometry.setAttribute('aPos4', new THREE.BufferAttribute(pos4, 3));
  geometry.setAttribute('aPos5', new THREE.BufferAttribute(pos5, 3));
  geometry.setAttribute('aSeed', new THREE.BufferAttribute(birdSeeds, 4));

  return geometry;
}

function mix(a, b, t) {
  return a + (b - a) * t;
}

// ============================================================================
// 3. Custom WebGL Shader Interpolating Across All 5 Keyframes (aPos1 ~ aPos5)
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
    attribute vec3 aPos1;
    attribute vec3 aPos2;
    attribute vec3 aPos3;
    attribute vec3 aPos4;
    attribute vec3 aPos5;
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

    // Piecewise smooth interpolation across the 5 exact keyframes:
    // t = 0.00 -> aPos1 (鯤鵬001, center X =    0.0)
    // t = 0.25 -> aPos2 (鯤鵬002, center X =  -60.0)
    // t = 0.50 -> aPos3 (鯤鵬003, center X = -120.0)
    // t = 0.75 -> aPos4 (鯤鵬004, center X = -180.0)
    // t = 1.00 -> aPos5 (鯤鵬005, center X = -240.0)
    vec3 sampleFiveStagePosition(float t, out float transitionBell, out float centerX) {
      float scaled = clamp(t, 0.0, 1.0) * 4.0;
      float seg = floor(min(scaled, 3.9999));
      float frac = scaled - seg;
      // Continuous smooth cubic curve with active transition bell between stages
      float s = smoothstep(0.03, 0.97, frac);
      transitionBell = sin(s * 3.14159265);
      centerX = -(seg + s) * 60.0;

      if (seg < 0.5) {
        return mix(aPos1, aPos2, s);
      } else if (seg < 1.5) {
        return mix(aPos2, aPos3, s);
      } else if (seg < 2.5) {
        return mix(aPos3, aPos4, s);
      } else {
        return mix(aPos4, aPos5, s);
      }
    }

    void main() {
      float phase = aSeed.x;
      float speed = aSeed.y;
      float role  = aSeed.z;
      float scale = aSeed.w;

      float densityFade = smoothstep(uDensityLimit, uDensityLimit - 0.08, role * 0.92);

      // Head-to-tail propagation: xNorm = 0 at leading left snout/wingtip, 1 at trailing right tail
      // The leading head initiates every posture & shape transformation first, rippling backward to the tail!
      float xNorm = clamp((aPos1.x + 24.2) / 61.2, 0.0, 1.0);
      float leadLag = (0.35 - xNorm) * 0.048 * sin(uMorph * 3.14159265);
      float delayedMorph = clamp(uMorph + leadLag, 0.0, 1.0);

      float transBell = 0.0;
      float stageCenterX = 0.0;
      vec3 pos = sampleFiveStagePosition(delayedMorph, transBell, stageCenterX);

      // Local coordinate relative to the current flock center (which moves forward from 0 to -240)
      float localX = pos.x - stageCenterX;

      // Keep lone scout birds at their exact composition coordinates
      float scoutLock = step(scale, 3.0);

      // 1. Dynamic 3D Murmuration Swirl & Metamorphosis Billowing ("變化萬千")
      // During forward flight and stage transitions, the flock billows with multi-layered vortex waves
      float tFlow = uTime * 0.58 * uWindSpeed;
      vec3 swirl = curlSwirl(vec3(localX, pos.y, pos.z) * 0.095 + vec3(tFlow * 1.4, 0.0, 0.0), tFlow);
      vec3 fineSwirl = curlSwirl(vec3(localX, pos.y, pos.z) * 0.24 + vec3(tFlow * 2.2, tFlow * 0.5, 0.0), tFlow * 1.7);
      float baseDisplacement = (0.30 + 0.45 * smoothstep(0.45, 1.0, role) + transBell * 1.35) * uTurbulence;
      pos += (swirl * 0.75 + fineSwirl * 0.25) * baseDisplacement * scoutLock;

      // 2. Forward-Flight Posture Undulation (Traveling wave from leading left tip toward trailing right tail)
      // Notice the "+" sign on uTime: phase propagates toward +X (from left head/wingtip to right tail),
      // propelling the Kun/Peng forward toward the left (-X)!
      float travelPhase = localX * 0.14 + uTime * 3.2 * uWindSpeed;
      float tailAmp = smoothstep(-28.0, 36.0, localX); // Subtle at sharp leading snout, sweeping at tail & wings
      float undulationY = sin(travelPhase) * (0.28 + 1.15 * tailAmp + transBell * 0.85);
      float undulationZ = cos(travelPhase * 0.85 + phase * 0.3) * (0.35 + 1.45 * tailAmp + transBell * 1.10);

      // 3. Wing-Spread & Banking Roll Posture during Kun -> Peng Transformation
      // As it transforms into the Peng (uMorph > 0.20), add sweeping wing-beat surge and banking twist
      float pengFactor = smoothstep(0.20, 0.85, uMorph);
      float wingSpanFactor = clamp(abs(localX) / 36.0, 0.0, 1.2);
      float mightyWingBeat = sin(uTime * 2.1 * uWindSpeed - wingSpanFactor * 2.2) * (0.45 + 1.35 * wingSpanFactor) * pengFactor;
      float spiralTwist = sin(uMorph * 12.56637 + xNorm * 4.5 + uTime * 2.4 * uWindSpeed) * transBell * 1.25;

      pos.y += (undulationY + mightyWingBeat + spiralTwist * 0.65) * uTurbulence * scoutLock;
      pos.z += (undulationZ + spiralTwist * 1.15) * uTurbulence * scoutLock;
      // Forward surge oscillation along X
      pos.x += cos(travelPhase + role * 3.14) * (0.22 + transBell * 0.65) * uTurbulence * scoutLock;

      // 4. Individual bird wing-flapping oscillation
      float flapFreq = 11.0 + speed * 5.5;
      vFlapPhase = uTime * flapFreq + phase * 6.2831 - localX * 0.15;
      pos.y += sin(vFlapPhase) * 0.05;

      vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
      gl_Position = projectionMatrix * mvPosition;

      float dist = max(-mvPosition.z, 10.0);
      gl_PointSize = (205.0 / dist) * scale * uPixelRatio;

      // Internal Diagonal Density Striations flowing from leading head (-X) to trailing tail (+X)
      // Using "+ tFlow" so the density waves flow backward (+X) across the body as the Kun-Peng flies forward (-X)!
      float striation = sin(localX * 0.52 + pos.y * 1.15 + tFlow * 4.2) * 0.5 + 0.5;
      float noiseWave = noise3(vec3(localX, pos.y, pos.z) * 0.18 + vec3(tFlow * 2.6, 0.0, 0.0));
      vShade = clamp(striation * 0.48 + noiseWave * 0.52, 0.0, 1.0);

      vTilt = sin(phase + uTime * 1.8 * uWindSpeed + localX * 0.08) * (0.38 + transBell * 0.25);

      // Rich charcoal opacity in core & ridges; soft mist dissipation at trailing edges
      float baseAlpha = mix(0.62, 0.16, smoothstep(0.42, 0.98, role));
      if (scale > 3.0) baseAlpha = 0.92; // Make the lone scout birds crisp and clearly visible
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
      vec3 darkSlate = vec3(0.15, 0.24, 0.34);
      vec3 mistyBlue = vec3(0.42, 0.56, 0.71);
      vec3 birdColor = mix(darkSlate, mistyBlue, vShade * 0.72);

      gl_FragColor = vec4(birdColor, birdMask * vAlpha);
    }
  `
});

const murmurationGeometry = buildFiveStageGeometry(TOTAL_BIRDS);
const murmurationPoints = new THREE.Points(murmurationGeometry, murmurationMaterial);
murmurationPoints.frustumCulled = false;
scene.add(murmurationPoints);

// ============================================================================
// 4. Stage-Aligned Documentary Foreground Landmarks (鯤鵬001 ~ 鯤鵬005)
// ============================================================================
/**
 * Places foreground landmarks at Z = 40 so they align 1:1 with each stage's forward-moving camera center
 * (Cam X = 0 -> -60 -> -120 -> -180 -> -240). As the Kun-Peng flies forward toward the left (-X),
 * foreground landmarks pass naturally beneath it from left to right!
 */
function createDocumentaryForeground() {
  const fgGroup = new THREE.Group();

  const darkWoodMat = new THREE.MeshBasicMaterial({ color: 0x1a1512 });
  const darkSilhouetteMat = new THREE.MeshBasicMaterial({ color: 0x141b22 });
  const whiteJacketMat = new THREE.MeshBasicMaterial({ color: 0xd8e4f0 });
  const wireMat = new THREE.LineBasicMaterial({
    color: 0x1b2530,
    transparent: true,
    opacity: 0.85
  });

  function createWeatheredRoofMaterial() {
    const texCanvas = document.createElement('canvas');
    texCanvas.width = 256;
    texCanvas.height = 256;
    const ctx = texCanvas.getContext('2d');

    // Weathered asphalt-shingle palette sampled from the pavilion roof in 鯤鵬001
    ctx.fillStyle = '#4a433d';
    ctx.fillRect(0, 0, 256, 256);

    for (let y = 0; y < 256; y += 8) {
      ctx.fillStyle = (y % 16 === 0) ? '#2c2622' : '#3d3631';
      ctx.fillRect(0, y, 256, 2);
      for (let k = 0; k < 22; k++) {
        const rx = Math.random() * 256;
        const rw = 4 + Math.random() * 12;
        const r = Math.random();
        ctx.fillStyle = r > 0.66 ? '#7a736b' : (r > 0.33 ? '#5c5249' : '#2a2420');
        ctx.fillRect(rx, y + 2, rw, 5);
      }
    }

    const texture = new THREE.CanvasTexture(texCanvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 2);
    return new THREE.MeshBasicMaterial({ map: texture });
  }

  // --------------------------------------------------------------------------
  // STAGE 0 FOREGROUND (鯤鵬001.png, Cam X = 0): Coastal Viewing Pavilion
  // --------------------------------------------------------------------------
  const pavilion = new THREE.Group();
  pavilion.position.set(18.6, -7.85, 40.0);
  pavilion.scale.setScalar(1.08);

  // Red-brown timber (posts, railing) as seen in 鯤鵬001
  const timberMat = new THREE.MeshBasicMaterial({ color: 0x4b2a22 });

  const deckBase = new THREE.Mesh(new THREE.BoxGeometry(6.2, 1.8, 4.2), darkWoodMat);
  deckBase.position.y = -1.95;
  pavilion.add(deckBase);

  // Railing: top rail + balusters in front of the crowd
  const rail = new THREE.Mesh(new THREE.BoxGeometry(6.2, 0.12, 0.12), timberMat);
  rail.position.set(0, -0.55, 1.62);
  pavilion.add(rail);
  for (let bx = -3.0; bx <= 3.0; bx += 0.3) {
    const baluster = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.55, 0.06), timberMat);
    baluster.position.set(bx, -0.83, 1.62);
    pavilion.add(baluster);
  }

  const colX = [-2.4, -1.05, 0.35, 1.75];
  colX.forEach((cx) => {
    const col = new THREE.Mesh(new THREE.BoxGeometry(0.24, 1.85, 0.24), timberMat);
    col.position.set(cx, 0.05, 1.4);
    pavilion.add(col);
  });

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

  const eaveBeam = new THREE.Mesh(new THREE.BoxGeometry(6.8, 0.24, 4.8), timberMat);
  eaveBeam.position.y = 0.92;
  pavilion.add(eaveBeam);

  const roofMat = createWeatheredRoofMaterial();
  const roofGeo = new THREE.ConeGeometry(4.7, 2.15, 4);
  roofGeo.rotateY(Math.PI * 0.25);
  const roofMesh = new THREE.Mesh(roofGeo, roofMat);
  roofMesh.scale.set(1.15, 1.0, 0.85);
  roofMesh.position.y = 2.08;
  pavilion.add(roofMesh);

  fgGroup.add(pavilion);

  // Subtle bottom treetop tips for Stage 0 (Cam X = 0, X = 1..15) and Stage 2 (鯤鵬003, Cam X = -120, X = -119.5..-105)
  [1.0, -119.5].forEach((baseX) => {
    for (let k = 0; k < 34; k++) {
      const tx = baseX + k * 0.45 + (Math.random() - 0.5) * 0.2;
      const ty = -11.32 + Math.sin(k * 0.7) * 0.12;
      const scrub = new THREE.Mesh(
        new THREE.DodecahedronGeometry(0.22 + (k % 3) * 0.08, 0),
        darkSilhouetteMat
      );
      scrub.scale.set(1.8, 0.7, 1.0);
      scrub.position.set(tx, ty, 40.0);
      fgGroup.add(scrub);
    }
  });

  // Two tiny distant thin mast/pole tips visible at the bottom-left of 鯤鵬003 (Cam X = -120)
  [-128.8, -125.0].forEach((px, idx) => {
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 1.2, 6), darkSilhouetteMat);
    mast.position.set(px, -11.1, 40.0);
    fgGroup.add(mast);
    if (idx === 1) {
      const cross = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.04, 0.04), darkSilhouetteMat);
      cross.position.set(px, -10.55, 40.0);
      fgGroup.add(cross);
    }
  });

  // --------------------------------------------------------------------------
  // Helper to build an authentic H-frame utility pole with crossarms, nest & wires
  // --------------------------------------------------------------------------
  const perchedBirdGeo = new THREE.BoxGeometry(0.11, 0.18, 0.08);

  function addUtilityPole(group, x, yBase, z, scale, hasNest = false) {
    const unit = new THREE.Group();
    unit.position.set(x, yBase, z);
    unit.scale.setScalar(scale);

    const poleH = 7.8;
    const leftPole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.11, poleH, 8), darkSilhouetteMat);
    leftPole.position.set(-0.78, poleH * 0.5, 0);
    unit.add(leftPole);

    const rightPole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.11, poleH, 8), darkSilhouetteMat);
    rightPole.position.set(0.78, poleH * 0.5, 0);
    unit.add(rightPole);

    const bar1 = new THREE.Mesh(new THREE.BoxGeometry(3.3, 0.09, 0.09), darkSilhouetteMat);
    bar1.position.set(0, poleH - 0.85, 0);
    unit.add(bar1);

    const bar2 = new THREE.Mesh(new THREE.BoxGeometry(2.9, 0.08, 0.08), darkSilhouetteMat);
    bar2.position.set(0, poleH - 1.75, 0);
    unit.add(bar2);

    for (let p = -1.35; p <= 1.35; p += 0.54) {
      const pin = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.22, 0.06), darkSilhouetteMat);
      pin.position.set(p, poleH - 0.72, 0);
      unit.add(pin);
    }

    if (hasNest) {
      const nest = new THREE.Group();
      nest.position.set(0.78, poleH - 0.72, 0);
      for (let n = 0; n < 14; n++) {
        const twig = new THREE.Mesh(
          new THREE.DodecahedronGeometry(0.30 + (n % 3) * 0.10, 0),
          darkSilhouetteMat
        );
        twig.scale.set(1.7, 0.75, 1.2);
        twig.position.set(
          Math.sin(n * 2.1) * 0.30,
          Math.cos(n * 1.7) * 0.15,
          Math.sin(n * 3.1) * 0.18
        );
        nest.add(twig);
      }
      unit.add(nest);
    }

    group.add(unit);
    return new THREE.Vector3(x, yBase + (poleH - 0.9) * scale, z);
  }

  function connectPolesWithPerchedBirds(group, poleTops, minDenseIndex = 1) {
    for (let i = 0; i < poleTops.length - 1; i++) {
      const a = poleTops[i];
      const b = poleTops[i + 1];

      [-0.85, 0.0, 0.85].forEach((offsetX, wIdx) => {
        const pts = [];
        const segs = 24;
        for (let s = 0; s <= segs; s++) {
          const t = s / segs;
          const wx = a.x + offsetX * 0.4 + (b.x + offsetX * 0.7 - (a.x + offsetX * 0.4)) * t;
          const wz = a.z + (b.z - a.z) * t;
          const sag = Math.sin(t * Math.PI) * (0.38 + i * 0.16);
          const wy = a.y + (b.y - a.y) * t - sag - wIdx * 0.28;
          pts.push(new THREE.Vector3(wx, wy, wz));

          if (i >= minDenseIndex && s > 1 && s < segs - 1 && ((s + wIdx * 2) % 2 === 0)) {
            const bird = new THREE.Mesh(perchedBirdGeo, darkSilhouetteMat);
            bird.position.set(wx, wy + 0.09, wz);
            group.add(bird);
          }
        }
        const lineGeo = new THREE.BufferGeometry().setFromPoints(pts);
        group.add(new THREE.Line(lineGeo, wireMat));
      });
    }
  }

  // --------------------------------------------------------------------------
  // STAGE 3 FOREGROUND (鯤鵬004.png, Cam X = -180.0):
  // - Small distant pole tips at bottom-left-center (X = -186.6)
  // - Prominent close H-frame pole with Osprey Nest & perched bird wires at bottom-right (X = -165.5)
  // --------------------------------------------------------------------------
  const stage3Poles = new THREE.Group();
  addUtilityPole(stage3Poles, -186.6, -14.9, 40.0, 0.50, false);
  const s3_p1 = new THREE.Vector3(-172.0, -11.6, 40.0);
  const s3_p2 = addUtilityPole(stage3Poles, -165.5, -14.2, 40.0, 0.88, true); // Close H-pole with Nest in 鯤鵬004!
  const s3_p3 = new THREE.Vector3(-160.0, -9.2, 40.0);
  connectPolesWithPerchedBirds(stage3Poles, [s3_p1, s3_p2, s3_p3], 0);
  fgGroup.add(stage3Poles);

  // --------------------------------------------------------------------------
  // STAGE 4 FOREGROUND (鯤鵬005.png, Cam X = -240.0):
  // - Full receding row of utility poles across the bottom (X = -247.0, -244.4, -241.4, -237.6)
  // - Prominent close H-frame pole with Osprey Nest & perched bird wires at bottom-right (X = -223.8)
  // --------------------------------------------------------------------------
  const stage4Poles = new THREE.Group();
  const s4_p0 = addUtilityPole(stage4Poles, -247.0, -14.9, 40.0, 0.44, false);
  const s4_p1 = addUtilityPole(stage4Poles, -244.4, -14.8, 40.0, 0.48, false);
  const s4_p2 = addUtilityPole(stage4Poles, -241.4, -14.6, 40.0, 0.53, false);
  const s4_p3 = addUtilityPole(stage4Poles, -237.6, -14.3, 40.0, 0.62, false);
  const s4_p4 = addUtilityPole(stage4Poles, -223.8, -14.1, 40.0, 0.90, true); // Close H-pole with Nest in 鯤鵬005!
  const s4_p5 = new THREE.Vector3(-218.0, -9.0, 40.0);
  connectPolesWithPerchedBirds(stage4Poles, [s4_p0, s4_p1, s4_p2, s4_p3, s4_p4, s4_p5], 3);
  fgGroup.add(stage4Poles);

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
// 6. UI Binding & Five-Keyframe Director Synchronization
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
  subtitleVerse: document.getElementById('subtitle-verse'),
  subtitleBox: document.getElementById('verse-subtitle'),
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

// Map timeline t in [0, 1] to the closest of the 5 keyframes (0.00, 0.25, 0.50, 0.75, 1.00)
function getStageIndexForT(t) {
  return Math.min(4, Math.max(0, Math.round(t * 4.0)));
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
    if (ui.subtitleVerse) {
      ui.subtitleVerse.textContent = stageData.verse;
      // Restart the CSS fade-in so each verse "inks" onto the sky
      ui.subtitleBox.classList.remove('reveal');
      void ui.subtitleBox.offsetWidth;
      ui.subtitleBox.classList.add('reveal');
    }

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
  state.pauseTimer = 1.2; // Hold briefly when user explicitly clicks a stage tab
  if (state.cameraMode !== 'narrative') {
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
  state.pauseTimer = 0;
  murmurationUniforms.uMorph.value = state.timeline;
  skyMaterial.uniforms.uMorph.value = state.timeline;
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
  if (CAMERA_PRESETS[state.cameraMode]) {
    state.targetTimeline = CAMERA_PRESETS[state.cameraMode].snapT;
  }
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
// 7. Synchronized 5-Stage Camera Interpolation & Animation Loop
// ============================================================================
const tempCamPos = new THREE.Vector3();
const tempLookAt = new THREE.Vector3();

function smoothstep(edge0, edge1, x) {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

function computeNarrativeCamera(t, outPos, outLook) {
  // Uses the exact same piecewise Hermite curve as the vertex shader so camera X
  // stays 100% locked to the flock center across all 5 keyframes!
  const scaled = Math.max(0, Math.min(0.9999, t)) * 4.0;
  const idx = Math.floor(scaled);
  const frac = scaled - idx;
  const s = smoothstep(0.03, 0.97, frac);

  const stageA = NARRATIVE_STAGES[idx];
  const stageB = NARRATIVE_STAGES[Math.min(idx + 1, NARRATIVE_STAGES.length - 1)];

  outPos.lerpVectors(stageA.camPos, stageB.camPos, s);
  outLook.lerpVectors(stageA.camLookAt, stageB.camLookAt, s);
}

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  const dt = Math.min(clock.getDelta(), 0.1);
  const elapsed = clock.getElapsedTime();

  if (state.targetTimeline !== null) {
    const diff = state.targetTimeline - state.timeline;
    if (Math.abs(diff) < 0.0015) {
      state.timeline = state.targetTimeline;
      state.targetTimeline = null;
    } else {
      state.timeline += diff * Math.min(1.0, dt * 5.0);
    }
    updateStageUI(state.timeline);
  } else if (state.isPlaying) {
    if (state.pauseTimer > 0) {
      state.pauseTimer -= dt;
    } else {
      const prevT = state.timeline;
      // Modulate flight speed slightly so it glides gracefully through each keyframe
      // without dead-stopping, keeping the forward flight continuous and dynamic!
      const stagePhase = (state.timeline * 4.0) % 1.0;
      const distFromKeyframe = Math.min(stagePhase, 1.0 - stagePhase);
      const speedMod = 0.58 + 0.65 * smoothstep(0.0, 0.25, distFromKeyframe);
      state.timeline += dt * state.playSpeed * speedMod * state.windSpeed;

      if (prevT < 1.00 && state.timeline >= 1.00) {
        state.timeline = 1.00;
        state.pauseTimer = 1.4;
      } else if (prevT === 1.00 && state.timeline > 1.00) {
        state.timeline = 0.00;
        state.pauseTimer = 0.8;
        // Snap camera back to Stage 0 cleanly on loop reset
        if (state.cameraMode === 'narrative') {
          camera.position.copy(NARRATIVE_STAGES[0].camPos);
          controls.target.copy(NARRATIVE_STAGES[0].camLookAt);
        }
      }
      updateStageUI(state.timeline);
    }
  }

  murmurationUniforms.uTime.value = elapsed;
  murmurationUniforms.uMorph.value = state.timeline;
  skyMaterial.uniforms.uTime.value = elapsed;
  skyMaterial.uniforms.uMorph.value = state.timeline;

  const breathX = Math.sin(elapsed * 0.5) * 0.12;
  const breathY = Math.cos(elapsed * 0.38) * 0.08;

  if (state.cameraMode === 'narrative') {
    computeNarrativeCamera(state.timeline, tempCamPos, tempLookAt);
    tempCamPos.x += breathX;
    tempCamPos.y += breathY;
    camera.position.lerp(tempCamPos, Math.min(1.0, dt * 6.0));
    controls.target.lerp(tempLookAt, Math.min(1.0, dt * 6.0));
  } else if (CAMERA_PRESETS[state.cameraMode]) {
    const preset = CAMERA_PRESETS[state.cameraMode];
    tempCamPos.copy(preset.pos);
    tempCamPos.x += breathX;
    tempCamPos.y += breathY;
    camera.position.lerp(tempCamPos, Math.min(1.0, dt * 4.5));
    controls.target.lerp(preset.target, Math.min(1.0, dt * 4.5));
  }

  controls.update();
  soundscape.update(elapsed, state.timeline, state.windSpeed, state.turbulence);
  renderer.render(scene, camera);
}

ui.particleReadout.textContent = '110,000 羽';
ui.valDensity.textContent = '110,000';
updateStageUI(state.timeline);
animate();
