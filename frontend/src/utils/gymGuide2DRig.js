// ============================================================================
// GYMGUIDE - PRECISION-ALIGNED 2.5D ARTICULATED CHARACTER ENGINE
// Reconstructs the exact ?v=7 GymGuide PNG cutouts via image-native joint pivots,
// feathered ball-and-socket limb capsules, seamless side-torso cleanup (no ghost
// hanging arm/hand over shorts), and far/near volumetric depth shading.
// ============================================================================

import {
  resolveEquipmentKind,
  resolveMovementPattern,
  getRepPhaseInfo,
} from './movementKinematics';
import {
  drawStudioEnvironment,
  drawMotionDirectionArrows,
  drawContactShadow,
  draw3DBench,
  drawCableTower3D,
  drawEquippedProp3D,
  drawAnatomicalMuscleGlow,
} from './gymGuide2DProps';

const MODEL_PATHS = {
  front: '/images/character/character-front-cutout.png?v=9',
  back: '/images/character/character-back-cutout.png?v=9',
  side: '/images/character/character-side-cutout.png?v=9',
};

let spriteCachePromise = null;

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load model image: ${src}`));
    img.src = src;
  });
}

/**
 * Slices a body region cleanly using image-native pivot coordinates (imgPivotX, imgPivotY),
 * strips white/grey halo fringe, and optionally softens rounded proximal/distal joint ends.
 */
function makeAlignedSprite(
  img,
  { sx, sy, sw, sh, imgPivotX, imgPivotY, clipPoly = null, roundTop = 0, roundBottom = 0 }
) {
  const canvas = document.createElement('canvas');
  canvas.width = sw;
  canvas.height = sh;
  const ctx = canvas.getContext('2d');

  ctx.save();
  if (clipPoly && clipPoly.length >= 3) {
    ctx.beginPath();
    clipPoly.forEach(([px, py], i) => {
      if (i === 0) ctx.moveTo(px - sx, py - sy);
      else ctx.lineTo(px - sx, py - sy);
    });
    ctx.closePath();
    ctx.clip();
  }
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
  ctx.restore();

  const imgData = ctx.getImageData(0, 0, sw, sh);
  const d = imgData.data;
  const halfW = sw * 0.5;

  for (let y = 0; y < sh; y += 1) {
    for (let x = 0; x < sw; x += 1) {
      const idx = (y * sw + x) * 4;
      let alpha = d[idx + 3];

      // Preserve mathematically un-premultiplied alpha cleanly; drop tiny sub-threshold specks only
      if (alpha < 10) {
        alpha = 0;
      }

      // Soften proximal shoulder/hip/knee ball joint so bending never reveals flat rectangle corners
      if (alpha > 0 && roundTop > 0 && y < roundTop) {
        const edgeRatio = y / roundTop;
        const dxNorm = Math.abs(x - halfW) / Math.max(1, halfW);
        const ovalWeight = Math.max(0, 1 - dxNorm * dxNorm * (1 - edgeRatio));
        alpha = Math.round(alpha * Math.min(1, (0.25 + edgeRatio * 0.75) * ovalWeight));
      }

      if (alpha > 0 && roundBottom > 0 && y > sh - roundBottom) {
        const edgeRatio = (sh - y) / roundBottom;
        const dxNorm = Math.abs(x - halfW) / Math.max(1, halfW);
        const ovalWeight = Math.max(0, 1 - dxNorm * dxNorm * (1 - edgeRatio));
        alpha = Math.round(alpha * Math.min(1, (0.25 + edgeRatio * 0.75) * ovalWeight));
      }

      d[idx + 3] = alpha;
    }
  }
  ctx.putImageData(imgData, 0, 0);

  return {
    canvas,
    w: sw,
    h: sh,
    pivotX: imgPivotX - sx,
    pivotY: imgPivotY - sy,
  };
}

/**
 * Reconstructs clean muscle/shorts continuity inside the side-view torso where the original
 * standing arm overlapped ribs/obliques/shorts (`character-side-cutout.png`), so when the
 * separate side arm lifts in bench press / squats / pushes, ZERO ghost arm remains on the ribs/shorts.
 */
function buildCleanSideTorso(sideImg) {
  const sw = 154;
  const sh = 675;
  const off = document.createElement('canvas');
  off.width = sw;
  off.height = sh;
  const octx = off.getContext('2d');
  octx.drawImage(sideImg, 0, 0);

  const imgData = octx.getImageData(0, 0, sw, sh);
  const d = imgData.data;

  for (let y = 138; y <= 368; y += 1) {
    // Region occluded by hanging arm/hand in original side photo narrows progressively downward
    const leftBound = y < 230 ? 34 : y < 295 ? 44 : 52;
    const rightBound = y < 245 ? 86 : y < 305 ? 96 : 112;

    // Locate valid leftmost torso/back pixel and valid rightmost chest/abs/shorts pixel
    let lx = leftBound - 4;
    while (lx > 10 && d[(y * sw + lx) * 4 + 3] < 180) lx -= 1;

    let rx = rightBound + 4;
    while (rx < sw - 6 && d[(y * sw + rx) * 4 + 3] < 180) rx += 1;

    const lIdx = (y * sw + lx) * 4;
    const rIdx = (y * sw + rx) * 4;
    if (d[lIdx + 3] < 160 || d[rIdx + 3] < 160) continue;

    for (let x = leftBound; x <= rightBound; x += 1) {
      const idx = (y * sw + x) * 4;
      if (d[idx + 3] < 80) continue;

      const t = (x - leftBound) / Math.max(1, rightBound - leftBound);
      const shade = y < 298 ? 0.88 + Math.sin(t * Math.PI) * 0.08 : 0.96;
      const interpR = (d[lIdx] * (1 - t) + d[rIdx] * t) * shade;
      const interpG = (d[lIdx + 1] * (1 - t) + d[rIdx + 1] * t) * shade;
      const interpB = (d[lIdx + 2] * (1 - t) + d[rIdx + 2] * t) * shade;

      // Softly feather transitions at leftBound and rightBound edges
      const edgeBlend = Math.min(
        1,
        Math.min(x - leftBound + 1, rightBound - x + 1) / 5
      );
      d[idx] = Math.min(255, Math.round(d[idx] * (1 - edgeBlend) + interpR * edgeBlend));
      d[idx + 1] = Math.min(255, Math.round(d[idx + 1] * (1 - edgeBlend) + interpG * edgeBlend));
      d[idx + 2] = Math.min(255, Math.round(d[idx + 2] * (1 - edgeBlend) + interpB * edgeBlend));
    }
  }

  octx.putImageData(imgData, 0, 0);
  return off;
}

/**
 * Loads & slices your real ?v=7 GymGuide PNG cutouts with exact image-native skeletal offsets
 * so limbs attach cleanly at anatomical joints without dislocations or gaps.
 */
export function loadGymGuide2DSprites() {
  if (!spriteCachePromise) {
    spriteCachePromise = Promise.all([
      loadImage(MODEL_PATHS.front),
      loadImage(MODEL_PATHS.back),
      loadImage(MODEL_PATHS.side),
    ]).then(([frontImg, backImg, sideImg]) => {
      // =====================================================================
      // 1. FRONT RIG (316 x 675, Torso Origin = (158, 325))
      // =====================================================================
      const FRONT_REF = { x: 158, y: 325 };
      const front = {
        ref: FRONT_REF,
        sockets: {
          neck: { x: 159, y: 108 },
          lShoulder: { x: 82, y: 148 },
          rShoulder: { x: 235, y: 148 },
          lElbow: { x: 58, y: 235 },
          rElbow: { x: 258, y: 235 },
          lHand: { x: 28, y: 355 },
          rHand: { x: 286, y: 355 },
          lHip: { x: 118, y: 352 },
          rHip: { x: 200, y: 352 },
          lKnee: { x: 114, y: 448 },
          rKnee: { x: 204, y: 448 },
        },
        head: makeAlignedSprite(frontImg, {
          sx: 112, sy: 0, sw: 94, sh: 122,
          imgPivotX: 159, imgPivotY: 108,
          roundBottom: 12,
        }),
        torso: makeAlignedSprite(frontImg, {
          sx: 78, sy: 100, sw: 162, sh: 298,
          imgPivotX: FRONT_REF.x, imgPivotY: FRONT_REF.y,
          clipPoly: [
            [122, 100], [196, 100], [220, 128], [218, 180],
            [215, 232], [240, 358], [218, 396], [164, 396],
            [158, 384], [152, 396], [98, 396], [80, 358],
            [102, 232], [98, 180], [96, 128],
          ],
        }),
        lUpperArm: makeAlignedSprite(frontImg, {
          sx: 30, sy: 122, sw: 68, sh: 130,
          imgPivotX: 82, imgPivotY: 148,
          roundTop: 18, roundBottom: 14,
        }),
        lForearm: makeAlignedSprite(frontImg, {
          sx: 6, sy: 222, sw: 72, sh: 178,
          imgPivotX: 58, imgPivotY: 235,
          roundTop: 14,
        }),
        rUpperArm: makeAlignedSprite(frontImg, {
          sx: 218, sy: 122, sw: 68, sh: 130,
          imgPivotX: 235, imgPivotY: 148,
          roundTop: 18, roundBottom: 14,
        }),
        rForearm: makeAlignedSprite(frontImg, {
          sx: 236, sy: 222, sw: 74, sh: 178,
          imgPivotX: 258, imgPivotY: 235,
          roundTop: 14,
        }),
        lThigh: makeAlignedSprite(frontImg, {
          sx: 76, sy: 334, sw: 80, sh: 132,
          imgPivotX: 118, imgPivotY: 352,
          roundTop: 18, roundBottom: 16,
        }),
        lShin: makeAlignedSprite(frontImg, {
          sx: 46, sy: 432, sw: 98, sh: 243,
          imgPivotX: 114, imgPivotY: 448,
          roundTop: 16,
        }),
        rThigh: makeAlignedSprite(frontImg, {
          sx: 160, sy: 334, sw: 80, sh: 132,
          imgPivotX: 200, imgPivotY: 352,
          roundTop: 18, roundBottom: 16,
        }),
        rShin: makeAlignedSprite(frontImg, {
          sx: 174, sy: 432, sw: 100, sh: 243,
          imgPivotX: 204, imgPivotY: 448,
          roundTop: 16,
        }),
      };

      // =====================================================================
      // 2. BACK RIG (302 x 675, Torso Origin = (151, 325))
      // =====================================================================
      const BACK_REF = { x: 151, y: 325 };
      const back = {
        ref: BACK_REF,
        sockets: {
          neck: { x: 152, y: 108 },
          lShoulder: { x: 74, y: 148 },
          rShoulder: { x: 228, y: 148 },
          lElbow: { x: 52, y: 235 },
          rElbow: { x: 252, y: 235 },
          lHand: { x: 24, y: 355 },
          rHand: { x: 280, y: 355 },
          lHip: { x: 108, y: 352 },
          rHip: { x: 196, y: 352 },
          lKnee: { x: 106, y: 448 },
          rKnee: { x: 198, y: 448 },
        },
        head: makeAlignedSprite(backImg, {
          sx: 106, sy: 0, sw: 92, sh: 120,
          imgPivotX: 152, imgPivotY: 108,
          roundBottom: 12,
        }),
        torso: makeAlignedSprite(backImg, {
          sx: 68, sy: 98, sw: 168, sh: 294,
          imgPivotX: BACK_REF.x, imgPivotY: BACK_REF.y,
          clipPoly: [
            [114, 98], [190, 98], [214, 128], [212, 178],
            [206, 232], [232, 355], [214, 390], [88, 390],
            [72, 355], [96, 232], [90, 178], [90, 128],
          ],
        }),
        lUpperArm: makeAlignedSprite(backImg, {
          sx: 24, sy: 122, sw: 68, sh: 130,
          imgPivotX: 74, imgPivotY: 148,
          roundTop: 18, roundBottom: 14,
        }),
        lForearm: makeAlignedSprite(backImg, {
          sx: 4, sy: 222, sw: 70, sh: 178,
          imgPivotX: 52, imgPivotY: 235,
          roundTop: 14,
        }),
        rUpperArm: makeAlignedSprite(backImg, {
          sx: 210, sy: 122, sw: 68, sh: 130,
          imgPivotX: 228, imgPivotY: 148,
          roundTop: 18, roundBottom: 14,
        }),
        rForearm: makeAlignedSprite(backImg, {
          sx: 228, sy: 222, sw: 72, sh: 178,
          imgPivotX: 252, imgPivotY: 235,
          roundTop: 14,
        }),
        lThigh: makeAlignedSprite(backImg, {
          sx: 66, sy: 334, sw: 86, sh: 134,
          imgPivotX: 108, imgPivotY: 352,
          roundTop: 18, roundBottom: 16,
        }),
        lShin: makeAlignedSprite(backImg, {
          sx: 38, sy: 432, sw: 98, sh: 243,
          imgPivotX: 106, imgPivotY: 448,
          roundTop: 16,
        }),
        rThigh: makeAlignedSprite(backImg, {
          sx: 150, sy: 334, sw: 86, sh: 134,
          imgPivotX: 196, imgPivotY: 352,
          roundTop: 18, roundBottom: 16,
        }),
        rShin: makeAlignedSprite(backImg, {
          sx: 164, sy: 432, sw: 102, sh: 243,
          imgPivotX: 198, imgPivotY: 448,
          roundTop: 16,
        }),
      };

      // =====================================================================
      // 3. SIDE RIG (154 x 675, Torso Origin = (74, 330))
      // Uses reconstructed clean side torso + matching native side-view arm!
      // =====================================================================
      const cleanSideImg = buildCleanSideTorso(sideImg);
      const SIDE_REF = { x: 74, y: 330 };
      const side = {
        ref: SIDE_REF,
        sockets: {
          neck: { x: 70, y: 108 },
          shoulder: { x: 56, y: 152 },
          elbow: { x: 64, y: 236 },
          hand: { x: 106, y: 348 },
          hip: { x: 74, y: 336 },
          knee: { x: 72, y: 448 },
        },
        head: makeAlignedSprite(sideImg, {
          sx: 22, sy: 0, sw: 112, sh: 118,
          imgPivotX: 70, imgPivotY: 108,
          roundBottom: 12,
        }),
        torso: makeAlignedSprite(cleanSideImg, {
          sx: 8, sy: 104, sw: 136, sh: 266,
          imgPivotX: SIDE_REF.x, imgPivotY: SIDE_REF.y,
          clipPoly: [
            [40, 104], [100, 104], [134, 152], [138, 224],
            [132, 344], [100, 366], [30, 366], [24, 300],
            [16, 225], [14, 158], [26, 122],
          ],
          roundBottom: 14,
        }),
        // Native Side-Profile Arm sliced cleanly without torso/trunks/quad bleed (`y = 122..396`)
        armUpper: makeAlignedSprite(sideImg, {
          sx: 18, sy: 122, sw: 74, sh: 128,
          imgPivotX: 56, imgPivotY: 152,
          clipPoly: [
            [28, 124], [86, 128], [90, 180], [88, 242],
            [44, 244], [30, 190], [22, 152],
          ],
          roundTop: 22, roundBottom: 16,
        }),
        armForearm: makeAlignedSprite(sideImg, {
          sx: 40, sy: 224, sw: 110, sh: 174,
          imgPivotX: 64, imgPivotY: 236,
          clipPoly: [
            [42, 224], [88, 224], [104, 260], [122, 296],
            [142, 336], [149, 376], [136, 396], [102, 394],
            [98, 356], [94, 332], [76, 304], [54, 268], [44, 240],
          ],
          roundTop: 14,
        }),
        thigh: makeAlignedSprite(sideImg, {
          sx: 22, sy: 320, sw: 112, sh: 152,
          imgPivotX: 74, imgPivotY: 336,
          roundTop: 22, roundBottom: 18,
        }),
        shin: makeAlignedSprite(sideImg, {
          sx: 4, sy: 432, sw: 138, sh: 243,
          imgPivotX: 72, imgPivotY: 448,
          roundTop: 18,
        }),
      };

      return { front, back, side };
    });
  }
  return spriteCachePromise;
}

let _cachedMaskCanvas = null;
let _cachedMaskCtx = null;
let _charMaskCtx = null;

function beginCharMask(ctx) {
  if (
    typeof document === 'undefined' ||
    !ctx?.canvas?.width ||
    !ctx?.canvas?.height ||
    typeof ctx.getTransform !== 'function'
  ) {
    _charMaskCtx = null;
    return null;
  }
  if (!_cachedMaskCanvas) {
    _cachedMaskCanvas = document.createElement('canvas');
    _cachedMaskCtx = _cachedMaskCanvas.getContext('2d');
  }
  if (!_cachedMaskCtx) {
    _charMaskCtx = null;
    return null;
  }
  if (
    _cachedMaskCanvas.width !== ctx.canvas.width ||
    _cachedMaskCanvas.height !== ctx.canvas.height
  ) {
    _cachedMaskCanvas.width = ctx.canvas.width;
    _cachedMaskCanvas.height = ctx.canvas.height;
  } else {
    _cachedMaskCtx.setTransform(1, 0, 0, 1, 0, 0);
    _cachedMaskCtx.clearRect(0, 0, _cachedMaskCanvas.width, _cachedMaskCanvas.height);
  }
  _charMaskCtx = _cachedMaskCtx;
  return _cachedMaskCanvas;
}

function drawLimbSprite(
  ctx,
  sprite,
  wx,
  wy,
  angleRad,
  scale = 1,
  isFar = false,
  scaleYMult = 1
) {
  if (!sprite) return;
  ctx.save();
  ctx.translate(wx, wy);
  ctx.rotate(angleRad);
  ctx.scale(scale, scale * scaleYMult);
  if (isFar) {
    ctx.filter = 'brightness(0.75) contrast(1.06)';
  }
  ctx.drawImage(sprite.canvas, -sprite.pivotX, -sprite.pivotY);
  ctx.restore();

  if (_charMaskCtx) {
    _charMaskCtx.save();
    _charMaskCtx.setTransform(ctx.getTransform());
    _charMaskCtx.translate(wx, wy);
    _charMaskCtx.rotate(angleRad);
    _charMaskCtx.scale(scale, scale * scaleYMult);
    _charMaskCtx.drawImage(sprite.canvas, -sprite.pivotX, -sprite.pivotY);
    _charMaskCtx.restore();
  }
}

function offsetAlongAngle(ox, oy, angleRad, dx, dy, scale = 1) {
  const c = Math.cos(angleRad);
  const s = Math.sin(angleRad);
  return {
    x: ox + (dx * c - dy * s) * scale,
    y: oy + (dx * s + dy * c) * scale,
  };
}

function socketWorld(rig, socketKey, torsoX, torsoY, torsoAng, scale) {
  const sock = rig.sockets[socketKey];
  return offsetAlongAngle(torsoX, torsoY, torsoAng, sock.x - rig.ref.x, sock.y - rig.ref.y, scale);
}

function boneEndWorld(rig, fromKey, toKey, originX, originY, limbAng, scale) {
  const f = rig.sockets[fromKey];
  const t = rig.sockets[toKey];
  return offsetAlongAngle(originX, originY, limbAng, t.x - f.x, t.y - f.y, scale);
}

const lerp = (a, b, t) => a + (b - a) * t;

/**
 * Renders a volumetric 2.5D articulated GymGuide frame using exact image-native joints.
 */
export function renderGymGuide2DFrame(ctx, sprites, options) {
  const {
    width,
    height,
    exercise,
    equipmentSlug = 'ALL',
    phaseProgress = 0.5,
    accentMode = 'emerald',
    showMuscleOverlay = true,
    showHud = true,
    repCount = 1,
    isDarkTheme = true,
    motionDirection = null,
  } = options;

  if (!ctx || !sprites || !exercise) return;

  const p = Math.max(0, Math.min(1, phaseProgress));
  const pattern = resolveMovementPattern(exercise);
  const eqKind = resolveEquipmentKind(exercise, equipmentSlug);
  const nameLower = `${exercise.name || ''} ${exercise.slug || ''}`.toLowerCase();

  const isIncline =
    (nameLower.includes('incline') && !nameLower.includes('incline push')) ||
    nameLower.includes('low-to-high') ||
    nameLower.includes('decline push');
  const isDecline =
    (nameLower.includes('decline') && !nameLower.includes('decline push')) ||
    nameLower.includes('high-to-low') ||
    nameLower.includes('incline push');

  drawStudioEnvironment(ctx, width, height, isDarkTheme);
  const maskCanvas = beginCharMask(ctx);

  const LOGICAL_W = 640;
  const LOGICAL_H = 360;

  let camZoom = 1.22;
  let camFocusX = 320;
  let camFocusY = 190;
  if (
    pattern === 'bench_press' ||
    pattern === 'skull_crusher' ||
    pattern === 'hip_thrust' ||
    pattern === 'glute_bridge' ||
    pattern === 'leg_curl'
  ) {
    camZoom = 1.15;
    camFocusX = 324;
    camFocusY = isIncline ? 186 : 200;
  } else if (
    pattern === 'seated_chest_press' ||
    pattern === 'leg_extension' ||
    pattern === 'leg_press' ||
    pattern === 'overhead_tricep'
  ) {
    camZoom = 1.28;
    camFocusX = 304;
    camFocusY = 200;
  } else if (pattern === 'pushup' || pattern === 'plank' || pattern === 'ab_wheel') {
    camZoom = 1.32;
    camFocusX = 315;
    camFocusY = 228;
  } else if (pattern === 'seated_row' || pattern === 'cable_crunch') {
    camZoom = 1.20;
    camFocusX = 278;
    camFocusY = 196;
  }

  const stageScale = Math.min(width / LOGICAL_W, height / LOGICAL_H) * camZoom;
  const offsetX = width * 0.5 - camFocusX * stageScale;
  const offsetY = height * 0.5 - camFocusY * stageScale;

  ctx.save();
  ctx.translate(offsetX, offsetY);
  ctx.scale(stageScale, stageScale);

  const floorY = 324;
  const S = 0.44;
  const anchors = {
    chest: [], frontDelt: [], rearDelt: [], biceps: [], triceps: [], forearms: [],
    lats: [], traps: [], lowerBack: [], abs: [], obliques: [],
    quads: [], hams: [], glutes: [], calves: [],
  };

  // =========================================================================
  // 1. RECLINED / BENCH PATTERNS (Bench Press, Incline/Decline, Skull Crusher, Hip Thrust, Leg Curl)
  // =========================================================================
  if (
    pattern === 'bench_press' ||
    pattern === 'skull_crusher' ||
    pattern === 'hip_thrust' ||
    pattern === 'glute_bridge' ||
    pattern === 'leg_curl'
  ) {
    const s = sprites.side;
    const isHipThrust = pattern === 'hip_thrust' || pattern === 'glute_bridge';
    const isLegCurl = pattern === 'leg_curl';
    // Positive clockwise rotation lifts backrest UP-LEFT toward true 38 deg Incline; negative tilts down
    const benchTiltDeg = isHipThrust ? 0 : isLegCurl ? -4 : isIncline ? 38 : isDecline ? -16 : 0;

    draw3DBench(ctx, {
      anchorX: 342,
      seatY: 224,
      backAngleDeg: benchTiltDeg,
      floorY,
      isSeatedPad: isHipThrust,
    });

    if (isLegCurl) {
      const torsoX = 342;
      const torsoY = 212;
      const tAng = 1.5;
      drawLimbSprite(ctx, s.torso, torsoX, torsoY, tAng, S);
      const neck = socketWorld(s, 'neck', torsoX, torsoY, tAng, S);
      drawLimbSprite(ctx, s.head, neck.x, neck.y, 1.15, S);

      const hip = socketWorld(s, 'hip', torsoX, torsoY, tAng, S);
      const thighAng = 1.55;
      drawLimbSprite(ctx, s.thigh, hip.x - 6, hip.y - 3, thighAng, S, true);
      drawLimbSprite(ctx, s.thigh, hip.x, hip.y, thighAng, S);
      const knee = boneEndWorld(s, 'hip', 'knee', hip.x, hip.y, thighAng, S);
      const shinAng = lerp(1.56, 3.24, p);
      drawLimbSprite(ctx, s.shin, knee.x, knee.y, shinAng, S);
      const ankle = offsetAlongAngle(knee.x, knee.y, shinAng, 0, 175, S);
      drawEquippedProp3D(ctx, 'machine', ankle.x, ankle.y, 0, 1.0);
      anchors.hams.push({ x: (hip.x + knee.x) / 2, y: (hip.y + knee.y) / 2 - 12, rx: 28, ry: 12 });
      anchors.calves.push({ x: (knee.x + ankle.x) / 2, y: (knee.y + ankle.y) / 2, rx: 14, ry: 22 });
    } else {
      const hipLift = isHipThrust ? lerp(0, -34, p) : 0;
      const torsoAngle = isHipThrust
        ? lerp(0.55, 0.0, p)
        : ((-90 + benchTiltDeg) * Math.PI) / 180;

      const torsoX = 338;
      const torsoY = (isIncline ? 222 : 220) + hipLift;

      // Exact anatomical sockets on reclined side torso!
      const sh = socketWorld(s, 'shoulder', torsoX, torsoY, torsoAngle, S);
      const neck = socketWorld(s, 'neck', torsoX, torsoY, torsoAngle, S);
      const hip = socketWorld(s, 'hip', torsoX, torsoY, torsoAngle, S);

      // Far leg darkened slightly behind seat
      drawLimbSprite(ctx, s.thigh, hip.x + 8, hip.y - 4, -1.22, S, true);
      const farKnee = boneEndWorld(s, 'hip', 'knee', hip.x + 8, hip.y - 4, -1.22, S);
      drawLimbSprite(ctx, s.shin, farKnee.x, farKnee.y, -0.05, S, true);

      // Far arm pressing cleanly with 3/4 depth separation so both arms & dumbbells read clearly
      const upperArmAng =
        pattern === 'skull_crusher' ? -2.95 : lerp(-0.88, -2.58, p);
      const forearmAng =
        pattern === 'skull_crusher' ? lerp(-1.35, -2.78, p) : lerp(-2.78, -2.70, p);

      if (!isHipThrust) {
        const farSh = { x: sh.x + 18, y: sh.y - 10 };
        drawLimbSprite(ctx, s.armUpper, farSh.x, farSh.y, upperArmAng, S, true);
        const farElb = boneEndWorld(s, 'shoulder', 'elbow', farSh.x, farSh.y, upperArmAng, S);
        drawLimbSprite(ctx, s.armForearm, farElb.x, farElb.y, forearmAng, S, true);
        const farHand = boneEndWorld(s, 'elbow', 'hand', farElb.x, farElb.y, forearmAng, S);
        if (eqKind === 'dumbbell') {
          drawEquippedProp3D(ctx, 'dumbbell', farHand.x, farHand.y, 0, 1.02, true);
        }
      }

      // Near thigh + shin planted firmly at floorY
      drawLimbSprite(ctx, s.thigh, hip.x, hip.y, -1.22, S);
      const knee = boneEndWorld(s, 'hip', 'knee', hip.x, hip.y, -1.22, S);
      drawLimbSprite(ctx, s.shin, knee.x, knee.y, -0.05, S);

      // Clean Reconstructed Side Torso & naturally lifted Head
      drawLimbSprite(ctx, s.torso, torsoX, torsoY, torsoAngle, S);
      drawLimbSprite(ctx, s.head, neck.x, neck.y, torsoAngle * 0.45, S);

      const chestPos = offsetAlongAngle(torsoX, torsoY, torsoAngle, 22, -138, S);
      anchors.chest.push({ x: chestPos.x, y: chestPos.y, rx: 28, ry: 18, deg: -benchTiltDeg });
      anchors.frontDelt.push({ x: sh.x, y: sh.y, rx: 16, ry: 14 });
      anchors.glutes.push({ x: hip.x - 10, y: hip.y, rx: 22, ry: 18 });

      if (isHipThrust) {
        drawEquippedProp3D(ctx, eqKind, hip.x + 10, hip.y - 12, 0, 1.05);
        anchors.hams.push({ x: (hip.x + knee.x) / 2, y: (hip.y + knee.y) / 2, rx: 24, ry: 14 });
      } else {
        drawLimbSprite(ctx, s.armUpper, sh.x, sh.y, upperArmAng, S);
        const elbow = boneEndWorld(s, 'shoulder', 'elbow', sh.x, sh.y, upperArmAng, S);
        drawLimbSprite(ctx, s.armForearm, elbow.x, elbow.y, forearmAng, S);
        const hand = boneEndWorld(s, 'elbow', 'hand', elbow.x, elbow.y, forearmAng, S);

        anchors.triceps.push({ x: (sh.x + elbow.x) / 2, y: (sh.y + elbow.y) / 2, rx: 14, ry: 12 });
        drawEquippedProp3D(ctx, eqKind, hand.x, hand.y, 0, 1.12);
      }
    }
  }

  // =========================================================================
  // 2. SEATED UPRIGHT / LEG PRESS / LEG EXTENSION / OVERHEAD TRICEP
  // =========================================================================
  else if (
    pattern === 'seated_chest_press' ||
    pattern === 'leg_extension' ||
    pattern === 'leg_press' ||
    pattern === 'overhead_tricep'
  ) {
    const s = sprites.side;
    const isLegPress = pattern === 'leg_press';
    const isLegExt = pattern === 'leg_extension';

    if (isLegPress) {
      draw3DBench(ctx, { anchorX: 250, seatY: 222, backAngleDeg: 38, floorY, isSeatedPad: true });
      const torsoX = 248;
      const torsoY = 222;
      const tAng = -0.58;
      drawLimbSprite(ctx, s.torso, torsoX, torsoY, tAng, S);
      const neck = socketWorld(s, 'neck', torsoX, torsoY, tAng, S);
      drawLimbSprite(ctx, s.head, neck.x, neck.y, -0.35, S);

      const hip = socketWorld(s, 'hip', torsoX, torsoY, tAng, S);
      const thighAng = lerp(-2.72, -2.02, p);
      const shinAng = lerp(-1.28, -2.08, p);
      drawLimbSprite(ctx, s.thigh, hip.x + 6, hip.y - 4, thighAng, S, true);
      drawLimbSprite(ctx, s.thigh, hip.x, hip.y, thighAng, S);
      const knee = boneEndWorld(s, 'hip', 'knee', hip.x, hip.y, thighAng, S);
      drawLimbSprite(ctx, s.shin, knee.x, knee.y, shinAng, S);
      const foot = offsetAlongAngle(knee.x, knee.y, shinAng, 14, 185, S);

      ctx.save();
      ctx.translate(foot.x + 12, foot.y - 10);
      ctx.rotate(-0.62);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(-10, -45, 16, 90);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(8, -32, 12, 64);
      ctx.fillStyle = '#10b981';
      ctx.fillRect(10, -24, 8, 4);
      ctx.restore();

      anchors.quads.push({ x: (hip.x + knee.x) / 2, y: (hip.y + knee.y) / 2, rx: 24, ry: 32 });
      anchors.glutes.push({ x: hip.x - 10, y: hip.y, rx: 20, ry: 18 });
    } else {
      draw3DBench(ctx, { anchorX: 290, seatY: 218, backAngleDeg: 82, floorY, isSeatedPad: true });
      const torsoX = 290;
      const torsoY = 216;
      const tAng = -0.14;

      drawLimbSprite(ctx, s.torso, torsoX, torsoY, tAng, S);
      const neck = socketWorld(s, 'neck', torsoX, torsoY, tAng, S);
      drawLimbSprite(ctx, s.head, neck.x, neck.y, 0, S);

      const hip = socketWorld(s, 'hip', torsoX, torsoY, tAng, S);
      const sh = socketWorld(s, 'shoulder', torsoX, torsoY, tAng, S);

      const shinExtAng = isLegExt ? lerp(0.05, -1.42, p) : -0.02;
      drawLimbSprite(ctx, s.thigh, hip.x + 6, hip.y - 3, -1.5, S, true);
      const farKnee = boneEndWorld(s, 'hip', 'knee', hip.x + 6, hip.y - 3, -1.5, S);
      drawLimbSprite(ctx, s.shin, farKnee.x, farKnee.y, shinExtAng, S, true);

      drawLimbSprite(ctx, s.thigh, hip.x, hip.y, -1.5, S);
      const knee = boneEndWorld(s, 'hip', 'knee', hip.x, hip.y, -1.5, S);
      drawLimbSprite(ctx, s.shin, knee.x, knee.y, shinExtAng, S);

      if (isLegExt) {
        const anklePad = offsetAlongAngle(knee.x, knee.y, shinExtAng, 10, 175, S);
        drawEquippedProp3D(ctx, 'machine', anklePad.x, anklePad.y, 0, 1.0);
        anchors.quads.push({ x: (hip.x + knee.x) / 2, y: (hip.y + knee.y) / 2 - 12, rx: 28, ry: 14 });
      } else if (pattern === 'overhead_tricep') {
        const upperA = -2.95;
        const foreA = lerp(-0.55, -2.9, p);
        drawLimbSprite(ctx, s.armUpper, sh.x, sh.y, upperA, S);
        const elb = boneEndWorld(s, 'shoulder', 'elbow', sh.x, sh.y, upperA, S);
        drawLimbSprite(ctx, s.armForearm, elb.x, elb.y, foreA, S);
        const hand = boneEndWorld(s, 'elbow', 'hand', elb.x, elb.y, foreA, S);
        drawEquippedProp3D(ctx, eqKind, hand.x, hand.y, 0, 0.9);
        anchors.triceps.push({ x: (sh.x + elb.x) / 2, y: (sh.y + elb.y) / 2, rx: 14, ry: 22 });
      } else {
        const uA = lerp(-0.35, -1.42, p);
        const fA = lerp(-1.55, -1.52, p);
        drawLimbSprite(ctx, s.armUpper, sh.x, sh.y, uA, S);
        const elb = boneEndWorld(s, 'shoulder', 'elbow', sh.x, sh.y, uA, S);
        drawLimbSprite(ctx, s.armForearm, elb.x, elb.y, fA, S);
        const hand = boneEndWorld(s, 'elbow', 'hand', elb.x, elb.y, fA, S);
        drawEquippedProp3D(ctx, 'machine', hand.x, hand.y, 90, 1.0);
        const chestPos = offsetAlongAngle(torsoX, torsoY, tAng, 28, -134, S);
        anchors.chest.push({ x: chestPos.x, y: chestPos.y, rx: 22, ry: 18 });
      }
    }
  }

  // =========================================================================
  // 3. BACK VIEW & CABLE TOWERS (Lat Pulldown, Pull-Up, Seated Row, Face Pull, Rear Delt)
  // =========================================================================
  else if (
    pattern === 'pulldown' ||
    pattern === 'pullup' ||
    pattern === 'seated_row' ||
    pattern === 'face_pull' ||
    pattern === 'reverse_fly'
  ) {
    const b = sprites.back;
    const isPullup = pattern === 'pullup';
    const isSeatedRow = pattern === 'seated_row';

    if (isPullup) {
      drawContactShadow(ctx, 320, floorY, 85, 9, 0.28);
      ctx.fillStyle = '#334155';
      ctx.fillRect(190, 42, 260, 10);
      ctx.fillRect(190, 42, 11, floorY - 42);
      ctx.fillRect(439, 42, 11, floorY - 42);
    } else {
      drawCableTower3D(ctx, { x: isSeatedRow ? 140 : 320, topY: isSeatedRow ? 92 : 34, floorY, p });
    }

    const bodyLiftY = isPullup ? lerp(18, -32, p) : 0;
    const torsoX = isSeatedRow ? 340 : 320;
    const torsoY = (isSeatedRow ? 188 : 172) + bodyLiftY;

    const neck = socketWorld(b, 'neck', torsoX, torsoY, 0, S);
    const lSh = socketWorld(b, 'lShoulder', torsoX, torsoY, 0, S);
    const rSh = socketWorld(b, 'rShoulder', torsoX, torsoY, 0, S);
    const lHip = socketWorld(b, 'lHip', torsoX, torsoY, 0, S);
    const rHip = socketWorld(b, 'rHip', torsoX, torsoY, 0, S);

    if (!isPullup) {
      drawContactShadow(ctx, torsoX, floorY, 68, 9, 0.3);
      drawLimbSprite(ctx, b.lThigh, lHip.x, lHip.y, 0.14, S);
      const lK = boneEndWorld(b, 'lHip', 'lKnee', lHip.x, lHip.y, 0.14, S);
      drawLimbSprite(ctx, b.lShin, lK.x, lK.y, 0, S);
      drawLimbSprite(ctx, b.rThigh, rHip.x, rHip.y, -0.14, S);
      const rK = boneEndWorld(b, 'rHip', 'rKnee', rHip.x, rHip.y, -0.14, S);
      drawLimbSprite(ctx, b.rShin, rK.x, rK.y, 0, S);
    } else {
      drawLimbSprite(ctx, b.lThigh, lHip.x, lHip.y, 0.12, S);
      const lK = boneEndWorld(b, 'lHip', 'lKnee', lHip.x, lHip.y, 0.12, S);
      drawLimbSprite(ctx, b.lShin, lK.x, lK.y, 0.24, S);
      drawLimbSprite(ctx, b.rThigh, rHip.x, rHip.y, -0.12, S);
      const rK = boneEndWorld(b, 'rHip', 'rKnee', rHip.x, rHip.y, -0.12, S);
      drawLimbSprite(ctx, b.rShin, rK.x, rK.y, -0.24, S);
    }

    drawLimbSprite(ctx, b.torso, torsoX, torsoY, 0, S);
    drawLimbSprite(ctx, b.head, neck.x, neck.y, 0, S);

    const lUpperAng = isSeatedRow ? lerp(0.55, -0.22, p) : lerp(2.25, 0.85, p);
    const lForeAng = isSeatedRow ? lerp(0.25, 0.1, p) : lerp(2.75, 2.35, p);
    const rUpperAng = -lUpperAng;
    const rForeAng = -lForeAng;

    drawLimbSprite(ctx, b.lUpperArm, lSh.x, lSh.y, lUpperAng, S);
    const lElb = boneEndWorld(b, 'lShoulder', 'lElbow', lSh.x, lSh.y, lUpperAng, S);
    drawLimbSprite(ctx, b.lForearm, lElb.x, lElb.y, lForeAng, S);
    const lHand = boneEndWorld(b, 'lElbow', 'lHand', lElb.x, lElb.y, lForeAng, S);

    drawLimbSprite(ctx, b.rUpperArm, rSh.x, rSh.y, rUpperAng, S);
    const rElb = boneEndWorld(b, 'rShoulder', 'rElbow', rSh.x, rSh.y, rUpperAng, S);
    drawLimbSprite(ctx, b.rForearm, rElb.x, rElb.y, rForeAng, S);
    const rHand = boneEndWorld(b, 'rElbow', 'rHand', rElb.x, rElb.y, rForeAng, S);

    if (!isPullup) {
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(lHand.x - 16, lHand.y);
      ctx.lineTo(rHand.x + 16, rHand.y);
      ctx.stroke();

      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo((lHand.x + rHand.x) / 2, (lHand.y + rHand.y) / 2);
      ctx.lineTo(isSeatedRow ? 140 : 320, isSeatedRow ? 106 : 48);
      ctx.stroke();

      drawEquippedProp3D(ctx, 'cable', lHand.x, lHand.y, 0, 0.8);
      drawEquippedProp3D(ctx, 'cable', rHand.x, rHand.y, 0, 0.8);
    }

    anchors.lats.push(
      { x: torsoX - 24, y: torsoY - 46, rx: 20, ry: 34, deg: -12 },
      { x: torsoX + 24, y: torsoY - 46, rx: 20, ry: 34, deg: 12 }
    );
    anchors.traps.push({ x: torsoX, y: torsoY - 68, rx: 28, ry: 20 });
    anchors.rearDelt.push({ x: lSh.x, y: lSh.y, rx: 14, ry: 14 }, { x: rSh.x, y: rSh.y, rx: 14, ry: 14 });
    anchors.biceps.push({ x: lElb.x, y: lElb.y - 12, rx: 11, ry: 16 });
  }

  // =========================================================================
  // 4. HANGING LEG RAISE, CABLE CRUNCH, PLANK & AB WHEEL
  // =========================================================================
  else if (
    pattern === 'hanging_leg_raise' ||
    pattern === 'cable_crunch' ||
    pattern === 'plank' ||
    pattern === 'ab_wheel'
  ) {
    const s = sprites.side;

    if (pattern === 'hanging_leg_raise') {
      drawContactShadow(ctx, 310, floorY, 64, 8, 0.24);
      ctx.fillStyle = '#334155';
      ctx.fillRect(220, 34, 180, 10);
      ctx.fillRect(220, 34, 10, floorY - 34);
      ctx.fillRect(390, 34, 10, floorY - 34);

      const torsoX = 310;
      const torsoY = 178;
      drawLimbSprite(ctx, s.torso, torsoX, torsoY, 0, S);
      const neck = socketWorld(s, 'neck', torsoX, torsoY, 0, S);
      drawLimbSprite(ctx, s.head, neck.x, neck.y, 0, S);

      const sh = socketWorld(s, 'shoulder', torsoX, torsoY, 0, S);
      drawLimbSprite(ctx, s.armUpper, sh.x, sh.y, -3.05, S);
      const elb = boneEndWorld(s, 'shoulder', 'elbow', sh.x, sh.y, -3.05, S);
      drawLimbSprite(ctx, s.armForearm, elb.x, elb.y, -3.12, S);

      const hip = socketWorld(s, 'hip', torsoX, torsoY, 0, S);
      const legLiftAng = lerp(-0.08, -1.78, p);
      drawLimbSprite(ctx, s.thigh, hip.x + 6, hip.y - 3, legLiftAng, S, true);
      drawLimbSprite(ctx, s.thigh, hip.x, hip.y, legLiftAng, S);
      const knee = boneEndWorld(s, 'hip', 'knee', hip.x, hip.y, legLiftAng, S);
      drawLimbSprite(ctx, s.shin, knee.x, knee.y, legLiftAng + 0.14, S);
      anchors.abs.push({ x: torsoX + 18, y: torsoY - 38, rx: 14, ry: 28 });
    } else if (pattern === 'cable_crunch') {
      drawCableTower3D(ctx, { x: 205, topY: 42, floorY, p });
      drawContactShadow(ctx, 328, floorY, 64, 9, 0.3);
      const torsoX = 342;
      const torsoY = 264;
      const flexAng = lerp(-0.22, -1.15, p);

      const hip = socketWorld(s, 'hip', torsoX, torsoY, flexAng, S);
      drawLimbSprite(ctx, s.thigh, hip.x, hip.y, -0.05, S);
      const knee = boneEndWorld(s, 'hip', 'knee', hip.x, hip.y, -0.05, S);
      drawLimbSprite(ctx, s.shin, knee.x, knee.y, 1.5, S);

      drawLimbSprite(ctx, s.torso, torsoX, torsoY, flexAng, S);
      const neck = socketWorld(s, 'neck', torsoX, torsoY, flexAng, S);
      drawLimbSprite(ctx, s.head, neck.x, neck.y, flexAng * 0.85, S);

      const sh = socketWorld(s, 'shoulder', torsoX, torsoY, flexAng, S);
      drawLimbSprite(ctx, s.armUpper, sh.x, sh.y, flexAng - 1.3, S);
      const elb = boneEndWorld(s, 'shoulder', 'elbow', sh.x, sh.y, flexAng - 1.3, S);
      drawLimbSprite(ctx, s.armForearm, elb.x, elb.y, flexAng - 2.3, S);
      const hand = boneEndWorld(s, 'elbow', 'hand', elb.x, elb.y, flexAng - 2.3, S);

      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(205, 56);
      ctx.lineTo(hand.x, hand.y);
      ctx.stroke();

      anchors.abs.push({ x: torsoX - 24, y: torsoY - 38, rx: 16, ry: 28, deg: (flexAng * 180) / Math.PI });
    } else {
      const reach = pattern === 'ab_wheel' ? lerp(0, 1, p) : 0;
      const bodyAng = 1.32 - reach * 0.24;
      const torsoX = 278;
      const torsoY = floorY - 62 + reach * 22;

      drawContactShadow(ctx, 320, floorY, 130, 8, 0.26);
      const hip = socketWorld(s, 'hip', torsoX, torsoY, bodyAng, S);
      drawLimbSprite(ctx, s.thigh, hip.x, hip.y, bodyAng + 0.14, S);
      const knee = boneEndWorld(s, 'hip', 'knee', hip.x, hip.y, bodyAng + 0.14, S);
      drawLimbSprite(ctx, s.shin, knee.x, knee.y, bodyAng + 0.22, S);

      drawLimbSprite(ctx, s.torso, torsoX, torsoY, bodyAng, S);
      const neck = socketWorld(s, 'neck', torsoX, torsoY, bodyAng, S);
      drawLimbSprite(ctx, s.head, neck.x, neck.y, bodyAng * 0.75, S);

      const sh = socketWorld(s, 'shoulder', torsoX, torsoY, bodyAng, S);
      const uA = lerp(-0.15, -1.05, reach);
      drawLimbSprite(ctx, s.armUpper, sh.x, sh.y, uA, S);
      const elb = boneEndWorld(s, 'shoulder', 'elbow', sh.x, sh.y, uA, S);
      drawLimbSprite(ctx, s.armForearm, elb.x, elb.y, uA - 0.15, S);
      const hand = boneEndWorld(s, 'elbow', 'hand', elb.x, elb.y, uA - 0.15, S);

      if (pattern === 'ab_wheel') {
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(hand.x, floorY - 12, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 2.5;
        ctx.stroke();
      }
      anchors.abs.push({ x: (torsoX + sh.x) / 2, y: (torsoY + sh.y) / 2 + 12, rx: 28, ry: 12 });
    }
  }

  // =========================================================================
  // 5. SIDE SQUAT, LUNGE, DEADLIFT, ROW, CALF RAISE, PUSH-UP & DIP
  // =========================================================================
  else if (
    pattern === 'squat' ||
    pattern === 'split_squat' ||
    pattern === 'lunge' ||
    pattern === 'deadlift' ||
    pattern === 'row' ||
    pattern === 'single_arm_row' ||
    pattern === 'calf_raise' ||
    pattern === 'calf_raise_seated' ||
    pattern === 'pushup' ||
    pattern === 'dip'
  ) {
    const s = sprites.side;
    const isPushup = pattern === 'pushup';
    const isDip = pattern === 'dip';

    if (isPushup) {
      drawContactShadow(ctx, 315, floorY, 140, 8, 0.28);
      const plankDrop = lerp(0, 24, p);
      const torsoX = 254;
      const torsoY = 236 + plankDrop;
      const bodyAng = -1.32 + p * 0.08;

      const hip = socketWorld(s, 'hip', torsoX, torsoY, bodyAng, S);
      drawLimbSprite(ctx, s.thigh, hip.x, hip.y, bodyAng + 0.06, S);
      const knee = boneEndWorld(s, 'hip', 'knee', hip.x, hip.y, bodyAng + 0.06, S);
      drawLimbSprite(ctx, s.shin, knee.x, knee.y, bodyAng + 0.06, S);

      drawLimbSprite(ctx, s.torso, torsoX, torsoY, bodyAng, S);
      const neck = socketWorld(s, 'neck', torsoX, torsoY, bodyAng, S);
      drawLimbSprite(ctx, s.head, neck.x, neck.y, bodyAng + 0.35, S);

      const sh = socketWorld(s, 'shoulder', torsoX, torsoY, bodyAng, S);
      const upperA = lerp(-0.08, -1.15, p);
      const foreA = lerp(0.36, 0.52, p);
      drawLimbSprite(ctx, s.armUpper, sh.x, sh.y, upperA, S);
      const elb = boneEndWorld(s, 'shoulder', 'elbow', sh.x, sh.y, upperA, S);
      drawLimbSprite(ctx, s.armForearm, elb.x, elb.y, foreA, S);

      const chestSpot = offsetAlongAngle(torsoX, torsoY, bodyAng, 28, -135, S);
      anchors.chest.push({ x: chestSpot.x, y: chestSpot.y, rx: 24, ry: 16 });
      anchors.triceps.push({ x: (sh.x + elb.x) / 2, y: (sh.y + elb.y) / 2, rx: 12, ry: 12 });
    } else {
      const isRow = pattern === 'row' || pattern === 'single_arm_row';
      const isDeadlift = pattern === 'deadlift';
      const isSquat = pattern === 'squat' || pattern === 'split_squat' || pattern === 'lunge';
      const isCalf = pattern === 'calf_raise' || pattern === 'calf_raise_seated';

      const calfLift = isCalf ? lerp(0, -18, p) : 0;
      const depth = isSquat ? p : isDeadlift ? 1 - p : 0;
      const shinAng = isSquat ? lerp(-0.04, 0.34, depth) : -0.02;
      const thighAng = isSquat ? lerp(-0.05, -1.06, depth) : isDeadlift ? lerp(-0.08, -0.42, depth) : -0.22;
      const torsoAng = isRow
        ? 0.92
        : isDeadlift
        ? lerp(0.08, 1.04, depth)
        : isSquat
        ? lerp(0.12, 0.48, depth)
        : isDip
        ? 0.25
        : 0.05;

      const ankleX = 310;
      const ankleY = floorY - 10 + calfLift;
      const shinLen = (665 - 448) * S;
      const thighLen = (448 - 336) * S;

      const kneePos = {
        x: ankleX + Math.sin(shinAng) * shinLen,
        y: ankleY - Math.cos(shinAng) * shinLen,
      };
      const hipPos = {
        x: kneePos.x - Math.sin(-thighAng) * thighLen,
        y: kneePos.y - Math.cos(-thighAng) * thighLen,
      };

      drawContactShadow(ctx, ankleX + 6, floorY, 72, 9, 0.32);

      // Far leg darkened cleanly behind near leg
      drawLimbSprite(ctx, s.shin, kneePos.x + 12, kneePos.y - 4, shinAng, S, true);
      drawLimbSprite(ctx, s.thigh, hipPos.x + 10, hipPos.y - 3, thighAng, S, true);

      // Near shin -> thigh -> torso -> head
      drawLimbSprite(ctx, s.shin, kneePos.x, kneePos.y, shinAng, S);
      drawLimbSprite(ctx, s.thigh, hipPos.x, hipPos.y, thighAng, S);
      const torsoOrigin = offsetAlongAngle(hipPos.x, hipPos.y, torsoAng, s.ref.x - s.sockets.hip.x, s.ref.y - s.sockets.hip.y, S);
      drawLimbSprite(ctx, s.torso, torsoOrigin.x, torsoOrigin.y, torsoAng, S);
      const neck = socketWorld(s, 'neck', torsoOrigin.x, torsoOrigin.y, torsoAng, S);
      drawLimbSprite(ctx, s.head, neck.x, neck.y, torsoAng * 0.45, S);

      const sh = socketWorld(s, 'shoulder', torsoOrigin.x, torsoOrigin.y, torsoAng, S);
      const uArmAng = isSquat ? -0.45 : isRow ? lerp(0.0, -0.78, p) : isDip ? lerp(0.15, -0.95, p) : -torsoAng * 0.65;
      const fArmAng = isSquat ? -2.4 : isRow ? lerp(0.05, 0.15, p) : 0.05;

      drawLimbSprite(ctx, s.armUpper, sh.x, sh.y, uArmAng, S);
      const elb = boneEndWorld(s, 'shoulder', 'elbow', sh.x, sh.y, uArmAng, S);
      drawLimbSprite(ctx, s.armForearm, elb.x, elb.y, fArmAng, S);
      const hand = boneEndWorld(s, 'elbow', 'hand', elb.x, elb.y, fArmAng, S);

      if (isSquat && eqKind === 'barbell') {
        drawEquippedProp3D(ctx, 'barbell', sh.x - 10, sh.y - 12, 0, 1.0);
      } else if (!isCalf && !isDip) {
        drawEquippedProp3D(ctx, eqKind, hand.x, hand.y, 0, 0.96);
      }

      anchors.quads.push({ x: (hipPos.x + kneePos.x) / 2 + 12, y: (hipPos.y + kneePos.y) / 2, rx: 22, ry: 32 });
      anchors.hams.push({ x: (hipPos.x + kneePos.x) / 2 - 12, y: (hipPos.y + kneePos.y) / 2, rx: 18, ry: 30 });
      anchors.glutes.push({ x: hipPos.x - 14, y: hipPos.y, rx: 20, ry: 20 });
      anchors.calves.push({ x: (kneePos.x + ankleX) / 2 - 10, y: (kneePos.y + ankleY) / 2, rx: 14, ry: 26 });
      anchors.lats.push({ x: sh.x - 16, y: sh.y + 32, rx: 22, ry: 28 });
      anchors.lowerBack.push({ x: hipPos.x - 10, y: hipPos.y - 26, rx: 16, ry: 24 });
    }
  }

  // =========================================================================
  // 6. STANDING FRONT SYMMETRICAL EXERCISES (Exact Pixel-Locked Reconstruction!)
  // =========================================================================
  else {
    const f = sprites.front;
    const isFly = pattern === 'chest_fly' || pattern === 'cable_fly' || pattern === 'pec_deck';
    const isLateral = pattern === 'lateral_raise' || pattern === 'front_raise';
    const isOverhead = pattern === 'overhead_press';
    const isCurl = pattern === 'bicep_curl' || pattern === 'preacher_curl' || pattern === 'wrist_curl';
    const isPushdown = pattern === 'tricep_pushdown';

    // Exact standing pelvis reference so ground feet land at y = 324 (`floorY`)
    const torsoX = 320;
    const torsoY = 172;

    drawContactShadow(ctx, torsoX, floorY, 86, 10, 0.32);

    if (isFly && eqKind === 'cable') {
      drawCableTower3D(ctx, { x: 108, topY: 56, floorY, p });
      drawCableTower3D(ctx, { x: 532, topY: 56, floorY, p });
    } else if (isPushdown) {
      drawCableTower3D(ctx, { x: 320, topY: 36, floorY, p });
    }

    const neck = socketWorld(f, 'neck', torsoX, torsoY, 0, S);
    const lSh = socketWorld(f, 'lShoulder', torsoX, torsoY, 0, S);
    const rSh = socketWorld(f, 'rShoulder', torsoX, torsoY, 0, S);
    const lHip = socketWorld(f, 'lHip', torsoX, torsoY, 0, S);
    const rHip = socketWorld(f, 'rHip', torsoX, torsoY, 0, S);

    // Legs snapped directly to hip & knee sockets!
    drawLimbSprite(ctx, f.lThigh, lHip.x, lHip.y, 0, S);
    const lK = boneEndWorld(f, 'lHip', 'lKnee', lHip.x, lHip.y, 0, S);
    drawLimbSprite(ctx, f.lShin, lK.x, lK.y, 0, S);

    drawLimbSprite(ctx, f.rThigh, rHip.x, rHip.y, 0, S);
    const rK = boneEndWorld(f, 'rHip', 'rKnee', rHip.x, rHip.y, 0, S);
    drawLimbSprite(ctx, f.rShin, rK.x, rK.y, 0, S);

    // Torso & Head
    drawLimbSprite(ctx, f.torso, torsoX, torsoY, 0, S);
    drawLimbSprite(ctx, f.head, neck.x, neck.y, 0, S);

    let lUpperAng = 0.0;
    let lForeAng = 0.0;
    let lForeScaleY = 1.0;

    if (isLateral) {
      lUpperAng = lerp(0.02, 1.32, p);
      lForeAng = lerp(0.02, 1.32, p);
    } else if (isOverhead) {
      lUpperAng = lerp(1.18, 2.85, p);
      lForeAng = lerp(2.89, 2.89, p);
    } else if (isFly) {
      lUpperAng = lerp(1.32, 0.35, p);
      lForeAng = lerp(1.12, -0.35, p);
    } else if (isCurl) {
      // Smooth 2.5D foreshortened bicep curl straight toward front shoulders
      lUpperAng = -0.18;
      if (p < 0.48) {
        const tHalf = p / 0.48;
        lForeAng = -0.16;
        lForeScaleY = lerp(1.0, 0.25, tHalf);
      } else {
        const tHalf = (p - 0.48) / 0.52;
        lForeAng = 2.89;
        lForeScaleY = lerp(0.25, 0.92, tHalf);
      }
    } else if (isPushdown) {
      lUpperAng = -0.18;
      if (p < 0.45) {
        const tHalf = p / 0.45;
        lForeAng = 2.89;
        lForeScaleY = lerp(0.85, 0.25, tHalf);
      } else {
        const tHalf = (p - 0.45) / 0.55;
        lForeAng = -0.16;
        lForeScaleY = lerp(0.25, 1.0, tHalf);
      }
    } else {
      lUpperAng = lerp(0.25, 1.15, p);
      lForeAng = lerp(0.15, 0.95, p);
    }

    const rUpperAng = -lUpperAng;
    const rForeAng = -lForeAng;

    drawLimbSprite(ctx, f.lUpperArm, lSh.x, lSh.y, lUpperAng, S);
    const lElb = boneEndWorld(f, 'lShoulder', 'lElbow', lSh.x, lSh.y, lUpperAng, S);
    drawLimbSprite(ctx, f.lForearm, lElb.x, lElb.y, lForeAng, S, false, lForeScaleY);
    const lHand = offsetAlongAngle(
      lElb.x,
      lElb.y,
      lForeAng,
      (f.sockets.lHand.x - f.sockets.lElbow.x),
      (f.sockets.lHand.y - f.sockets.lElbow.y) * lForeScaleY,
      S
    );

    drawLimbSprite(ctx, f.rUpperArm, rSh.x, rSh.y, rUpperAng, S);
    const rElb = boneEndWorld(f, 'rShoulder', 'rElbow', rSh.x, rSh.y, rUpperAng, S);
    drawLimbSprite(ctx, f.rForearm, rElb.x, rElb.y, rForeAng, S, false, lForeScaleY);
    const rHand = offsetAlongAngle(
      rElb.x,
      rElb.y,
      rForeAng,
      (f.sockets.rHand.x - f.sockets.rElbow.x),
      (f.sockets.rHand.y - f.sockets.rElbow.y) * lForeScaleY,
      S
    );

    if (eqKind === 'barbell' || eqKind === 'ez-bar') {
      drawEquippedProp3D(ctx, eqKind, (lHand.x + rHand.x) / 2, (lHand.y + rHand.y) / 2, 0, 1.0);
    } else {
      drawEquippedProp3D(ctx, eqKind, lHand.x, lHand.y, (lForeAng * 180) / Math.PI * 0.2, 0.92);
      drawEquippedProp3D(ctx, eqKind, rHand.x, rHand.y, (rForeAng * 180) / Math.PI * 0.2, 0.92);
    }

    if (isFly && eqKind === 'cable') {
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(108, 96);
      ctx.lineTo(lHand.x, lHand.y);
      ctx.moveTo(532, 96);
      ctx.lineTo(rHand.x, rHand.y);
      ctx.stroke();
    }

    anchors.chest.push(
      { x: torsoX - 20, y: torsoY - 145 * S, rx: 18, ry: 12 },
      { x: torsoX + 20, y: torsoY - 145 * S, rx: 18, ry: 12 }
    );
    anchors.frontDelt.push({ x: lSh.x, y: lSh.y, rx: 13, ry: 12 }, { x: rSh.x, y: rSh.y, rx: 13, ry: 12 });
    anchors.biceps.push(
      { x: (lSh.x + lElb.x) / 2, y: (lSh.y + lElb.y) / 2, rx: 10, ry: 16 },
      { x: (rSh.x + rElb.x) / 2, y: (rSh.y + rElb.y) / 2, rx: 10, ry: 16 }
    );
    anchors.forearms.push(
      { x: (lElb.x + lHand.x) / 2, y: (lElb.y + lHand.y) / 2, rx: 8, ry: 16 },
      { x: (rElb.x + rHand.x) / 2, y: (rElb.y + rHand.y) / 2, rx: 8, ry: 16 }
    );
    anchors.abs.push({ x: torsoX, y: torsoY - 76 * S, rx: 16, ry: 26 });
    anchors.obliques.push(
      { x: torsoX - 24, y: torsoY - 76 * S, rx: 10, ry: 22 },
      { x: torsoX + 24, y: torsoY - 76 * S, rx: 10, ry: 22 }
    );
    anchors.quads.push(
      { x: lHip.x, y: (lHip.y + lK.y) / 2, rx: 14, ry: 28 },
      { x: rHip.x, y: (rHip.y + rK.y) / 2, rx: 14, ry: 28 }
    );
  }

  drawAnatomicalMuscleGlow(ctx, {
    exercise,
    anchors,
    phaseProgress: p,
    showMuscleOverlay,
    accentMode,
    maskCanvas,
  });
  _charMaskCtx = null;

  ctx.restore();

  if (motionDirection) {
    drawMotionDirectionArrows(ctx, width, height, motionDirection, exercise.forceType);
  }

  if (showHud) {
    const phaseInfo = getRepPhaseInfo(p, true);
    const pad = Math.max(12, Math.round(width * 0.02));
    ctx.save();
    ctx.fillStyle = isDarkTheme ? 'rgba(9,21,17,0.88)' : 'rgba(255,255,255,0.92)';
    ctx.strokeStyle = isDarkTheme ? 'rgba(16,185,129,0.45)' : 'rgba(210,217,197,0.95)';
    ctx.lineWidth = 1.5;
    const pillW = Math.min(width - pad * 2, Math.max(260, exercise.name.length * 9 + 64));
    ctx.beginPath();
    ctx.roundRect(pad, pad, pillW, 44, 12);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = isDarkTheme ? '#F8FAFC' : '#173F35';
    ctx.font = 'bold 14px system-ui, -apple-system, sans-serif';
    ctx.fillText(exercise.name, pad + 14, pad + 19);

    ctx.fillStyle = accentMode === 'emerald' ? '#18C978' : '#DC1414';
    ctx.font = '600 11px system-ui, -apple-system, sans-serif';
    ctx.fillText(
      `GymGuide 2.5D • ${phaseInfo.shortLabel} • Rep ${String(repCount).padStart(2, '0')}`,
      pad + 14,
      pad + 35
    );
    ctx.restore();
  }
}
