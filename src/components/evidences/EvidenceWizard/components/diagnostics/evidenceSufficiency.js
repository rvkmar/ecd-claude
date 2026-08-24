// /components/diagnostics/evidenceSufficiency.js
// 🧠 Enterprise Evidence Sufficiency Engine (ECD-Aligned)
// -----------------------------------------------------------------------------
// Evaluates whether constructs and competencies have sufficient warrant
// support within an Evidence Model.
//
// Improvements over earlier implementation:
// • Uses competencyId mapping (not attribute text matching)
// • Stable construct aggregation
// • Competency-level evidence counting
// • Construct-level sufficiency scoring
// • Detailed diagnostics and warnings
// • Defensive programming safeguards

/* =====================================================
   Utilities
===================================================== */

function safe(text = "") {
  return String(text || "").trim();
}

function safeArray(v) {
  return Array.isArray(v) ? v : [];
}

function buildConstructKey(competency) {

  const domain = safe(competency?.domain) || "Unknown Domain";
  const strand = safe(competency?.strand) || "Unknown Strand";
  const facet = safe(competency?.facet) || "Unknown Facet";

  return `${domain} → ${strand} → ${facet}`;

}

/* =====================================================
   Build Construct Map
===================================================== */

function buildConstructMap(competencies = []) {

  const map = {};

  safeArray(competencies).forEach(c => {

    const key = buildConstructKey(c);

    if (!map[key]) {

      map[key] = {

        construct: key,

        competencyIds: [],

        evidenceCount: 0

      };

    }

    map[key].competencyIds.push(c.id);

  });

  return map;

}

/* =====================================================
   Map Warrants → Competency Evidence
===================================================== */

function mapEvidenceToCompetencies({ competencies = [], warrants = [] }) {

  const evidence = {};

  safeArray(competencies).forEach(c => {

    evidence[c.id] = 0;

  });

  safeArray(warrants).forEach(w => {

    const id = w?.competencyId;

    if (!id) return;

    if (evidence[id] !== undefined) evidence[id]++;

  });

  return evidence;

}

/* =====================================================
   Aggregate Construct Evidence
===================================================== */

function aggregateConstructEvidence({ constructMap = {}, competencyEvidence = {} }) {

  const result = JSON.parse(JSON.stringify(constructMap));

  Object.values(result).forEach(entry => {

    entry.competencyIds.forEach(id => {

      const count = competencyEvidence[id] || 0;

      entry.evidenceCount += count;

    });

  });

  return result;

}

/* =====================================================
   Evaluate Sufficiency
===================================================== */

function evaluateSufficiency({ constructMap = {}, minimumEvidencePerConstruct = 2 }) {

  const sufficiency = [];

  Object.values(constructMap).forEach(entry => {

    const count = entry.evidenceCount;

    let status = "adequate";

    if (count === 0) status = "missing";
    else if (count < minimumEvidencePerConstruct) status = "insufficient";

    sufficiency.push({

      construct: entry.construct,

      count,

      status

    });

  });

  return sufficiency;

}

/* =====================================================
   Build Diagnostics
===================================================== */

function buildDiagnostics(sufficiency = []) {

  const diagnostics = [];
  const warnings = [];

  sufficiency.forEach(s => {

    if (s.status === "adequate") {

      diagnostics.push({

        type: "adequate_evidence",

        construct: s.construct,

        count: s.count,

        message: `${s.construct} supported by ${s.count} warrant(s).`

      });

    }

    if (s.status === "insufficient") {

      warnings.push({

        type: "insufficient_evidence",

        construct: s.construct,

        count: s.count,

        message: `${s.construct} supported by only ${s.count} warrant(s).`

      });

    }

    if (s.status === "missing") {

      warnings.push({

        type: "missing_evidence",

        construct: s.construct,

        count: 0,

        message: `No evidence defined for ${s.construct}.`

      });

    }

  });

  return { diagnostics, warnings };

}

/* =====================================================
   Compute Sufficiency Score
===================================================== */

function computeScore(sufficiency = []) {

  const total = sufficiency.length;

  if (total === 0) return 0;

  const adequate = sufficiency.filter(s => s.status === "adequate").length;

  return Math.round((adequate / total) * 100);

}

/* =====================================================
   Master Engine
===================================================== */

export function runEvidenceSufficiency({

  competencies = [],

  warrants = [],

  minimumEvidencePerConstruct = 2

}) {

  /* Build construct definitions */

  const constructMap = buildConstructMap(competencies);


  /* Map warrants to competency evidence */

  const competencyEvidence = mapEvidenceToCompetencies({

    competencies,

    warrants

  });


  /* Aggregate evidence at construct level */

  const constructEvidence = aggregateConstructEvidence({

    constructMap,

    competencyEvidence

  });


  /* Evaluate sufficiency */

  const sufficiency = evaluateSufficiency({

    constructMap: constructEvidence,

    minimumEvidencePerConstruct

  });


  /* Build diagnostics */

  const { diagnostics, warnings } = buildDiagnostics(sufficiency);


  /* Compute score */

  const sufficiencyScore = computeScore(sufficiency);


  return {

    sufficiency,

    sufficiencyScore,

    diagnostics,

    warnings,

    constructEvidence

  };

}
