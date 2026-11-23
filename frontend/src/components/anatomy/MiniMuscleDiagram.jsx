import React, { useId } from 'react';
import { BACK_MUSCLE_REGIONS } from '../../data/anatomyPaths';
import {
  FRONT_CHARACTER_REGIONS,
  BACK_CHARACTER_REGIONS,
} from '../../data/characterHitRegions';

/**
 * Compact 3D Character Muscle Involvement Diagram
 * Supports both Crimson (default) and Emerald (#18C978 / #76CBB3) infographic variants,
 * with unique per-instance SVG mask IDs so multiple diagrams render cleanly on one page.
 */
export function MiniMuscleDiagram({
  primaryMuscles = [],
  secondaryMuscles = [],
  showBothSides = true,
  variant = 'emerald', // 'emerald' | 'crimson'
  compact = false,
  showLegend = true,
  className = '',
}) {
  const uid = useId().replace(/:/g, '');
  const isEmerald = variant === 'emerald';
  const primaryColor = isEmerald ? '#18C978' : '#DC1414';
  const secondaryColor = isEmerald ? '#76CBB3' : '#F59E0B';
  const multiplyPrimary = isEmerald ? '#15803D' : '#E11D48';
  const multiplySecondary = isEmerald ? '#0D9488' : '#D97706';

  const primaryNames = (primaryMuscles || []).map((m) =>
    typeof m === 'string' ? m : m.name || m.slug
  );
  const secondaryNames = (secondaryMuscles || []).map((m) =>
    typeof m === 'string' ? m : m.name || m.slug
  );

  const primarySet = new Set(
    (primaryMuscles || []).map((m) =>
      typeof m === 'string' ? m : m.slug || m.svgRegionId
    )
  );
  const secondarySet = new Set(
    (secondaryMuscles || []).map((m) =>
      typeof m === 'string' ? m : m.slug || m.svgRegionId
    )
  );

  const backSlugs = new Set(BACK_MUSCLE_REGIONS.map((r) => r.slug));
  const prefersBack =
    Array.from(primarySet).some((s) => backSlugs.has(s) && s !== 'calves') &&
    !Array.from(primarySet).some((s) =>
      [
        'chest',
        'front-deltoids',
        'biceps',
        'rectus-abdominis',
        'obliques',
        'quadriceps',
      ].includes(s)
    );

  const renderPose = (side) => {
    const isFront = side === 'FRONT';
    const w = isFront ? 316 : 302;
    const h = 675;
    const regions = isFront ? FRONT_CHARACTER_REGIONS : BACK_CHARACTER_REGIONS;
    const imgSrc = isFront
      ? '/images/character/character-front-cutout.png?v=9'
      : '/images/character/character-back-cutout.png?v=9';
    const filterId = `mini-alpha-${uid}-${side}`;
    const maskId = `mini-mask-${uid}-${side}`;
    const featherId = `mini-feather-${uid}-${side}`;

    return (
      <div className="flex flex-col items-center">
        {!compact && (
          <span className="text-[10px] uppercase tracking-wider text-[#657565] mb-1 font-bold">
            {isFront ? 'Front' : 'Back'}
          </span>
        )}
        <svg
          viewBox={`0 0 ${w} ${h}`}
          preserveAspectRatio="xMidYMid meet"
          className={`block w-auto max-w-full select-none drop-shadow-[0_4px_10px_rgba(23,63,53,0.14)] ${
            compact ? 'h-20 sm:h-24' : 'h-44 sm:h-48'
          }`}
          style={{ isolation: 'isolate' }}
          role="img"
          aria-label={`${side} 3D muscle involvement`}
        >
          <defs>
            <filter id={filterId}>
              <feColorMatrix
                type="matrix"
                values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 1 0"
              />
            </filter>
            <mask id={maskId}>
              <image
                href={imgSrc}
                x="0"
                y="0"
                width={w}
                height={h}
                filter={`url(#${filterId})`}
              />
            </mask>
            <filter id={featherId} x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="1.2" />
            </filter>
          </defs>

          <image href={imgSrc} x="0" y="0" width={w} height={h} />

          {/* HSL Stain for Primary / Secondary */}
          <g mask={`url(#${maskId})`} style={{ mixBlendMode: 'color' }} className="pointer-events-none">
            {regions.map((reg, idx) => {
              const isPrimary = primarySet.has(reg.slug);
              const isSecondary = !isPrimary && secondarySet.has(reg.slug);
              if (!isPrimary && !isSecondary) return null;
              return (
                <g key={`mini-dye-${reg.id}-${idx}`}>
                  {reg.paths.map((d, pIdx) => (
                    <path
                      key={pIdx}
                      d={d}
                      fill={isPrimary ? primaryColor : secondaryColor}
                      fillOpacity={isPrimary ? 0.96 : 0.72}
                      filter={`url(#${featherId})`}
                    />
                  ))}
                </g>
              );
            })}
          </g>

          {/* Natural Muscle Belly Depth */}
          <g mask={`url(#${maskId})`} style={{ mixBlendMode: 'multiply' }} className="pointer-events-none">
            {regions.map((reg, idx) => {
              const isPrimary = primarySet.has(reg.slug);
              const isSecondary = !isPrimary && secondarySet.has(reg.slug);
              if (!isPrimary && !isSecondary) return null;
              return (
                <g key={`mini-mul-${reg.id}-${idx}`}>
                  {reg.paths.map((d, pIdx) => (
                    <path
                      key={pIdx}
                      d={d}
                      fill={isPrimary ? multiplyPrimary : multiplySecondary}
                      fillOpacity={isPrimary ? 0.28 : 0.16}
                      filter={`url(#${featherId})`}
                    />
                  ))}
                </g>
              );
            })}
          </g>

          {/* Glute Highlight */}
          <g mask={`url(#${maskId})`} className="pointer-events-none">
            {regions.map((reg, idx) => {
              if (reg.slug !== 'glutes') return null;
              const isPrimary = primarySet.has(reg.slug);
              const isSecondary = !isPrimary && secondarySet.has(reg.slug);
              if (!isPrimary && !isSecondary) return null;
              return (
                <g key={`mini-glute-${reg.id}-${idx}`}>
                  {reg.paths.map((d, pIdx) => (
                    <path
                      key={pIdx}
                      d={d}
                      fill={isPrimary ? primaryColor : secondaryColor}
                      fillOpacity={isPrimary ? 0.36 : 0.22}
                      filter={`url(#${featherId})`}
                    />
                  ))}
                </g>
              );
            })}
          </g>
        </svg>
      </div>
    );
  };

  return (
    <div
      className={
        compact
          ? `flex items-center justify-center ${className}`
          : `bg-[#F1F2E8] border border-[#D2D9C5] rounded-2xl p-4 flex flex-col justify-between shadow-sm ${className}`
      }
    >
      <div
        className={`grid ${
          showBothSides ? 'grid-cols-2' : 'grid-cols-1'
        } ${compact ? 'gap-1.5 w-full' : 'gap-2'} items-end justify-items-center`}
      >
        {showBothSides ? (
          <>
            {renderPose('FRONT')}
            {renderPose('BACK')}
          </>
        ) : (
          renderPose(prefersBack ? 'BACK' : 'FRONT')
        )}
      </div>

      {showLegend && (
        <div className="mt-3 pt-2.5 border-t border-[#D2D9C5] flex flex-wrap items-center justify-center gap-3 text-[11px] text-[#657565]">
          <span className="inline-flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-sm"
              style={{ backgroundColor: primaryColor }}
            />
            <span className="text-[#263B2D] font-bold">
              Primary: {primaryNames.join(', ') || 'Target Muscle'}
            </span>
          </span>
          {secondaryNames.length > 0 && (
            <span className="inline-flex items-center gap-1.5">
              <span
                className="w-2.5 h-2.5 rounded-sm"
                style={{ backgroundColor: secondaryColor }}
              />
              <span className="text-[#657565] font-semibold">
                Secondary: {secondaryNames.join(', ')}
              </span>
            </span>
          )}
        </div>
      )}
    </div>
  );
}
