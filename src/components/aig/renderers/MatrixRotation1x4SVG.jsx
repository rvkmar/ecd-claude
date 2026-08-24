import React from "react";
import PatternRotationSVG from "./patternRotationSVG.jsx";

export default function MatrixRotation1x4SVG({ grid }) {
  return (
    <div
      className="flex gap-8"
    >
      {grid.map((cell, idx) => (
        <div
          key={idx}
          className="w-[120px] h-[120px] flex items-center justify-center"
        >
            {cell ? (
              <PatternRotationSVG
                shape={cell.shape}
                rotation={cell.rotation}
                internal={cell.internal}
                filled={false}
                color="black"
              />
            ) : (
              <span className="text-2xl font-semibold">?</span>
            )}
        </div>
      ))}
    </div>
  );
}
