// ============================================================================
// GYMGUIDE - 2.5D STUDIO ENVIRONMENT, VOLUMETRIC PROPS & MUSCLE FIBER SHADING
// Adds depth perspective floor, contact shadows, moving cable weight stacks,
// beveled 3D-shaded iron plates/dumbbells/benches, gripped hands, and sculpted
// muscle fiber illumination overlays.
// ============================================================================

/**
 * Draws a 3D perspective tiled studio stage with depth fog, spotlight halo, and horizon.
 */
export function drawStudioEnvironment(ctx, width, height, isDarkTheme) {
  const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
  if (isDarkTheme) {
    skyGrad.addColorStop(0, '#182028');
    skyGrad.addColorStop(0.62, '#11171e');
    skyGrad.addColorStop(1, '#090d12');
  } else {
    skyGrad.addColorStop(0, '#F4F5EC');
    skyGrad.addColorStop(0.65, '#ECEFE2');
    skyGrad.addColorStop(1, '#DCE2CE');
  }
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, width, height);

  // Dark commercial gym steel uprights, rack silhouette & studio rim lighting
  if (isDarkTheme) {
    ctx.save();
    // Overhead architectural lighting ceiling beams
    const ceilingGlow = ctx.createLinearGradient(0, 0, 0, height * 0.45);
    ceilingGlow.addColorStop(0, 'rgba(148, 163, 184, 0.14)');
    ceilingGlow.addColorStop(1, 'rgba(15, 23, 42, 0)');
    ctx.fillStyle = ceilingGlow;
    ctx.fillRect(0, 0, width, height * 0.45);

    // Steel cage pillars with soft specular edge
    [width * 0.07, width * 0.14, width * 0.84, width * 0.91].forEach((rx) => {
      ctx.fillStyle = 'rgba(51, 65, 85, 0.34)';
      ctx.fillRect(rx, height * 0.08, 12, height * 0.64);
      ctx.fillStyle = 'rgba(203, 213, 225, 0.10)';
      ctx.fillRect(rx + 1, height * 0.08, 2, height * 0.64);
    });
    // Tiered dumbbell racks in softly recessed background
    for (let row = 0; row < 2; row += 1) {
      const sy = height * (0.44 + row * 0.13);
      ctx.fillStyle = 'rgba(30, 41, 59, 0.72)';
      ctx.fillRect(width * 0.02, sy, width * 0.24, 6);
      ctx.fillRect(width * 0.75, sy, width * 0.23, 6);
      for (let d = 0; d < 4; d += 1) {
        const dxL = width * (0.04 + d * 0.052);
        const dxR = width * (0.77 + d * 0.052);
        ctx.fillStyle = 'rgba(15, 23, 42, 0.86)';
        [dxL, dxR].forEach((dx) => {
          ctx.beginPath();
          ctx.arc(dx, sy - 7, 7, 0, Math.PI * 2);
          ctx.arc(dx + 14, sy - 7, 7, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = 'rgba(148, 163, 184, 0.22)';
          ctx.fillRect(dx + 3, sy - 8, 8, 2);
          ctx.fillStyle = 'rgba(15, 23, 42, 0.86)';
        });
      }
    }
    ctx.restore();
  }

  // Warm crisp overhead & rear key studio cone so skin anatomy reads sharp & clear
  const spotGrad = ctx.createRadialGradient(
    width * 0.5,
    height * 0.28,
    24,
    width * 0.5,
    height * 0.48,
    width * 0.58
  );
  if (isDarkTheme) {
    spotGrad.addColorStop(0, 'rgba(226, 232, 240, 0.14)');
    spotGrad.addColorStop(0.45, 'rgba(24, 201, 120, 0.12)');
    spotGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  } else {
    spotGrad.addColorStop(0, 'rgba(255, 255, 255, 0.65)');
    spotGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
  }
  ctx.fillStyle = spotGrad;
  ctx.fillRect(0, 0, width, height);

  // Perspective floor trapezoid
  const horizonY = height * 0.72;
  const floorGrad = ctx.createLinearGradient(0, horizonY, 0, height);
  if (isDarkTheme) {
    floorGrad.addColorStop(0, '#121820');
    floorGrad.addColorStop(1, '#080b10');
  } else {
    floorGrad.addColorStop(0, '#DDE2CE');
    floorGrad.addColorStop(1, '#C5CEB4');
  }
  ctx.fillStyle = floorGrad;
  ctx.fillRect(0, horizonY, width, height - horizonY);

  // Horizon divider gleam
  ctx.strokeStyle = isDarkTheme ? 'rgba(24,201,120,0.22)' : 'rgba(23,63,53,0.16)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, horizonY);
  ctx.lineTo(width, horizonY);
  ctx.stroke();

  // Perspective converging floor tiles for immediate 3D depth perception
  const vanishX = width * 0.5;
  ctx.strokeStyle = isDarkTheme ? 'rgba(24,201,120,0.08)' : 'rgba(23,63,53,0.07)';
  ctx.lineWidth = 1;
  for (let i = -8; i <= 8; i += 1) {
    ctx.beginPath();
    ctx.moveTo(vanishX + i * (width * 0.045), horizonY);
    ctx.lineTo(vanishX + i * (width * 0.145), height);
    ctx.stroke();
  }
  const rows = [0.76, 0.81, 0.88, 0.96];
  rows.forEach((r) => {
    const ry = height * r;
    ctx.beginPath();
    ctx.moveTo(0, ry);
    ctx.lineTo(width, ry);
    ctx.stroke();
  });
}

