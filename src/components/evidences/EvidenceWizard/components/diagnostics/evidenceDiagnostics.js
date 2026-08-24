// /components/diagnostics/evidenceDiagnostics.js
// 🧠 Enterprise ECD Evidence Diagnostics Engine (Full Refactor)
// -----------------------------------------------------------------------------
// Core analytics engine used by the Evidence Wizard.
//
// Evaluates:
// • Cognitive attribute expectations inferred from claims
// • Attribute coverage by warrants
// • Evidence → competency mapping
// • Construct coverage
// • Competency prerequisite integrity
// • Structural alignment scoring
//
// Design Principles
// • Deterministic analytics (no UI assumptions)
// • Pure functions
// • Defensive safety guards
// • Works with scoped competency sets

import {
  attributesAlign,
  familyLabel,
  inferExpectedFamiliesFromText
} from "../utils/attributeAlignment";

/* =====================================================
   Utilities
===================================================== */

function safe(text = "") {
  return String(text || "").trim();
}

function lower(text = "") {
  return safe(text).toLowerCase();
}

function safeArray(v) {
  return Array.isArray(v) ? v : [];
}

function constructKey(c) {
  return [c?.domain, c?.strand, c?.facet]
    .filter(Boolean)
    .map(safe)
    .join(" → ");
}

/* =====================================================
   Infer Expected Cognitive Attributes
===================================================== */

export function inferExpectedAttributes(claimText = "") {

  // What KIND of cognitive evidence does this claim promise?
  //
  // This used to be a hand-written list of five phrases ("procedural
  // fluency", "logical reasoning ability", ...) keyed off a handful of
  // verbs. Nothing else in the app speaks that vocabulary: warrants are
  // tagged from cognitiveAttributeOntology.js, whose labels are things like
  // "Algorithm Execution" and "Deductive Inference". Expected and actual
  // could therefore never match, so Evidence Coverage reported a gap for
  // every phrase no matter which warrants existed.
  //
  // Both sides now resolve to a shared cognitive process family (see
  // utils/attributeAlignment.js), and every verb family in the claim is
  // returned rather than just the first -- "solve and justify" expects
  // procedural AND reasoning evidence.

  return inferExpectedFamiliesFromText(claimText).map(familyLabel);

}

/* =====================================================
   Extract Attributes From Warrants
===================================================== */

export function extractActualAttributes(warrants = []) {

  return safeArray(warrants)
    .map(w => lower(w?.cognitiveAttribute))
    .filter(Boolean);

}

/* =====================================================
   Attribute Coverage
===================================================== */

export function computeAttributeCoverage(
  expectedAttributes = [],
  actualAttributes = []
) {

  // `attributesAlign` matches on the cognitive process family, falling back
  // to exact text equality. The old `actualAttributes.includes(attr)` was
  // exact-string-only, which is why a warrant tagged "Algorithm Execution"
  // never counted as covering an expectation of procedural evidence.

  return safeArray(expectedAttributes).map(attr => ({

    attribute: attr,

    covered: safeArray(actualAttributes).some(actual =>
      attributesAlign(actual, attr)
    )

  }));

}

/* =====================================================
   Attribute Coverage Score
===================================================== */

export function computeCoverageScore(coverage = []) {

  // No expected attributes were inferred from the claim text at all --
  // there is nothing to be missing, so this must not read as "0%
  // covered" (a false failure signal). Previously it did, which is why
  // "Evidence Coverage" could sit at 0 even when the claim simply didn't
  // happen to contain one of inferExpectedAttributes()'s trigger words
  // ("solve", "apply", "analyze", ...) -- a near-certainty for a claim
  // written in domain-specific language rather than that fixed phrase
  // list. Nothing expected is treated as nothing missing (100), not as
  // a coverage gap.
  if (!coverage.length) return 100;

  const covered = coverage.filter(c => c.covered).length;

  return Math.round((covered / coverage.length) * 100);

}

/* =====================================================
   Build Competency Graph
===================================================== */

