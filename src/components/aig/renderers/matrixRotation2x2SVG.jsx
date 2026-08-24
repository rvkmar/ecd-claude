import React from "react";
import PatternRotationSVG from "./patternRotationSVG.jsx";

export default function MatrixRotation2x2SVG({ grid }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {grid.map((cell, idx) =>
        cell ? (
          <PatternRotationSVG
            shape={cell.shape}
            rotation={cell.rotation}
            internal={cell.internal}
            filled={false}
            color="black"
          />
        ) : (
          <div
            key={idx}
            className="flex items-center justify-center border rounded text-lg font-bold"
          >
            ?
          </div>
        )
      )}
    </div>
  );
}