/**
 * Draws bright emerald curved biomechanical motion arrows showing exact concentric or eccentric path.
 */
export function drawMotionDirectionArrows(ctx, width, height, direction = null, forceType = 'Push') {
  if (!direction) return;
  const isUpwardForce = !String(forceType || '').toLowerCase().includes('pull');
  const pointsUp = direction === 'concentric' ? isUpwardForce : !isUpwardForce;

  const drawSingleCurvedArrow = (xStart, yStart, cx, cy, xEnd, yEnd) => {
    ctx.save();
    ctx.shadowColor = 'rgba(24, 201, 120, 0.65)';
    ctx.shadowBlur = 10;
    ctx.strokeStyle = '#18C978';
    ctx.fillStyle = '#18C978';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';

    ctx.beginPath();
    ctx.moveTo(xStart, yStart);
    ctx.quadraticCurveTo(cx, cy, xEnd, yEnd);
    ctx.stroke();

    // Arrowhead angled smoothly along curve tangent at endpoint
    const angle = Math.atan2(yEnd - cy, xEnd - cx);
    const headLen = 13;
    ctx.beginPath();
    ctx.moveTo(xEnd, yEnd);
    ctx.lineTo(
      xEnd - headLen * Math.cos(angle - Math.PI / 6),
      yEnd - headLen * Math.sin(angle - Math.PI / 6)
    );
    ctx.lineTo(
      xEnd - headLen * Math.cos(angle + Math.PI / 6),
      yEnd - headLen * Math.sin(angle + Math.PI / 6)
    );
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  };

  if (pointsUp) {
    // Upward inward arc arrows framing dumbbells without overlapping pill headers
    drawSingleCurvedArrow(width * 0.25, height * 0.58, width * 0.22, height * 0.42, width * 0.28, height * 0.28);
    drawSingleCurvedArrow(width * 0.75, height * 0.58, width * 0.78, height * 0.42, width * 0.72, height * 0.28);
  } else {
    // Downward controlled eccentric return arrows
    drawSingleCurvedArrow(width * 0.28, height * 0.28, width * 0.21, height * 0.44, width * 0.24, height * 0.62);
    drawSingleCurvedArrow(width * 0.72, height * 0.28, width * 0.79, height * 0.44, width * 0.76, height * 0.62);
  }
}

/**
 * Draws a soft grounded shadow ellipse directly beneath character/equipment on the 3D floor.
 */
