export function buildEvidenceScope({
  targetCompetency,
  competencies = []
}) {

  if (!targetCompetency) return [];

  const map = {};
  competencies.forEach(c => (map[c.id] = c));

  const scope = new Set();

  function add(id) {

    if (!id || scope.has(id)) return;

    scope.add(id);

    const c = map[id];

    if (!c) return;

    c.relationships?.forEach(r => {

      if (r.type === "prerequisite" || r.type === "part-of") {
        add(r.targetCompetencyId);
      }

    });

  }

  add(targetCompetency.id);

  return Array.from(scope).map(id => map[id]).filter(Boolean);

}