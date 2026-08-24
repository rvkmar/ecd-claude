import React from "react";
import PatternRotationSVG from "./patternRotationSVG.jsx";

export default function MatrixRotation3x3SVG({ grid }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {grid.map((cell, idx) =>
        cell ? (
          <div
            key={idx}
            className="flex items-center justify-center border rounded p-2"
          >
            <PatternRotationSVG
              shape={cell.shape}
              rotation={cell.rotation}
              internal={cell.internal}
              filled={false}
              color="black"
            />
          </div>
        ) : (
          <div
            key={idx}
            className="flex items-center justify-center border rounded text-xl font-bold"
          >
            ?
          </div>
        )
      )}
    </div>
  );
}

