/**
 * AIG Visual Contract
 * Renderer MUST be a pure function of this object.
 * No inference, no rules, no mutation.
 */
export const VisualSchema = {
  shape: "square | triangle | circle | hexagon",
  rotation: "number (degrees)",
  internal: {
    type: "crosshair | small_square | arrow_group",
    divisionIndex: "number",
    color: "string",
  },
};
