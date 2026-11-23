// ============================================================================
// GYMGUIDE - 4-STEP VISUAL FORM SEQUENCE NORMALIZER
// Guarantees every single one of the 69 exercises exposes exactly 4 complete,
// biomechanically tailored steps:
//   Step 01: Starting Position (grip, elbows, posture, stance, equipment setup)
//   Step 02: Movement / Execution (direction, push/pull/hinge/lift mechanics)
//   Step 03: Peak Contraction (final contraction position & muscle focus)
//   Step 04: Controlled Return & Muscle Activation (eccentric return, breathing & target muscles)
// ============================================================================

const crypto = require('crypto');
const { APP_CONFIG } = require('../config/env.validation');

const STAGE_META = {
  1: { role: 'Starting Position', phaseProgress: 0.06 },
  2: { role: 'Movement / Execution', phaseProgress: 0.52 },
  3: { role: 'Peak Contraction', phaseProgress: 0.98 },
  4: { role: 'Controlled Return & Muscle Activation', phaseProgress: 0.24 },
};

function _joinNames(list = [], fallback = 'target musculature') {
  const names = (list || [])
    .map((m) => (typeof m === 'string' ? m : m?.name || m?.muscleSlug || ''))
    .filter(Boolean);
  if (names.length === 0) return fallback;
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(', ')}, and ${names[names.length - 1]}`;
}

function _firstSentence(text = '') {
  const clean = String(text || '').trim();
  if (!clean) return '';
  const match = clean.match(/^[^.!?]+[.!?]/);
  return match ? match[0].trim() : clean;
}

function _isReturnStepTitle(title = '') {
  return /return|lower|lowering|stretch|descent|negative|set-down|uncurl|controlled tempo|anti-swing|slow eccentric|hinge down|reverse/i.test(
    String(title || '')
  );
}

function _isConcentricPeakTitle(title = '') {
  return /press|drive|squeeze|curl|pull|sweep|adduct|lockout|raise|extend|rise|bridge|scoop|cross|split|rotate|rollout/i.test(
    String(title || '')
  );
}

function _buildStreamUrl(mediaId) {
  const ttl = APP_CONFIG.MINIO_PRESIGNED_EXPIRY_SEC || 900;
  const exp = Math.floor(Date.now() / 1000) + ttl;
  const sig = crypto
    .createHmac('sha256', APP_CONFIG.MEDIA_STREAM_SECRET)
    .update(`${mediaId}:${exp}`)
    .digest('hex');
  return `/api/v1/media/${mediaId}/stream?exp=${exp}&sig=${sig}`;
}

/**
 * Ensures any exercise object has exact steps 1..4 with titles, rich descriptions,
 * coaching cues, phase progress values, and optional MinIO / fallback character image URLs.
 */
function buildFourStepInstructions(exercise, minioStepMap = {}) {
  const rawSteps = [...(exercise?.instructions || [])].sort(
    (a, b) => Number(a.stepNumber) - Number(b.stepNumber)
  );
  const equipmentNames = _joinNames(
    exercise?.equipment?.length ? exercise.equipment : exercise?.equipmentSlugs,
    'selected equipment'
  );
  const primaryNames = _joinNames(exercise?.primaryMuscles, exercise?.category || 'Primary Muscle');
  const secondaryNames = _joinNames(exercise?.secondaryMuscles, 'supporting stabilizers');
  const setupSummary = _firstSentence(exercise?.startingPosition || '');
  const forceAction = String(exercise?.forceType || '').toLowerCase().includes('pull')
    ? 'pulling'
    : String(exercise?.forceType || '').toLowerCase().includes('static')
    ? 'stabilizing'
    : 'pressing';

  let steps;

  if (rawSteps.length >= 4) {
    steps = rawSteps.slice(0, 4).map((s, idx) => ({
      stepNumber: idx + 1,
      stageRole: STAGE_META[idx + 1].role,
      title: s.title,
      instruction: s.instruction,
      coachingCue: s.coachingCue || 'Move cleanly through a full controlled range of motion.',
      phaseProgress: STAGE_META[idx + 1].phaseProgress,
    }));
  } else if (rawSteps.length === 3) {
    const s1 = rawSteps[0];
    const s2 = rawSteps[1];
    const s3 = rawSteps[2];

    const s1Instruction =
      s1.instruction && setupSummary && !s1.instruction.includes(setupSummary.slice(0, 18))
        ? `${s1.instruction} ${setupSummary}`
        : s1.instruction || setupSummary;

    // Pattern A: [1: Start, 2: Concentric/Peak, 3: Eccentric Return]
    if (_isReturnStepTitle(s3.title) && !_isReturnStepTitle(s2.title)) {
      steps = [
        {
          stepNumber: 1,
          stageRole: STAGE_META[1].role,
          title: s1.title,
          instruction: s1Instruction,
          coachingCue: s1.coachingCue || 'Lock in posture and grip symmetry before moving.',
          phaseProgress: STAGE_META[1].phaseProgress,
        },
        {
          stepNumber: 2,
          stageRole: STAGE_META[2].role,
          title: `Execute Movement: ${s2.title}`,
          instruction: `Initiate smooth ${forceAction} mechanics with ${equipmentNames} while maintaining steady torso alignment. ${s2.instruction}`,
          coachingCue: s2.coachingCue || 'Keep constant tension along the active line of pull.',
          phaseProgress: STAGE_META[2].phaseProgress,
        },
        {
          stepNumber: 3,
          stageRole: STAGE_META[3].role,
          title: `Peak Contraction: ${primaryNames}`,
          instruction: `Hold the full contracted end-range position of ${exercise.name} for 1 full second so the ${primaryNames} reach maximum fiber recruitment without swinging or losing brace.`,
          coachingCue: `Squeeze ${primaryNames} hard at peak end-range.`,
          phaseProgress: STAGE_META[3].phaseProgress,
        },
        {
          stepNumber: 4,
          stageRole: STAGE_META[4].role,
          title: s3.title,
          instruction: `${s3.instruction} Inhale smoothly as you guide ${equipmentNames} back to start, engaging primary ${primaryNames} alongside secondary ${secondaryNames}.`,
          coachingCue: s3.coachingCue || 'Control a 2–3 second eccentric return with steady breathing.',
          phaseProgress: STAGE_META[4].phaseProgress,
        },
      ];
    } else if (_isConcentricPeakTitle(s3.title)) {
      // Pattern B: [1: Start, 2: Descent / Stretch Execution, 3: Drive / Peak Lockout]
      steps = [
        {
          stepNumber: 1,
          stageRole: STAGE_META[1].role,
          title: s1.title,
          instruction: s1Instruction,
          coachingCue: s1.coachingCue || 'Establish your stable starting position and brace.',
          phaseProgress: STAGE_META[1].phaseProgress,
        },
        {
          stepNumber: 2,
          stageRole: STAGE_META[2].role,
          title: s2.title,
          instruction: s2.instruction,
          coachingCue: s2.coachingCue || 'Control the lowering path without relaxing tension.',
          phaseProgress: STAGE_META[2].phaseProgress,
        },
        {
          stepNumber: 3,
          stageRole: STAGE_META[3].role,
          title: s3.title,
          instruction: `${s3.instruction} Pause briefly at peak contraction to fully engage ${primaryNames}.`,
          coachingCue: s3.coachingCue || `Drive smoothly to peak ${primaryNames} contraction.`,
          phaseProgress: STAGE_META[3].phaseProgress,
        },
        {
          stepNumber: 4,
          stageRole: STAGE_META[4].role,
          title: 'Controlled Return & Muscle Activation',
          instruction: `Transition cleanly back to the starting posture over 2–3 seconds while breathing rhythmically. Notice primary tension across ${primaryNames} supported by ${secondaryNames}.`,
          coachingCue: `Exhale through peak drive; inhale smoothly on the controlled return.`,
          phaseProgress: STAGE_META[4].phaseProgress,
        },
      ];
    } else {
      // Isometric / steady pattern fallback (e.g. Forearm Plank, Farmer's Walk)
      steps = [
        {
          stepNumber: 1,
          stageRole: STAGE_META[1].role,
          title: s1.title,
          instruction: s1Instruction,
          coachingCue: s1.coachingCue || 'Set joint stacking cleanly before initiating.',
          phaseProgress: STAGE_META[1].phaseProgress,
        },
        {
          stepNumber: 2,
          stageRole: STAGE_META[2].role,
          title: s2.title,
          instruction: s2.instruction,
          coachingCue: s2.coachingCue || 'Maintain rigid neutral alignment.',
          phaseProgress: STAGE_META[2].phaseProgress,
        },
        {
          stepNumber: 3,
          stageRole: STAGE_META[3].role,
          title: s3.title,
          instruction: s3.instruction,
          coachingCue: s3.coachingCue || `Keep sustained tension on ${primaryNames}.`,
          phaseProgress: STAGE_META[3].phaseProgress,
        },
        {
          stepNumber: 4,
          stageRole: STAGE_META[4].role,
          title: 'Controlled Return & Muscle Activation',
          instruction: `Disengage smoothly to the starting posture without dropping ${equipmentNames}. Primary stimulation targets ${primaryNames} assisted by ${secondaryNames}.`,
          coachingCue: 'Maintain steady diaphragmatic breathing and core control until rest.',
          phaseProgress: STAGE_META[4].phaseProgress,
        },
      ];
    }
  } else {
    steps = [1, 2, 3, 4].map((stepNum) => {
      const existing = rawSteps.find((s) => Number(s.stepNumber) === stepNum);
      return {
        stepNumber: stepNum,
        stageRole: STAGE_META[stepNum].role,
        title: existing?.title || STAGE_META[stepNum].role,
        instruction:
          existing?.instruction ||
          setupSummary ||
          `Perform ${exercise?.name || 'this exercise'} safely targeting ${primaryNames}.`,
        coachingCue:
          existing?.coachingCue ||
          `Control each phase and keep focus on ${primaryNames}.`,
        phaseProgress: STAGE_META[stepNum].phaseProgress,
      };
    });
  }

  // Attach image URLs cleanly (real signed MinIO WebP if uploaded; anatomical cutout reference fallback)
  const fallbackSide =
    (exercise?.primaryMuscles || []).some((m) => m.bodySide === 'BACK')
      ? '/images/character/character-back-cutout.png?v=9'
      : '/images/character/character-front-cutout.png?v=9';

  return steps.map((step) => {
    const minioItem = minioStepMap[step.stepNumber] || null;
    const minioUrl = minioItem ? minioItem.streamUrl || _buildStreamUrl(minioItem.id) : null;
    const curatedStepUrl =
      exercise?.slug === 'incline-dumbbell-bench-press'
        ? `/images/exercises/incline-dumbbell-bench-press/step-0${step.stepNumber}-card.webp?v=3`
        : null;
    return {
      ...step,
      imageUrl: minioUrl || curatedStepUrl || fallbackSide,
      imageSource: minioItem ? 'minio' : curatedStepUrl ? 'curated-3d' : 'anatomical-2d-rig',
      objectKey: minioItem?.objectKey || null,
      mimeType: minioItem?.mimeType || null,
      fileSize: minioItem?.fileSize || null,
    };
  });
}

module.exports = {
  buildFourStepInstructions,
  STAGE_META,
};
