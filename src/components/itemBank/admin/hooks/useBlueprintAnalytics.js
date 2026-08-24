// src/components/itemBank/admin/hooks/useBlueprintAnalytics.js
// ------------------------------------------------------------
// Blueprint coverage analytics.
//
// Three of the five dimensions read fields that do not exist:
//
//   competencyCoverage      item.metadata.competencyId    never written by anything
//   dokCoverage             cognitiveDemand.depthOfKnowledge  not in the schema
//   gradeCoverage           item.metadata.gradeLevel      schema declares `grade`
//
// The wizard wrote `gradeLevel` and `depthOfKnowledge` too, so those two
// charts agreed with the wizard about fields the store never declared —
// which meant they worked until anything else touched the record, and
// were invisible to every other consumer. `competencyId` had no writer at
// all, so that chart has always been empty.
//
// The schema-declared names are `metadata.grade` and
// `cognitiveDemand.soloLevel`, and the construct is derived through the
// chain rather than stored on the item (see useItemListData). This hook
// now takes that derivation as a second argument.
// ------------------------------------------------------------

import { useMemo } from "react";

function tally(items, pick) {
  const map = {};

  items.forEach((item) => {
    const key = pick(item);
    if (key === undefined || key === null || key === "") return;
    map[key] = (map[key] || 0) + 1;
  });

  return map;
}

export default function useBlueprintAnalytics(items = [], competencyByItem = new Map()) {
  const competencyCoverage = useMemo(
    () => tally(items, (item) => competencyByItem.get(item.id)),
    [items, competencyByItem]
  );

  const bloomCoverage = useMemo(
    () => tally(items, (item) => item.cognitiveDemand?.bloomLevel),
    [items]
  );

  // SOLO, which is what the schema declares. The chart component keeps
  // its `dokCoverage` prop name so its call sites are unchanged; the
  // label it renders is corrected there.
  const soloCoverage = useMemo(
    () => tally(items, (item) => item.cognitiveDemand?.soloLevel),
    [items]
  );

  const gradeCoverage = useMemo(
    () => tally(items, (item) => item.metadata?.grade),
    [items]
  );

  const subjectCoverage = useMemo(
    () => tally(items, (item) => item.metadata?.subject),
    [items]
  );

  const difficultyCoverage = useMemo(
    () => tally(items, (item) => item.metadata?.difficulty),
    [items]
  );

  const lifecycleByCompetency = useMemo(() => {
    const map = {};

    items.forEach((item) => {
      const competency = competencyByItem.get(item.id);
      if (!competency) return;

      if (!map[competency]) {
        map[competency] = {
          draft: 0,
          reviewed: 0,
          confirmed: 0,
          operational: 0,
          suspended: 0,
          archived: 0,
        };
      }

      const status = item.status || "draft";
      if (map[competency][status] !== undefined) map[competency][status] += 1;
    });

    return map;
  }, [items, competencyByItem]);

  /* How much of the bank carries the metadata the charts above need.
     Without this a flat, empty chart reads as "no coverage in this
     dimension" when it means "nobody filled the field in". */
  const metadataCompleteness = useMemo(() => {
    const total = items.length || 1;

    const count = (pick) => items.filter((i) => !!pick(i)).length;

    return {
      total: items.length,
      competency: count((i) => competencyByItem.get(i.id)),
      bloom: count((i) => i.cognitiveDemand?.bloomLevel),
      solo: count((i) => i.cognitiveDemand?.soloLevel),
      grade: count((i) => i.metadata?.grade),
      subject: count((i) => i.metadata?.subject),
      difficulty: count((i) => i.metadata?.difficulty),
      pct: (n) => Math.round((n / total) * 100),
    };
  }, [items, competencyByItem]);

  return {
    competencyCoverage,
    bloomCoverage,
    soloCoverage,
    // Kept for the existing DOKBarChart call site, which is now fed SOLO.
    dokCoverage: soloCoverage,
    gradeCoverage,
    subjectCoverage,
    difficultyCoverage,
    lifecycleByCompetency,
    metadataCompleteness,
  };
}
