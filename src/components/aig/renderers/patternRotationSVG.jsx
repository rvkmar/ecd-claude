import React from "react";

// ==================================================
// PatternRotationSVG — FIXED & REWRITTEN (paper‑faithful)
// - Sector arrows are anchored at their MIDPOINT
// - Each arrow can rotate independently (4 angles)
// - Rotation pivot = arrow midpoint on sector diagonal
// - Compatible with Sayın et al. (2023) parent item
// ==================================================

const SIZE = 96;
const VB = 100;
const C = 50;        // center
const R = 32;        // circumradius
const SHAPE_STROKE = 3;

// --------------------------------------------------
// Shape outlines (unchanged, paper‑faithful)
// --------------------------------------------------
function Shape({ shape }) {
  const d = R / Math.sqrt(2);

  switch (shape) {
    case "square":
      return (
        <rect
          x={C - d}
          y={C - d}
          width={2 * d}
          height={2 * d}
          fill="none"
          stroke="black"
          strokeWidth={SHAPE_STROKE}
          strokeLinejoin="round"
        />
      );

    case "triangle": {
      const angles = [-90, 30, 150];
      return (
        <polygon
          points={angles
            .map((a) => {
              const rad = (a * Math.PI) / 180;
              return `${C + Math.cos(rad) * R},${C + Math.sin(rad) * R}`;
            })
            .join(" ")}
          fill="none"
          stroke="black"
          strokeWidth={SHAPE_STROKE}
          strokeLinejoin="round"
        />
      );
    }

    case "circle":
      return (
        <circle
          cx={C}
          cy={C}
          r={R}
          fill="none"
          stroke="black"
          strokeWidth={SHAPE_STROKE}
        />
      );

    case "hexagon": {
      const angles = [30, 90, 150, 210, 270, 330];
      return (
        <polygon
          points={angles
            .map((a) => {
              const rad = (a * Math.PI) / 180;
              return `${C + Math.cos(rad) * R},${C + Math.sin(rad) * R}`;
            })
            .join(" ")}
          fill="none"
          stroke="black"
          strokeWidth={SHAPE_STROKE}
          strokeLinejoin="round"
        />
      );
    }

    default:
      return null;
  }
}

// --------------------------------------------------
// Division angles (paper‑faithful)
// --------------------------------------------------
function divisionAngles(shape) {
  switch (shape) {
    case "square":
      return [0, 90, 180, 270];
    case "triangle":
      return [270, 30, 150];
    case "hexagon":
      return [30, 90, 150, 210, 270, 330];
    case "circle":
      return [0, 90, 180, 270];
    default:
      return [];
  }
}

// --------------------------------------------------
// Max safe arrow radius per shape
// --------------------------------------------------
function maxSectorRadius(shape) {
  if (shape === "triangle") return (Math.sqrt(3) / 4) * R;
  if (shape === "square") return R / Math.sqrt(2);
  return R * 0.9;
}

// --------------------------------------------------
// Thin division spokes
// --------------------------------------------------
function Spoke({ angle, shape }) {
  const rad = (angle * Math.PI) / 180;
  const ux = Math.cos(rad);
  const uy = Math.sin(rad);
  const endR = maxSectorRadius(shape);

  return (
    <line
      x1={C}
      y1={C}
      x2={C + ux * endR}
      y2={C + uy * endR}
      stroke="black"
      strokeWidth={0.6}
      strokeLinecap="round"
    />
  );
}

// --------------------------------------------------
// Sector Arrow (MIDPOINT‑ANCHORED, independently rotatable)
// --------------------------------------------------
function SectorArrow({ angle, shape, direction = 1, extraRotation = 0 }) {
  const shaftSW = 4;

  const rad = (angle * Math.PI) / 180;
  const ux = Math.cos(rad);
  const uy = Math.sin(rad);

  const maxR = maxSectorRadius(shape);
  const arrowLen = Math.min(14, maxR * 0.45);
  const half = arrowLen / 2;

  // Midpoint on sector diagonal
  const rMid = maxR * 0.55;
  const mx = C + ux * rMid;
  const my = C + uy * rMid;

  const dir = direction > 0 ? 1 : -1;

  return (
    <g
      transform={`
        translate(${mx}, ${my})
        rotate(${angle + extraRotation})
      `}
    >
      {/* shaft */}
      <line
        x1={-half * dir}
        y1={0}
        x2={half * dir}
        y2={0}
        stroke="black"
        strokeWidth={shaftSW}
        strokeLinecap="round"
      />

      {/* arrowhead (correct orientation: points forward) */}
      <polygon
        points={
          `${(half + shaftSW * 2) * dir},0
           ${half * dir},${-shaftSW}
           ${half * dir},${shaftSW}`
        }
        fill="black"
      />
    </g>
  );
}

// --------------------------------------------------
// Main Component
// --------------------------------------------------
export default function PatternRotationSVG({ shape, rotation = 0, internal }) {
  const divs = divisionAngles(shape);

  const sectors = divs.map((a, i) => {
    const next = divs[(i + 1) % divs.length];
    let mid = (a + next) / 2;
    if (next < a) mid += 180;
    return mid;
  });

  // Shape-dependent selective arrow rotations (paper-consistent)
  // Only a limited number of arrows receive extra rotation
  const arrowRotationsByShape = {
    triangle: { count: 1, angles: [90] },
    square: { count: 2, angles: [90, 180] },
    circle: { count: 2, angles: [90, 180] },
    hexagon: { count: 3, angles: [60, 120, 180] },
  };

  const rule = arrowRotationsByShape[shape] || { count: 0, angles: [] };

  // deterministically choose first N arrows
  const rotatedIndices = new Set(
    sectors.slice(0, rule.count).map((_, i) => i)
  );

  return (
    <svg width={SIZE} height={SIZE} viewBox={`0 0 ${VB} ${VB}`}>
      <g transform={`rotate(${rotation}, ${C}, ${C})`}>
        {internal?.type === "arrow_group" && (
          <>
            {divs.map((a, i) => (
              <Spoke key={`sp-${i}`} angle={a} shape={shape} />
            ))}

            {sectors.map((a, i) => (
              <SectorArrow
                key={`sa-${i}`}
                angle={a}
                shape={shape}
                direction={internal.direction}
                extraRotation={
                  rotatedIndices.has(i)
                    ? rule.angles[i % rule.angles.length]
                    : 0
                }
              />
            ))}

            <circle cx={C} cy={C} r={0.6} fill="black" />
            <Shape shape={shape} />
          </>
        )}
      </g>
    </svg>
  );
}
