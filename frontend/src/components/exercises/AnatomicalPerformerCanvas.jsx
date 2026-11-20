import React, { useId } from 'react';
import {
  resolveEquipmentKind,
  resolveMovementPattern,
} from '../../utils/movementKinematics';

function lerp(a, b, t) {
  return a + (b - a) * t;
}

/**
 * Reusable 3D-Styled Anatomical Character Exercise Performer
 * Renders any of the 69 seeded exercises across every movement pattern and equipment type,
 * parameterized cleanly by `phaseProgress` (0..1) and `activeIntensity`.
 */
export function AnatomicalPerformerCanvas({
  exercise,
  equipmentSlug = 'ALL',
  phaseProgress = 0.5,
  activeIntensity = 0.85,
  compact = false,
}) {
  const uid = useId().replace(/:/g, '');
  if (!exercise) return null;

  const pattern = resolveMovementPattern(exercise);
  const eqKind = resolveEquipmentKind(exercise, equipmentSlug);
  const p = Math.max(0, Math.min(1, phaseProgress));
  const hitGlow = Math.max(0.35, Math.min(1, activeIntensity));
  const nameLower = (exercise.name || '').toLowerCase();
  const isIncline = nameLower.includes('incline') || nameLower.includes('low-to-high');
  const isDecline = nameLower.includes('decline') || nameLower.includes('high-to-low');

  const muscleFillId = `url(#hitMuscleGrad-${uid})`;

  const drawEquipmentWeight = (x, y, size = 1) => {
    if (eqKind === 'barbell' || eqKind === 'ez-bar' || eqKind === 'machine') {
      return (
        <g transform={`translate(${x}, ${y}) scale(${size})`}>
          <line x1="-42" y1="0" x2="42" y2="0" stroke="#37413C" strokeWidth="4" strokeLinecap="round" />
          <rect x="-46" y="-12" width="7" height="24" rx="2" fill="#173F35" stroke="#102E27" strokeWidth="1" />
          <rect x="-52" y="-9" width="5" height="18" rx="1.5" fill="#263B2D" />
          <rect x="39" y="-12" width="7" height="24" rx="2" fill="#173F35" stroke="#102E27" strokeWidth="1" />
          <rect x="47" y="-9" width="5" height="18" rx="1.5" fill="#263B2D" />
        </g>
      );
    }
    if (eqKind === 'kettlebell') {
      return (
        <g transform={`translate(${x}, ${y}) scale(${size})`}>
          <path d="M-6,-10 A6,6 0 0,1 6,-10" fill="none" stroke="#263B2D" strokeWidth="3" />
          <circle cx="0" cy="2" r="9.5" fill="#173F35" stroke="#102E27" strokeWidth="1.5" />
        </g>
      );
    }
    if (eqKind === 'dumbbell') {
      return (
        <g transform={`translate(${x}, ${y}) scale(${size})`}>
          <line x1="-10" y1="0" x2="10" y2="0" stroke="#37413C" strokeWidth="3.5" />
          <rect x="-13" y="-7" width="5" height="14" rx="1.5" fill="#173F35" />
          <rect x="8" y="-7" width="5" height="14" rx="1.5" fill="#173F35" />
        </g>
      );
    }
    return null;
  };

  const renderPose = () => {
    const primarySlug = (exercise.primaryMuscles?.[0]?.slug || '').toLowerCase();

    // 1. BENCH PRESS & SKULL CRUSHER (Lying on Bench)
    if (pattern === 'bench_press' || pattern === 'skull_crusher') {
      const benchTilt = isIncline ? -18 : isDecline ? 12 : 0;
      const pressY = pattern === 'skull_crusher' ? lerp(104, 68, p) : lerp(116, 70, p);
      const forearmX = pattern === 'skull_crusher' ? lerp(88, 108, p) : 112;
      return (
        <g>
          <rect x="48" y="150" width="164" height="7" rx="3.5" fill="#8C998A" />
          <rect x="68" y="157" width="8" height="24" rx="2" fill="#465548" />
          <rect x="184" y="157" width="8" height="24" rx="2" fill="#465548" />
          {eqKind === 'machine' && (
            <rect x="38" y="60" width="10" height="122" rx="3" fill="#465548" />
          )}

          <g transform={`rotate(${benchTilt} 128 134)`}>
            <rect x="60" y="132" width="112" height="11" rx="5" fill="#263B2D" />
            <path d="M 166 126 L 194 142 L 196 178" fill="none" stroke={`url(#skinGrad-${uid})`} strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
            <rect x="140" y="114" width="32" height="19" rx="7" fill="#3B423E" />
            <rect x="88" y="113" width="56" height="20" rx="8" fill={`url(#muscleGray-${uid})`} />
            {pattern === 'bench_press' && (
              <ellipse cx="110" cy="118" rx="17" ry="9" fill={muscleFillId} opacity={hitGlow} />
            )}
            <circle cx="74" cy="118" r="11.5" fill={`url(#skinGrad-${uid})`} />
            <path d="M 64 114 C 66 105 78 104 82 111 L 68 118 Z" fill="#1F1B18" />
          </g>

          {pattern === 'skull_crusher' ? (
            <>
              <polyline points={`108,118 108,88 ${forearmX},${pressY}`} fill="none" stroke={`url(#skinGrad-${uid})`} strokeWidth="8.5" strokeLinecap="round" strokeLinejoin="round" />
              <ellipse cx="109" cy="100" rx="7" ry="10" fill={muscleFillId} opacity={hitGlow} />
              {drawEquipmentWeight(forearmX, pressY, 0.85)}
            </>
          ) : (
            <>
              <line x1="112" y1="119" x2="112" y2={pressY} stroke={`url(#skinGrad-${uid})`} strokeWidth="8.5" strokeLinecap="round" />
              {eqKind === 'dumbbell' ? (
                <>
                  {drawEquipmentWeight(98, pressY, 0.9)}
                  {drawEquipmentWeight(126, pressY, 0.9)}
                </>
              ) : (
                drawEquipmentWeight(112, pressY, 0.95)
              )}
            </>
          )}
        </g>
      );
    }

    // 2. CHEST FLY / PEC DECK / CABLE CROSSOVER / REVERSE FLY / FACE PULL
    if (pattern === 'chest_fly' || pattern === 'reverse_fly' || pattern === 'face_pull') {
      const armSpread = pattern === 'face_pull' ? lerp(18, 46, p) : lerp(52, 16, p);
      const handY = pattern === 'face_pull' ? lerp(58, 48, p) : lerp(84, 72, p);
      return (
        <g>
          {eqKind === 'cable' && (
            <>
              <rect x="28" y="25" width="7" height="160" rx="2" fill="#465548" />
              <rect x="225" y="25" width="7" height="160" rx="2" fill="#465548" />
              <line x1="35" y1="70" x2={130 - armSpread - 16} y2={handY} stroke="#789575" strokeWidth="2" strokeDasharray="3 2" />
              <line x1="225" y1="70" x2={130 + armSpread + 16} y2={handY} stroke="#789575" strokeWidth="2" strokeDasharray="3 2" />
            </>
          )}

          <circle cx="130" cy="42" r="12" fill={`url(#skinGrad-${uid})`} />
          <path d="M 119 37 C 121 27 139 27 141 37 Z" fill="#1F1B18" />
          <rect x="125" y="52" width="10" height="8" fill={`url(#skinGrad-${uid})`} />
          <path d="M 102 60 L 158 60 L 148 122 L 112 122 Z" fill={`url(#muscleGray-${uid})`} />

          {pattern === 'reverse_fly' || pattern === 'face_pull' ? (
            <>
              <ellipse cx="105" cy="70" rx="11" ry="11" fill={muscleFillId} opacity={hitGlow} />
              <ellipse cx="155" cy="70" rx="11" ry="11" fill={muscleFillId} opacity={hitGlow} />
            </>
          ) : (
            <>
              <ellipse cx="117" cy="75" rx="13" ry="9" fill={muscleFillId} opacity={hitGlow} />
              <ellipse cx="143" cy="75" rx="13" ry="9" fill={muscleFillId} opacity={hitGlow} />
            </>
          )}

          <path d="M 111 120 L 149 120 L 152 178 L 134 178 L 130 145 L 126 178 L 108 178 Z" fill="#3B423E" />

          <polyline points={`104,68 ${104 - armSpread * 0.55},${lerp(80, 74, p)} ${130 - armSpread},${handY}`} fill="none" stroke={`url(#skinGrad-${uid})`} strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
          <polyline points={`156,68 ${156 + armSpread * 0.55},${lerp(80, 74, p)} ${130 + armSpread},${handY}`} fill="none" stroke={`url(#skinGrad-${uid})`} strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />

          {eqKind === 'dumbbell' ? (
            <>
              {drawEquipmentWeight(130 - armSpread, handY, 0.72)}
              {drawEquipmentWeight(130 + armSpread, handY, 0.72)}
            </>
          ) : (
            <>
              <circle cx={130 - armSpread} cy={handY} r="5.5" fill="#173F35" />
              <circle cx={130 + armSpread} cy={handY} r="5.5" fill="#173F35" />
            </>
          )}
        </g>
      );
    }

    // 3. PUSH-UP, PLANK, AB WHEEL ROLLOUT, LYING LEG CURL
    if (pattern === 'pushup' || pattern === 'plank' || pattern === 'ab_wheel' || pattern === 'leg_curl') {
      if (pattern === 'leg_curl') {
        const heelAngle = lerp(-8, -88, p);
        return (
          <g>
            <rect x="44" y="132" width="166" height="9" rx="4" fill="#263B2D" />
            <rect x="64" y="141" width="8" height="34" fill="#465548" />
            <rect x="182" y="141" width="8" height="34" fill="#465548" />
            <circle cx="62" cy="116" r="10.5" fill={`url(#skinGrad-${uid})`} />
            <path d="M 53 111 C 55 103 68 103 70 110 Z" fill="#1F1B18" />
            <rect x="74" y="114" width="60" height="17" rx="8" fill={`url(#muscleGray-${uid})`} />
            <rect x="132" y="114" width="32" height="17" rx="6" fill="#3B423E" />
            <ellipse cx="152" cy="116" rx="14" ry="8" fill={muscleFillId} opacity={hitGlow} />
            <g transform={`rotate(${heelAngle} 166 122)`}>
              <line x1="166" y1="122" x2="206" y2="124" stroke={`url(#skinGrad-${uid})`} strokeWidth="10" strokeLinecap="round" />
              <circle cx="204" cy="124" r="6" fill="#173F35" />
            </g>
          </g>
        );
      }

      if (pattern === 'ab_wheel') {
        const wheelX = lerp(112, 46, p);
        const torsoY = lerp(92, 128, p);
        return (
          <g>
            <line x1="25" y1="164" x2="235" y2="164" stroke="#789575" strokeWidth="3.5" />
            {/* Knees anchored on pad */}
            <polyline points="178,162 152,126 178,162" fill="none" stroke="#3B423E" strokeWidth="14" strokeLinecap="round" />
            <line x1="152" y1="126" x2={wheelX + 26} y2={torsoY} stroke={`url(#muscleGray-${uid})`} strokeWidth="17" strokeLinecap="round" />
            <ellipse cx={(152 + wheelX + 26) / 2} cy={(126 + torsoY) / 2} rx="18" ry="8" fill={muscleFillId} opacity={hitGlow} />
            <circle cx={wheelX + 16} cy={torsoY - 12} r="10.5" fill={`url(#skinGrad-${uid})`} />
            <line x1={wheelX + 24} y1={torsoY} x2={wheelX} y2="152" stroke={`url(#skinGrad-${uid})`} strokeWidth="7.5" strokeLinecap="round" />
            <circle cx={wheelX} cy="153" r="10.5" fill="#173F35" stroke="#263B2D" strokeWidth="2.5" />
            <circle cx={wheelX} cy="153" r="3" fill="#F1F2E8" />
          </g>
        );
      }

      const dipY = pattern === 'plank' ? 0 : lerp(18, 0, p);
      const shoulderY = (isIncline ? 82 : 108) + dipY;
      const hipY = (isDecline ? 94 : 114) + dipY * 0.65;
      const footY = isDecline ? 124 : 158;
      return (
        <g>
          <line x1="25" y1="164" x2="235" y2="164" stroke="#789575" strokeWidth="3.5" strokeLinecap="round" />
          {isDecline && <rect x="194" y="128" width="32" height="36" rx="4" fill="#465548" />}
          {isIncline && <rect x="52" y="124" width="32" height="40" rx="4" fill="#465548" />}
          <line x1="74" y1={shoulderY} x2="146" y2={hipY} stroke={`url(#muscleGray-${uid})`} strokeWidth="18" strokeLinecap="round" />
          <line x1="146" y1={hipY} x2="206" y2={footY} stroke="#3B423E" strokeWidth="13" strokeLinecap="round" />
          <ellipse
            cx={pattern === 'plank' ? 116 : 92}
            cy={(shoulderY + hipY) / 2 + 2}
            rx={pattern === 'plank' ? 22 : 14}
            ry="8"
            fill={muscleFillId}
            opacity={hitGlow}
          />
          <circle cx="58" cy={shoulderY - 6} r="10.5" fill={`url(#skinGrad-${uid})`} />
          <path d={`M 50 ${shoulderY - 12} C 52 ${shoulderY - 19} 65 ${shoulderY - 19} 67 ${shoulderY - 11} Z`} fill="#1F1B18" />
          <polyline
            points={
              pattern === 'plank'
                ? `74,${shoulderY + 2} 66,158 84,158`
                : `74,${shoulderY + 2} ${70 + dipY * 0.4},${(shoulderY + 160) / 2} 74,${isIncline ? 126 : 162}`
            }
            fill="none"
            stroke={`url(#skinGrad-${uid})`}
            strokeWidth="8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      );
    }

    // 4. DIP (Chest / Tricep Parallel Bars)
    if (pattern === 'dip') {
      const dropY = lerp(24, 0, p);
      return (
        <g>
          <rect x="68" y="96" width="124" height="6" rx="3" fill="#465548" />
          <rect x="74" y="98" width="7" height="82" rx="2" fill="#263B2D" />
          <rect x="179" y="98" width="7" height="82" rx="2" fill="#263B2D" />
          <g transform={`translate(0, ${dropY})`}>
            <circle cx="130" cy="36" r="11" fill={`url(#skinGrad-${uid})`} />
            <path d="M 120 31 C 122 22 138 22 140 31 Z" fill="#1F1B18" />
            <rect x="111" y="50" width="38" height="46" rx="10" fill={`url(#muscleGray-${uid})`} />
            <ellipse cx="130" cy="68" rx="15" ry="9" fill={muscleFillId} opacity={hitGlow} />
            <path d="M 114 96 L 146 96 L 148 138 L 112 138 Z" fill="#3B423E" />
            <polyline points={`111,56 96,76 98,${98 - dropY}`} fill="none" stroke={`url(#skinGrad-${uid})`} strokeWidth="7.5" strokeLinecap="round" />
            <polyline points={`149,56 164,76 162,${98 - dropY}`} fill="none" stroke={`url(#skinGrad-${uid})`} strokeWidth="7.5" strokeLinecap="round" />
          </g>
        </g>
      );
    }

    // 5. PULL-UP & HANGING LEG RAISE
    if (pattern === 'pullup' || pattern === 'hanging_leg_raise') {
      const pullOffset = pattern === 'pullup' ? lerp(28, -4, p) : 0;
      const legLiftAngle = pattern === 'hanging_leg_raise' ? lerp(0, -82, p) : 0;
      return (
        <g>
          <line x1="48" y1="22" x2="212" y2="22" stroke="#263B2D" strokeWidth="6" strokeLinecap="round" />
          <rect x="52" y="22" width="6" height="160" fill="#465548" />
          <rect x="202" y="22" width="6" height="160" fill="#465548" />
          <polyline points={`94,24 ${86 + pullOffset * 0.2},${56 + pullOffset * 0.6} 106,${72 + pullOffset}`} fill="none" stroke={`url(#skinGrad-${uid})`} strokeWidth="7.5" strokeLinecap="round" />
          <polyline points={`166,24 ${174 - pullOffset * 0.2},${56 + pullOffset * 0.6} 154,${72 + pullOffset}`} fill="none" stroke={`url(#skinGrad-${uid})`} strokeWidth="7.5" strokeLinecap="round" />

          <g transform={`translate(0, ${pullOffset})`}>
            <circle cx="130" cy="48" r="11" fill={`url(#skinGrad-${uid})`} />
            <path d="M 120 43 C 122 34 138 34 140 43 Z" fill="#1F1B18" />
            <path d="M 104 64 L 156 64 L 146 112 L 114 112 Z" fill={`url(#muscleGray-${uid})`} />
            {pattern === 'pullup' ? (
              <>
                <ellipse cx="114" cy="82" rx="11" ry="16" fill={muscleFillId} opacity={hitGlow} />
                <ellipse cx="146" cy="82" rx="11" ry="16" fill={muscleFillId} opacity={hitGlow} />
              </>
            ) : (
              <ellipse cx="130" cy="92" rx="12" ry="15" fill={muscleFillId} opacity={hitGlow} />
            )}
            <g transform={`rotate(${legLiftAngle} 130 112)`}>
              <rect x="114" y="110" width="32" height="22" rx="5" fill="#3B423E" />
              <line x1="121" y1="132" x2="121" y2="162" stroke={`url(#muscleGray-${uid})`} strokeWidth="10" strokeLinecap="round" />
              <line x1="139" y1="132" x2="139" y2="162" stroke={`url(#muscleGray-${uid})`} strokeWidth="10" strokeLinecap="round" />
            </g>
          </g>
        </g>
      );
    }

    // 6. LAT PULLDOWN, TRICEP PUSHDOWN, CABLE CRUNCH, LEG EXTENSION, LEG PRESS
    if (pattern === 'pulldown' || pattern === 'tricep_pushdown' || pattern === 'cable_crunch') {
      const pullY = pattern === 'pulldown' ? lerp(34, 68, p) : pattern === 'tricep_pushdown' ? lerp(84, 128, p) : lerp(62, 108, p);
      const torsoLean = pattern === 'cable_crunch' ? lerp(4, 34, p) : 0;

      return (
        <g>
          <rect x="126" y="12" width="8" height="10" fill="#263B2D" />
          <line x1="130" y1="20" x2="130" y2={pullY} stroke="#789575" strokeWidth="2.5" />
          <g transform={`rotate(${torsoLean} 130 126)`}>
            <circle cx="130" cy="54" r="11" fill={`url(#skinGrad-${uid})`} />
            <path d="M 120 49 C 122 40 138 40 140 49 Z" fill="#1F1B18" />
            <path d="M 104 68 L 156 68 L 146 126 L 114 126 Z" fill={`url(#muscleGray-${uid})`} />
            <ellipse cx="130" cy={pattern === 'cable_crunch' ? 102 : 84} rx={pattern === 'tricep_pushdown' ? 9 : 18} ry="14" fill={muscleFillId} opacity={hitGlow} />
          </g>
          <rect x="112" y="126" width="36" height="22" rx="5" fill="#3B423E" />
          <path d="M 118 148 L 116 178 M 142 148 L 144 178" stroke={`url(#muscleGray-${uid})`} strokeWidth="10" strokeLinecap="round" />
          <polyline points={`104,74 96,${(74 + pullY) / 2} 102,${pullY}`} fill="none" stroke={`url(#skinGrad-${uid})`} strokeWidth="7.5" strokeLinecap="round" />
          <polyline points={`156,74 164,${(74 + pullY) / 2} 158,${pullY}`} fill="none" stroke={`url(#skinGrad-${uid})`} strokeWidth="7.5" strokeLinecap="round" />
          <line x1="94" y1={pullY} x2="166" y2={pullY} stroke="#173F35" strokeWidth="5" strokeLinecap="round" />
        </g>
      );
    }

    if (pattern === 'leg_extension') {
      const kickDeg = lerp(75, 4, p);
      return (
        <g>
          <rect x="74" y="124" width="60" height="10" rx="4" fill="#263B2D" />
          <rect x="74" y="76" width="10" height="54" rx="4" fill="#263B2D" />
          <circle cx="94" cy="60" r="11" fill={`url(#skinGrad-${uid})`} />
          <path d="M 84 55 C 86 46 102 46 104 55 Z" fill="#1F1B18" />
          <rect x="85" y="76" width="24" height="48" rx="8" fill={`url(#muscleGray-${uid})`} />
          <rect x="92" y="112" width="44" height="16" rx="6" fill="#3B423E" />
          <ellipse cx="118" cy="120" rx="16" ry="9" fill={muscleFillId} opacity={hitGlow} />
          <g transform={`rotate(${kickDeg} 136 120)`}>
            <line x1="136" y1="120" x2="178" y2="120" stroke={`url(#skinGrad-${uid})`} strokeWidth="11" strokeLinecap="round" />
            <circle cx="174" cy="126" r="6" fill="#173F35" />
          </g>
        </g>
      );
    }

    // 7. OVERHEAD PRESS, CURLS, LATERAL / FRONT RAISE, FARMER WALK, TWIST
    if (
      pattern === 'overhead_press' ||
      pattern === 'bicep_curl' ||
      pattern === 'overhead_tricep' ||
      pattern === 'lateral_raise' ||
      pattern === 'front_raise' ||
      pattern === 'wrist_curl' ||
      pattern === 'farmers_walk' ||
      pattern === 'core_twist'
    ) {
      let lx = 90, ly = 112, rx = 170, ry = 112;
      let exL = 94, eyL = 96, exR = 166, eyR = 96;
      const bodyTwistX = pattern === 'core_twist' ? lerp(-16, 16, p) : 0;

      if (pattern === 'overhead_press') {
        ly = ry = lerp(66, 26, p);
        lx = 94; rx = 166;
        eyL = eyR = lerp(84, 48, p);
      } else if (pattern === 'bicep_curl' || pattern === 'wrist_curl') {
        eyL = eyR = 98;
        lx = 92; rx = 168;
        ly = ry = lerp(128, 72, p);
      } else if (pattern === 'overhead_tricep') {
        eyL = 44; eyR = 44;
        lx = 116; rx = 144;
        ly = ry = lerp(52, 20, p);
      } else if (pattern === 'lateral_raise') {
        lx = lerp(94, 52, p); rx = lerp(166, 208, p);
        ly = ry = lerp(126, 68, p);
        exL = (102 + lx) / 2; exR = (158 + rx) / 2;
        eyL = eyR = (72 + ly) / 2;
      } else if (pattern === 'front_raise') {
        lx = lerp(96, 114, p); rx = lerp(164, 146, p);
        ly = ry = lerp(128, 66, p);
        exL = lx; exR = rx;
        eyL = eyR = (74 + ly) / 2;
      } else if (pattern === 'farmers_walk') {
        lx = 90; rx = 170;
        ly = ry = 136;
        exL = 92; eyL = 104;
        exR = 168; eyR = 104;
      } else if (pattern === 'core_twist') {
        lx = 122 + bodyTwistX; rx = 138 + bodyTwistX;
        ly = ry = 94;
        exL = 104; eyL = 94;
        exR = 156; eyR = 94;
      }

      return (
        <g>
          <circle cx="130" cy="42" r="11.5" fill={`url(#skinGrad-${uid})`} />
          <path d="M 119 37 C 121 27 139 27 141 37 Z" fill="#1F1B18" />
          <rect x="125" y="52" width="10" height="8" fill={`url(#skinGrad-${uid})`} />
          <path d="M 102 60 L 158 60 L 148 122 L 112 122 Z" fill={`url(#muscleGray-${uid})`} />

          {(primarySlug.includes('deltoid') || pattern === 'overhead_press' || pattern.includes('raise')) && (
            <>
              <circle cx="102" cy="68" r="10" fill={muscleFillId} opacity={hitGlow} />
              <circle cx="158" cy="68" r="10" fill={muscleFillId} opacity={hitGlow} />
            </>
          )}
          {(pattern === 'bicep_curl' || pattern === 'wrist_curl' || pattern === 'farmers_walk') && (
            <>
              <ellipse cx="98" cy={pattern === 'farmers_walk' ? 114 : 84} rx="7" ry="12" fill={muscleFillId} opacity={hitGlow} />
              <ellipse cx="162" cy={pattern === 'farmers_walk' ? 114 : 84} rx="7" ry="12" fill={muscleFillId} opacity={hitGlow} />
            </>
          )}
          {pattern === 'overhead_tricep' && (
            <>
              <ellipse cx="110" cy="54" rx="7" ry="11" fill={muscleFillId} opacity={hitGlow} />
              <ellipse cx="150" cy="54" rx="7" ry="11" fill={muscleFillId} opacity={hitGlow} />
            </>
          )}
          {pattern === 'core_twist' && (
            <ellipse cx="130" cy="96" rx="18" ry="16" fill={muscleFillId} opacity={hitGlow} />
          )}

          <path d="M 111 120 L 149 120 L 152 178 L 135 178 L 130 144 L 125 178 L 108 178 Z" fill="#3B423E" />
          <polyline points={`104,68 ${exL},${eyL} ${lx},${ly}`} fill="none" stroke={`url(#skinGrad-${uid})`} strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
          <polyline points={`156,68 ${exR},${eyR} ${rx},${ry}`} fill="none" stroke={`url(#skinGrad-${uid})`} strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />

          {eqKind === 'barbell' || eqKind === 'ez-bar' ? (
            drawEquipmentWeight(130, ly, 0.85)
          ) : pattern === 'core_twist' ? (
            drawEquipmentWeight(130 + bodyTwistX, ly, 0.85)
          ) : (
            <>
              {drawEquipmentWeight(lx, ly, 0.8)}
              {pattern !== 'overhead_tricep' && drawEquipmentWeight(rx, ry, 0.8)}
            </>
          )}
        </g>
      );
    }

    // 8. HIP THRUST & GLUTE KICKBACK & DEADLIFT / ROW
    if (pattern === 'hip_thrust') {
      const hipY = lerp(142, 108, p);
      return (
        <g>
          <line x1="25" y1="168" x2="235" y2="168" stroke="#789575" strokeWidth="3.5" />
          <rect x="46" y="108" width="28" height="60" rx="5" fill="#465548" />
          <circle cx="64" cy="84" r="10.5" fill={`url(#skinGrad-${uid})`} />
          <line x1="74" y1="98" x2="132" y2={hipY} stroke={`url(#muscleGray-${uid})`} strokeWidth="18" strokeLinecap="round" />
          <ellipse cx="132" cy={hipY} rx="15" ry="11" fill={muscleFillId} opacity={hitGlow} />
          <polyline points={`132,${hipY} 174,116 184,166`} fill="none" stroke="#3B423E" strokeWidth="13" strokeLinecap="round" strokeLinejoin="round" />
          {eqKind === 'barbell' && drawEquipmentWeight(132, hipY - 8, 0.85)}
        </g>
      );
    }

    if (pattern === 'kickback') {
      const kickDeg = lerp(5, 58, p);
      return (
        <g>
          <rect x="34" y="25" width="7" height="145" fill="#465548" />
          <line x1="25" y1="170" x2="235" y2="170" stroke="#789575" strokeWidth="3" />
          <circle cx="118" cy="48" r="10.5" fill={`url(#skinGrad-${uid})`} />
          <path d="M 106 64 L 130 64 L 128 112 L 106 112 Z" fill={`url(#muscleGray-${uid})`} />
          <ellipse cx="122" cy="112" rx="13" ry="11" fill={muscleFillId} opacity={hitGlow} />
          <line x1="114" y1="114" x2="114" y2="168" stroke="#3B423E" strokeWidth="12" strokeLinecap="round" />
          <g transform={`rotate(${kickDeg} 122 114)`}>
            <line x1="122" y1="114" x2="122" y2="168" stroke={`url(#skinGrad-${uid})`} strokeWidth="11" strokeLinecap="round" />
            <line x1="41" y1="158" x2="122" y2="164" stroke="#789575" strokeWidth="2" strokeDasharray="3 2" />
          </g>
        </g>
      );
    }

    if (pattern === 'deadlift' || pattern === 'row') {
      const hingeDeg = pattern === 'deadlift' ? lerp(58, 6, p) : 48;
      const pullUp = pattern === 'row' ? lerp(0, -30, p) : 0;
      const barY = pattern === 'deadlift' ? lerp(152, 106, p) : 138 + pullUp;
      return (
        <g>
          <line x1="25" y1="168" x2="235" y2="168" stroke="#789575" strokeWidth="3" />
          <polyline points="116,112 106,142 108,166" fill="none" stroke={`url(#muscleGray-${uid})`} strokeWidth="13" strokeLinecap="round" />
          <polyline points="140,112 148,142 146,166" fill="none" stroke={`url(#muscleGray-${uid})`} strokeWidth="13" strokeLinecap="round" />
          <rect x="108" y="102" width="38" height="22" rx="6" fill="#3B423E" />

          <g transform={`rotate(${hingeDeg} 126 108)`}>
            <rect x="114" y="54" width="24" height="56" rx="10" fill={`url(#muscleGray-${uid})`} />
            <ellipse cx="126" cy="82" rx="11" ry="18" fill={muscleFillId} opacity={hitGlow} />
            <circle cx="126" cy="39" r="10.5" fill={`url(#skinGrad-${uid})`} />
            <path d="M 116 34 C 118 25 134 25 136 34 Z" fill="#1F1B18" />
            <line x1="126" y1="62" x2="148" y2={62 + 54 + pullUp * 0.45} stroke={`url(#skinGrad-${uid})`} strokeWidth="7.5" strokeLinecap="round" />
          </g>

          {drawEquipmentWeight(152, barY, 0.85)}
        </g>
      );
    }

    if (pattern === 'calf_raise') {
      const liftY = lerp(0, -18, p);
      return (
        <g>
          <rect x="78" y="158" width="104" height="12" rx="3" fill="#465548" />
          <g transform={`translate(0, ${liftY})`}>
            <circle cx="130" cy="36" r="11" fill={`url(#skinGrad-${uid})`} />
            <path d="M 120 31 C 122 22 138 22 140 31 Z" fill="#1F1B18" />
            <path d="M 106 54 L 154 54 L 144 106 L 116 106 Z" fill={`url(#muscleGray-${uid})`} />
            <path d="M 114 104 L 146 104 L 146 130 L 114 130 Z" fill="#3B423E" />
            <line x1="120" y1="130" x2="120" y2="158" stroke={`url(#muscleGray-${uid})`} strokeWidth="10" strokeLinecap="round" />
            <line x1="140" y1="130" x2="140" y2="158" stroke={`url(#muscleGray-${uid})`} strokeWidth="10" strokeLinecap="round" />
            <ellipse cx="120" cy="144" rx="7" ry="11" fill={muscleFillId} opacity={hitGlow} />
            <ellipse cx="140" cy="144" rx="7" ry="11" fill={muscleFillId} opacity={hitGlow} />
            {eqKind === 'dumbbell' && drawEquipmentWeight(96, 108, 0.75)}
          </g>
        </g>
      );
    }

    // 9. SQUAT, LUNGE, LEG PRESS
    const squatDrop = lerp(0, 34, p);
    const kneeOut = pattern === 'lunge' ? lerp(8, 22, p) : lerp(0, 14, p);
    return (
      <g>
        <line x1="35" y1="170" x2="225" y2="170" stroke="#789575" strokeWidth="3" strokeLinecap="round" />
        <polyline
          points={`116,${114 + squatDrop} ${102 - kneeOut},${140 + squatDrop * 0.4} 108,168`}
          fill="none"
          stroke={`url(#muscleGray-${uid})`}
          strokeWidth="13"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <polyline
          points={`144,${114 + squatDrop} ${158 + kneeOut},${140 + squatDrop * 0.4} ${pattern === 'lunge' ? 174 : 152},168`}
          fill="none"
          stroke={`url(#muscleGray-${uid})`}
          strokeWidth="13"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <ellipse cx={106 - kneeOut * 0.4} cy={136 + squatDrop * 0.4} rx="8" ry="14" fill={muscleFillId} opacity={hitGlow} />
        <ellipse cx={154 + kneeOut * 0.4} cy={136 + squatDrop * 0.4} rx="8" ry="14" fill={muscleFillId} opacity={hitGlow} />

        <g transform={`translate(0, ${squatDrop})`}>
          <rect x="112" y="106" width="36" height="19" rx="6" fill="#3B423E" />
          <path d="M 104 56 L 156 56 L 146 108 L 114 108 Z" fill={`url(#muscleGray-${uid})`} />
          <circle cx="130" cy="38" r="11" fill={`url(#skinGrad-${uid})`} />
          <path d="M 120 33 C 122 24 138 24 140 33 Z" fill="#1F1B18" />
          {eqKind === 'barbell' && drawEquipmentWeight(130, 56, 0.9)}
          {eqKind === 'dumbbell' && (
            <>
              {drawEquipmentWeight(96, 108, 0.72)}
              {drawEquipmentWeight(164, 108, 0.72)}
            </>
          )}
        </g>
      </g>
    );
  };

  return (
    <svg
      viewBox="0 0 260 185"
      className={`w-full ${compact ? 'h-32 sm:h-36' : 'h-60 sm:h-72'} select-none overflow-visible`}
      role="img"
      aria-label={`${exercise.name} anatomical workout performer`}
    >
      <defs>
        <linearGradient id={`skinGrad-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F0BC9E" />
          <stop offset="60%" stopColor="#C88766" />
          <stop offset="100%" stopColor="#8E583D" />
        </linearGradient>

        <linearGradient id={`muscleGray-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#D6D1CD" />
          <stop offset="55%" stopColor="#9B928D" />
          <stop offset="100%" stopColor="#6E6560" />
        </linearGradient>

        <radialGradient id={`hitMuscleGrad-${uid}`} cx="50%" cy="45%" r="55%">
          <stop offset="0%" stopColor={hitGlow > 0.85 ? '#FCA5A5' : '#86EFAC'} />
          <stop offset="45%" stopColor={hitGlow > 0.85 ? '#EF4444' : '#39B963'} />
          <stop offset="100%" stopColor={hitGlow > 0.85 ? '#B91C1C' : '#15803D'} />
        </radialGradient>
      </defs>

      {renderPose()}
    </svg>
  );
}
