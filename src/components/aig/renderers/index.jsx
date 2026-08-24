import React from "react";

import PatternRotationSVG from "./patternRotationSVG.jsx";

import MatrixRotation1x4SVG from "./MatrixRotation1x4SVG.jsx";
import MatrixRotation2x3SVG from "./MatrixRotation2x3SVG.jsx"
import MatrixRotation3x3SVG from "./matrixRotation3x3SVG.jsx";

const RENDER_ENGINE = "svg"; // ← change later to "p5"

export function renderAIGStem({ templateId, parameters }) {
  switch (templateId) {
    
    case "matrix_1x4_rotation_v1":
      return <MatrixRotation1x4SVG grid={parameters.grid} />;
    
    case "matrix_2x3_rotation_v1":
      return <MatrixRotation2x3SVG grid={parameters.grid} />;

    case "matrix_3x3_rotation_v1":
      return <MatrixRotation3x3SVG grid={parameters.grid} />;
    
    default:
      return null;
  }
}

export function renderAIGOption({ option }) {
  if (!option?.visual) return null;
  
  if (RENDER_ENGINE === "p5") {
    return <PatternRotationP5 visual={option.visual} />;
  }

  return   <PatternRotationSVG
    {...option.visual}
    filled={false}
    color="black"
  />
}