export function buildCompetencyGraph(competencies = []) {

  const graph = {};

  safeArray(competencies).forEach(c => {

    graph[c.id] = {

      competency: c,

      prerequisites: [],

      dependents: []

    };

  });


  safeArray(competencies).forEach(c => {

    safeArray(c.relationships).forEach(rel => {

      if (rel.type !== "prerequisite") return;


      graph[c.id]?.prerequisites.push(rel.targetCompetencyId);


      if (graph[rel.targetCompetencyId]) {

        graph[rel.targetCompetencyId].dependents.push(c.id);

      }

    });

  });


  return graph;

}

/* =====================================================
   Evidence Mapping
===================================================== */

export function mapEvidenceToCompetencies({

  competencies = [],

  warrants = []

}) {

  const competencyEvidence = {};


  safeArray(competencies).forEach(c => {

    competencyEvidence[c.id] = 0;

  });


  safeArray(warrants).forEach(w => {

    const compId = w?.competencyId;

    if (!compId) return;


    if (competencyEvidence[compId] !== undefined)

      competencyEvidence[compId]++;

  });


  return competencyEvidence;

}

/* =====================================================
   Build Construct Map
===================================================== */

export function buildConstructMap(competencies = []) {

  const map = {};


  safeArray(competencies).forEach(c => {

    const key = constructKey(c);


    if (!map[key]) {

      map[key] = {

        construct: key,

        competencyIds: [],

        covered: false,

        coverageCount: 0

      };

    }


    map[key].competencyIds.push(c.id);

  });


  return map;

}

/* =====================================================
   Compute Construct Coverage
===================================================== */

export function computeConstructCoverage({

  competencies = [],

  competencyEvidence = {}

}) {

  const constructMap = buildConstructMap(competencies);


  Object.values(constructMap).forEach(entry => {

    entry.competencyIds.forEach(id => {

      const count = competencyEvidence[id] || 0;


      if (count > 0) {

        entry.covered = true;

        entry.coverageCount += count;

      }


    });

  });


  return constructMap;

}

/* =====================================================
   Construct Coverage Score
===================================================== */

export function computeConstructCoverageScore(constructMap = {}) {

  const constructs = Object.values(constructMap);

  if (!constructs.length) return 0;


  const covered = constructs.filter(c => c.covered).length;


  return Math.round((covered / constructs.length) * 100);

}

/* =====================================================
   Graph Diagnostics
===================================================== */

export function computeGraphDiagnostics({

  competencyGraph = {},

  competencyEvidence = {}

}) {

  const warnings = [];


  Object.entries(competencyGraph).forEach(([id, node]) => {

    if (!competencyEvidence[id]) return;


    node.prerequisites.forEach(pr => {

      if (!competencyEvidence[pr]) {

        warnings.push({

          type: "missing_prerequisite",

          competency: node.competency?.name,

          prerequisite: competencyGraph[pr]?.competency?.name

        });

      }


    });


  });


  return warnings;

}

/* =====================================================
   Alignment Score
===================================================== */

export function computeAlignmentScore({

  claimScore = 0,

  coverageScore = 0,

  constructCoverageScore = 0

}) {

  return Math.round(

    claimScore * 0.3 +

    coverageScore * 0.3 +

    constructCoverageScore * 0.4

  );

}

/* =====================================================
   Master Diagnostics Runner
===================================================== */

export function runEvidenceDiagnostics({

  claimText = "",

  claimScore = 0,

  warrants = [],

  competencies = []

}) {

  const expectedAttributes = inferExpectedAttributes(claimText);

  const actualAttributes = extractActualAttributes(warrants);


  const coverage = computeAttributeCoverage(

    expectedAttributes,

    actualAttributes

  );


  const coverageScore = computeCoverageScore(coverage);


  const competencyGraph = buildCompetencyGraph(competencies);


  const competencyEvidence = mapEvidenceToCompetencies({

    competencies,

    warrants

  });


  const constructMap = computeConstructCoverage({

    competencies,

    competencyEvidence

  });


  const constructCoverageScore = computeConstructCoverageScore(constructMap);


  const graphDiagnostics = computeGraphDiagnostics({

    competencyGraph,

    competencyEvidence

  });


  const alignmentScore = computeAlignmentScore({

    claimScore,

    coverageScore,

    constructCoverageScore

  });


  return {

    expectedAttributes,

    actualAttributes,

    coverage,

    coverageScore,

    constructMap,

    constructCoverageScore,

    alignmentScore,

    competencyGraph,

    competencyEvidence,

    graphDiagnostics

  };

}
