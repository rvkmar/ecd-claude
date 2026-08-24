// src/components/itemBank/ItemWizard/hooks/useItemListData.js
// ------------------------------------------------------------
// Item Bank governance statistics.
//
// The competency dimension is DERIVED here rather than read off the item.
// `item.metadata.competencyId` was read by useBlueprintAnalytics for both
// the Competency coverage chart and the lifecycle-by-competency
// breakdown, and NOTHING in the codebase has ever written that field —
// not the wizard, not the routes, not the bulk importer. Both charts have
// been empty since they shipped.
//
// Adding a writer would have been the wrong fix: an item carrying its own
// competencyId is a second, unvalidated declaration of the construct,
// free to contradict the Evidence Model that actually governs the
// inference — the same mistake the Task Model rework removed from
// `taskPurpose.primaryCompetencyId`. The construct is a function of the
// chain, so it is computed from the chain:
//
//     item.evidenceModelId -> evidenceModel.competencyId -> competency.name
// ------------------------------------------------------------

import { useMemo } from "react";
import { useItems } from "@/api/queries/items";
import { useEvidenceModels } from "@/api/queries/evidenceModels";
import { useCompetencies } from "@/api/queries/competencies";
import { apiErrorMessage } from "@/api/apiClient";
import { STATUS } from "../../../../../server/utils/lifecycleMatrix.js";

export default function useItemListData(filters = {}) {
  const {
    data,
    isLoading,
    error: queryError,
    refetch,
  } = useItems(filters);

  // Both lists are already cached by the other builders, so this is
  // usually free.
  const { data: evidenceModels = [] } = useEvidenceModels();
  const { data: competencies = [] } = useCompetencies();

  const items = data || [];
  const loading = isLoading;
  const error = queryError
    ? apiErrorMessage(queryError, queryError.message || "Failed to fetch items.")
    : null;

  /* Item id -> construct label, resolved through the chain. */
  const competencyByItem = useMemo(() => {
    const emById = new Map((evidenceModels || []).map((e) => [e.id, e]));
    const compById = new Map((competencies || []).map((c) => [c.id, c]));

    const map = new Map();

    items.forEach((item) => {
      const em = emById.get(item.evidenceModelId);
      if (!em?.competencyId) return;

      const competency = compById.get(em.competencyId);
      map.set(item.id, competency?.name || em.competencyId);
    });

    return map;
  }, [items, evidenceModels, competencies]);

  /* Lifecycle distribution.

     Built from STATUS rather than a hand-written object literal, which
     omitted `archived` — so archived items were counted in `totalItems`
     but appeared in no lifecycle slice, and the pie chart's segments did
     not sum to the total it was displayed beside. */
  const lifecycleStats = useMemo(() => {
    const base = Object.fromEntries(STATUS.map((s) => [s, 0]));

    items.forEach((item) => {
      const status = item.status || "draft";
      if (base[status] !== undefined) base[status] += 1;
    });

    return base;
  }, [items]);

  const lockStats = useMemo(() => {
    let locked = 0;
    let unlocked = 0;
    items.forEach((item) => (item.locked ? (locked += 1) : (unlocked += 1)));
    return { locked, unlocked };
  }, [items]);

  const calibrationStats = useMemo(() => {
    let calibrated = 0;
    let pilot = 0;
    let uncalibrated = 0;

    items.forEach((item) => {
      const status = item.psychometrics?.calibrationStatus || "uncalibrated";
      if (status === "calibrated") calibrated += 1;
      else if (status === "pilot") pilot += 1;
      else uncalibrated += 1;
    });

    return { calibrated, pilot, uncalibrated };
  }, [items]);

  /* Exposure risk.

     Restricted to items that are actually in service. A draft with a
     ceiling of 1 and a usageCount of 0 is not "healthy", it is
     irrelevant, and counting it diluted the figure the dashboard exists
     to surface. */
  const exposureStats = useMemo(() => {
    let nearingRetirement = 0;
    let overused = 0;
    let unbounded = 0;

    items
      .filter((i) => ["operational", "suspended"].includes(i.status))
      .forEach((item) => {
        const usage = item.exposureControl?.usageCount || 0;
        const maxUsage = item.exposureControl?.maxUsageBeforeRetire || 0;

        if (!maxUsage) {
          unbounded += 1;
          return;
        }

        const ratio = usage / maxUsage;
        if (ratio >= 1) overused += 1;
        else if (ratio >= 0.8) nearingRetirement += 1;
      });

    return { nearingRetirement, overused, unbounded };
  }, [items]);

  return {
    items,
    totalItems: items.length,
    loading,
    error,
    refetch,

    competencyByItem,
    lifecycleStats,
    lockStats,
    calibrationStats,
    exposureStats,
  };
}
