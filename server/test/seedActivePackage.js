// server/test/seedActivePackage.js
//
// Test-only. Compiles an active compositeLibrary package for every Task
// Model in a fixture db, so Identification/submit tests exercise the D49c
// contract (score from the package) without each file hand-building the
// same projection.
//
// Items that are not yet instantiable (draft, or missing a status) are
// temporarily treated as confirmed so a preview-style fixture still gets
// a package entry. Production compileAndActivate does NOT do this — a
// draft item that was never compiled is refused at score time, which is
// the point of ADR 0003a.

import { INSTANTIABLE_TASK_MODEL_STATUSES } from "../../src/utils/schema.js";
import { buildCompositeLibrary } from "../compositeLibrary/builder.js";

export function seedActivePackages(db) {
  if (!db) return db;
  db.compositeLibrary = Array.isArray(db.compositeLibrary) ? db.compositeLibrary : [];

  for (const taskModel of db.taskModels || []) {
    if (db.compositeLibrary.some((p) => p.taskModelId === taskModel.id && p.active === true)) {
      continue;
    }

    const instantiableTm = {
      ...taskModel,
      status: INSTANTIABLE_TASK_MODEL_STATUSES.includes(taskModel.status)
        ? taskModel.status
        : "operational",
      locked: true,
      versionNumber: taskModel.versionNumber ?? 1,
    };

    const items = (db.items || []).map((item) =>
      item.taskModelId === taskModel.id
        ? {
            ...item,
            status: INSTANTIABLE_TASK_MODEL_STATUSES.includes(item.status) ? item.status : "confirmed",
            taskModelVersion: item.taskModelVersion ?? instantiableTm.versionNumber,
          }
        : item
    );

    const { record } = buildCompositeLibrary(instantiableTm, { ...db, items });
    db.compositeLibrary.push({
      ...record,
      id: `cl-${taskModel.id}`,
      active: true,
    });
  }

  return db;
}
