// server/migrations/migrations/002-normalize-tools-allowed.js
// One-off pass rewriting taskStructure.resourceConstraints.toolsAllowed
// from a comma-separated string to a string[]. See the header comment on
// toolsAllowedList() in src/utils/schema.js for the crash this caused and
// why the reader no longer tolerates the string shape after this runs.
//
// Task Models are a governed entity behind server/utils/dbAdapter.js
// (json or Mongo), so this migration goes through dbAdapter rather than
// touching either storage directly -- it works in both DB_MODEs.

import { dbAdapter } from "../../utils/dbAdapter.js";

function toArray(raw) {
  if (Array.isArray(raw)) return raw;
  return String(raw ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

export default {
  id: "002-normalize-tools-allowed",
  description:
    "Rewrite taskStructure.resourceConstraints.toolsAllowed from a comma-separated string to a string[].",

  async run({ dryRun }) {
    const taskModels = await dbAdapter.list("taskModels");
    const changed = [];

    for (const tm of taskModels) {
      const rc = tm?.taskStructure?.resourceConstraints;
      if (!rc || Array.isArray(rc.toolsAllowed)) continue;

      changed.push(tm.id);

      if (!dryRun) {
        await dbAdapter.update("taskModels", tm.id, {
          taskStructure: {
            ...tm.taskStructure,
            resourceConstraints: {
              ...rc,
              toolsAllowed: toArray(rc.toolsAllowed),
            },
          },
        });
      }
    }

    return {
      changed,
      summary: changed.length
        ? `Normalized toolsAllowed on ${changed.length} Task Model(s): ${changed.join(", ")}`
        : "No Task Models had a string-shaped toolsAllowed; nothing to do.",
    };
  },
};