export function drawContactShadow(ctx, cx, floorY, rx, ry = 10, opacity = 0.28) {
  ctx.save();
  const grad = ctx.createRadialGradient(cx, floorY, rx * 0.15, cx, floorY, rx);
  grad.addColorStop(0, `rgba(2, 6, 23, ${opacity})`);
  grad.addColorStop(0.65, `rgba(2, 6, 23, ${opacity * 0.45})`);
  grad.addColorStop(1, 'rgba(2, 6, 23, 0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.ellipse(cx, floorY, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/**
 * Draws a 3D metallic-shaded adjustable bench frame with upholstery highlight bevel.
 */
export function draw3DBench(ctx, { anchorX, seatY, backAngleDeg = 0, floorY = 326, isSeatedPad = false }) {
  ctx.save();

  // Steel base beam & chrome upright legs
  const frameGrad = ctx.createLinearGradient(anchorX - 140, 270, anchorX + 120, 285);
  frameGrad.addColorStop(0, '#334155');
  frameGrad.addColorStop(0.5, '#64748b');
  frameGrad.addColorStop(1, '#1e293b');

  drawContactShadow(ctx, anchorX - 20, floorY, 155, 11, 0.34);

  // Bench feet pads
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(anchorX - 134, floorY - 7, 36, 7);
  ctx.fillRect(anchorX + 68, floorY - 7, 36, 7);

  // Main upright legs
  ctx.fillStyle = '#475569';
  ctx.fillRect(anchorX - 122, 266, 12, floorY - 270);
  ctx.fillRect(anchorX + 80, 266, 12, floorY - 270);

  // Horizontal structural spine with top highlight
  ctx.fillStyle = frameGrad;
  ctx.beginPath();
  ctx.roundRect(anchorX - 130, 262, 232, 12, 4);
  ctx.fill();

  // Seat cushion (perspective top highlight + stitched dark leather base)
  ctx.fillStyle = '#1e293b';
  ctx.beginPath();
  ctx.roundRect(anchorX - 12, seatY, 72, 18, 6);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.1)';
  ctx.fillRect(anchorX - 8, seatY + 2, 64, 3);

  // Adjustable angled backrest (hinged cleanly near anchorX - 12, seatY + 8)
  ctx.save();
  ctx.translate(anchorX - 10, seatY + 8);
  ctx.rotate((backAngleDeg * Math.PI) / 180);

  // Steel support strut underneath backrest
  ctx.fillStyle = '#475569';
  ctx.fillRect(-132, 12, 128, 7);

  // Leather backrest pad with top bevel
  const padGrad = ctx.createLinearGradient(0, -10, 0, 14);
  padGrad.addColorStop(0, '#334155');
  padGrad.addColorStop(0.25, '#1e293b');
  padGrad.addColorStop(1, '#0f172a');
  ctx.fillStyle = padGrad;
  ctx.beginPath();
  ctx.roundRect(-144, -8, isSeatedPad ? 120 : 146, 20, 7);
  ctx.fill();

  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  ctx.fillRect(-140, -6, isSeatedPad ? 112 : 138, 3);
  ctx.restore();

  ctx.restore();
}

/**
 * Draws a 2.5D cable pulley column with dynamic rising/falling weight plates synced to contraction `p`.
 */
export function drawCableTower3D(ctx, { x, topY = 44, floorY = 326, p = 0.5 }) {
  ctx.save();
  drawContactShadow(ctx, x, floorY, 56, 9, 0.3);

  // Steel tower frame
  const colGrad = ctx.createLinearGradient(x - 18, topY, x + 18, topY);
  colGrad.addColorStop(0, '#1e293b');
  colGrad.addColorStop(0.5, '#475569');
  colGrad.addColorStop(1, '#0f172a');

  ctx.fillStyle = colGrad;
  ctx.fillRect(x - 24, topY, 10, floorY - topY);
  ctx.fillRect(x + 14, topY, 10, floorY - topY);
  ctx.fillRect(x - 32, topY, 64, 12);
  ctx.fillRect(x - 34, floorY - 10, 68, 10);

  // Chrome guide rails
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - 9, topY + 12);
  ctx.lineTo(x - 9, floorY - 10);
  ctx.moveTo(x + 9, topY + 12);
  ctx.lineTo(x + 9, floorY - 10);
  ctx.stroke();

  // Dynamic moving weight stack! Rises upward as muscle contracts (`p: 0 -> 1`)
  const stackLift = p * 54;
  const stackTopY = floorY - 82 - stackLift;
  for (let i = 0; i < 6; i += 1) {
    const py = stackTopY + i * 10;
    ctx.fillStyle = i === 0 ? '#10b981' : '#1e293b';
    ctx.beginPath();
    ctx.roundRect(x - 16, py, 32, 8, 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.16)';
    ctx.fillRect(x - 14, py + 1, 28, 1.5);
  }

  // Top pulley wheel
  ctx.fillStyle = '#334155';
  ctx.beginPath();
  ctx.arc(x, topY + 14, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#94a3b8';
  ctx.beginPath();
  ctx.arc(x, topY + 14, 3.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * Draws volumetric beveled 3D equipment (Dumbbell, Barbell, Kettlebell, Cable Attachment)
 * plus a sculpted skin-toned closed fist wrapping around the bar so grips never look detached.
 */
export function drawEquippedProp3D(ctx, eqKind, x, y, angleDeg = 0, scale = 1, isFarLimb = false) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate((angleDeg * Math.PI) / 180);
  ctx.scale(scale, scale);
  if (isFarLimb) {
    ctx.filter = 'brightness(0.75)';
  }

  if (eqKind === 'barbell' || eqKind === 'ez-bar') {
    // Chrome shaft
    const barGrad = ctx.createLinearGradient(0, -3, 0, 3);
    barGrad.addColorStop(0, '#e2e8f0');
    barGrad.addColorStop(0.5, '#94a3b8');
    barGrad.addColorStop(1, '#334155');
    ctx.fillStyle = barGrad;
    ctx.fillRect(-62, -2.8, 124, 5.6);

    // 3D layered bumper plates with highlight rim
    [-58, 46].forEach((px) => {
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.roundRect(px, -21, 11, 42, 3);
      ctx.fill();
      ctx.fillStyle = '#334155';
      ctx.fillRect(px + 1.5, -19, 2.5, 38);
      ctx.fillStyle = '#10b981';
      ctx.fillRect(px + 1, -13, 9, 3);
    });
    [-65, 58].forEach((px) => {
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.roundRect(px, -15, 7, 30, 2);
      ctx.fill();
    });
  } else if (eqKind === 'dumbbell') {
    // Knurled steel handle
    const handleGrad = ctx.createLinearGradient(0, -2.5, 0, 2.5);
    handleGrad.addColorStop(0, '#cbd5e1');
    handleGrad.addColorStop(1, '#475569');
    ctx.fillStyle = handleGrad;
    ctx.fillRect(-17, -2.5, 34, 5);

    // Beveled hex iron bells on both sides
    [-21, 11].forEach((bx) => {
      const bellGrad = ctx.createLinearGradient(bx, -11, bx + 10, 11);
      bellGrad.addColorStop(0, '#334155');
      bellGrad.addColorStop(0.45, '#1e293b');
      bellGrad.addColorStop(1, '#090d16');
      ctx.fillStyle = bellGrad;
      ctx.beginPath();
      ctx.roundRect(bx, -11, 10, 22, 3);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.16)';
      ctx.fillRect(bx + 1.5, -9, 7, 2);
      ctx.fillStyle = '#10b981';
      ctx.fillRect(bx + 3.5, -4, 3, 8);
    });
  } else if (eqKind === 'kettlebell') {
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, -10, 8, Math.PI, 0);
    ctx.stroke();

    const kbGrad = ctx.createRadialGradient(-4, -1, 2, 0, 4, 14);
    kbGrad.addColorStop(0, '#475569');
    kbGrad.addColorStop(0.5, '#1e293b');
    kbGrad.addColorStop(1, '#020617');
    ctx.fillStyle = kbGrad;
    ctx.beginPath();
    ctx.arc(0, 4, 13, 0, Math.PI * 2);
    ctx.fill();
  } else if (eqKind === 'cable' || eqKind === 'machine') {
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.roundRect(-8, -6, 16, 12, 3);
    ctx.fill();
    ctx.fillStyle = '#10b981';
    ctx.fillRect(-6, -1.5, 12, 3);
  }

  // Wrapped anatomical fist gripping the bar when holding equipment
  if (eqKind !== 'bodyweight') {
    const fistGrad = ctx.createRadialGradient(-2, -2, 1, 0, 0, 9);
    fistGrad.addColorStop(0, '#E8B69A');
    fistGrad.addColorStop(0.6, '#C88D74');
    fistGrad.addColorStop(1, '#8D5843');
    ctx.fillStyle = fistGrad;
    ctx.beginPath();
    ctx.roundRect(-6.5, -5.5, 13, 11, 4.5);
    ctx.fill();
    ctx.strokeStyle = 'rgba(85,45,30,0.45)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  ctx.restore();
}

let _glowCanvas = null;
let _glowCtx = null;

function getGlowLayer(w, h) {
  if (typeof document === 'undefined' || !w || !h) return null;
  if (!_glowCanvas) {
    _glowCanvas = document.createElement('canvas');
    _glowCtx = _glowCanvas.getContext('2d');
  }
  if (_glowCanvas.width !== w || _glowCanvas.height !== h) {
    _glowCanvas.width = w;
    _glowCanvas.height = h;
  } else {
    _glowCtx.setTransform(1, 0, 0, 1, 0, 0);
    _glowCtx.clearRect(0, 0, w, h);
  }
  return { canvas: _glowCanvas, ctx: _glowCtx };
}

/**
 * Renders striated volumetric anatomical muscle activation inside target areas.
 * Masks strictly within the athlete silhouette and stains muscle fibers with Canvas 'color' + 'soft-light'.
 */
export function drawAnatomicalMuscleGlow(
  ctx,
  { exercise, anchors, phaseProgress, showMuscleOverlay, accentMode, maskCanvas = null }
) {
  if (!showMuscleOverlay || !exercise) return;
  const p = Math.max(0, Math.min(1, phaseProgress));
  const primarySlugs = new Set((exercise.primaryMuscles || []).map((m) => m.slug));
  const secondarySlugs = new Set((exercise.secondaryMuscles || []).map((m) => m.slug));

  const primaryCol = accentMode === 'emerald' ? '#18C978' : '#DC1414';
  const primaryRim = accentMode === 'emerald' ? '#34D399' : '#FCA5A5';
  const secondaryCol = accentMode === 'emerald' ? '#76CBB3' : '#F59E0B';

  const canMask =
    maskCanvas &&
    ctx.canvas &&
    ctx.canvas.width > 0 &&
    ctx.canvas.height > 0 &&
    typeof ctx.getTransform === 'function';
  const glowLayer = canMask ? getGlowLayer(ctx.canvas.width, ctx.canvas.height) : null;
  const targetCtx = glowLayer ? glowLayer.ctx : ctx;

  if (glowLayer) {
    targetCtx.setTransform(ctx.getTransform());
  }

  const paintZone = (zone, color, rimColor, intensity) => {
    targetCtx.save();
    targetCtx.translate(zone.x, zone.y);
    targetCtx.rotate(((zone.deg || 0) * Math.PI) / 180);

    // Subtle color glow pass
    const grad = targetCtx.createRadialGradient(
      0,
      0,
      Math.min(zone.rx, zone.ry) * 0.14,
      0,
      0,
      Math.max(zone.rx, zone.ry) * 1.05
    );
    grad.addColorStop(0, color);
    grad.addColorStop(0.65, color);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    targetCtx.globalAlpha = Math.min(1, intensity * 0.94);
    targetCtx.fillStyle = grad;
    targetCtx.beginPath();
    targetCtx.ellipse(0, 0, zone.rx, zone.ry, 0, 0, Math.PI * 2);
    targetCtx.fill();

    // Striated muscle fiber highlights along muscle axis
    targetCtx.globalAlpha = Math.min(0.65, intensity * 0.48);
    targetCtx.strokeStyle = rimColor;
    targetCtx.lineWidth = 1.05;
    for (let f = -2; f <= 2; f += 1) {
      const fy = (f / 3) * zone.ry * 0.62;
      targetCtx.beginPath();
      targetCtx.moveTo(-zone.rx * 0.58, fy);
      targetCtx.quadraticCurveTo(0, fy * 0.72, zone.rx * 0.58, fy);
      targetCtx.stroke();
    }

    targetCtx.restore();
  };

  const applyForSlug = (slug, zones) => {
    const isPrim = primarySlugs.has(slug);
    const isSec = !isPrim && secondarySlugs.has(slug);
    if (!isPrim && !isSec) return;
    const col = isPrim ? primaryCol : secondaryCol;
    const rim = isPrim ? primaryRim : secondaryCol;
    const alpha = isPrim ? 0.58 + 0.40 * p : 0.36 + 0.28 * p;
    zones.forEach((z) => {
      if (z) paintZone(z, col, rim, alpha);
    });
  };

  Object.entries(anchors).forEach(([key, zones]) => {
    const slugMap = {
      chest: 'chest',
      frontDelt: 'front-deltoids',
      rearDelt: 'rear-deltoids',
      biceps: 'biceps',
      triceps: 'triceps',
      forearms: 'forearms',
      lats: 'latissimus-dorsi',
      traps: 'trapezius',
      lowerBack: 'lower-back',
      abs: 'rectus-abdominis',
      obliques: 'obliques',
      quads: 'quadriceps',
      hams: 'hamstrings',
      glutes: 'glutes',
      calves: 'calves',
    };
    if (slugMap[key]) applyForSlug(slugMap[key], zones);
  });

  if (glowLayer) {
    // Strictly clip highlights inside the rendered athlete body mask — zero outer haze
    glowLayer.ctx.save();
    glowLayer.ctx.setTransform(1, 0, 0, 1, 0, 0);
    glowLayer.ctx.globalCompositeOperation = 'destination-in';
    glowLayer.ctx.globalAlpha = 1;
    glowLayer.ctx.drawImage(maskCanvas, 0, 0);
    glowLayer.ctx.restore();

    // Stain silver striations to vivid emerald/teal while keeping dark grooves razor-sharp
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = 'color';
    ctx.globalAlpha = 0.94;
    ctx.drawImage(glowLayer.canvas, 0, 0);

    ctx.globalCompositeOperation = 'soft-light';
    ctx.globalAlpha = 0.28;
    ctx.drawImage(glowLayer.canvas, 0, 0);
    ctx.restore();
  }
}
