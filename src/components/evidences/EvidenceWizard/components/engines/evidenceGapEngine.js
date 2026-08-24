// /components/engines/evidenceGapEngine.js
// 🧠 Enterprise Evidence Gap Recommendation Engine (Full Refactor)
// -----------------------------------------------------------------------------
// Detects missing, weak, or structurally incomplete evidence within
// an Evidence Model relative to a target competency.
//
// Diagnostics
// • Cognitive attribute gaps
// • Weak attribute coverage
// • Missing construct evidence
// • Missing prerequisite competency evidence
// • Missing competency state coverage
//
// Design Principles
// • Operates on scoped competencies
// • Deterministic warrant analysis
// • Competency-aware evidence reasoning
// • Defensive safe guards

import { generateWarrantSuggestions } from "./warrantSuggestionEngine";
import {
  attributesAlign,
  familyCounts,
  familyLabel,
  inferExpectedFamiliesFromText,
  mentions,
  warrantText
} from "../utils/attributeAlignment";

/* =====================================================
   Utilities
===================================================== */

function safeArray(v) {
  return Array.isArray(v) ? v : [];
}

function constructPath(competency) {

  if (!competency) return "";

  return [
    competency.domain,
    competency.strand,
    competency.facet
  ]
    .filter(Boolean)
    .join(" → ");

}

/* =====================================================
   Expected Cognitive Attributes
===================================================== */

export function inferExpectedAttributesFromCompetency({

  claimText = "",

  competency = {}

}) {

  // Which cognitive process families should this evidence model be able to
  // show evidence for?
  //
  // This used to be five hard-coded rules over subject names ("Mathematics"
  // implies procedural fluency, a strand containing "algebra" implies
  // symbolic reasoning, ...). Two problems: the phrases it produced belong
  // to no vocabulary the warrants use, so every one of them was reported as
  // an unfilled gap forever; and the rules only fired for one subject, so
  // every non-Mathematics competency got a recommendation list driven purely
  // by two claim keywords.
  //
  // Expectations now come from the language of the claim and of the
  // competency itself, resolved to the same process families warrants
  // resolve to (see utils/attributeAlignment.js), which is what makes the
  // resulting recommendations answerable by adding a warrant.

  const families = new Set(inferExpectedFamiliesFromText(claimText));

  const competencyText = [
    competency?.name,
    competency?.domain,
    competency?.strand,
    competency?.facet,
    competency?.description
  ]
    .filter(Boolean)
    .join(" ");

  inferExpectedFamiliesFromText(competencyText).forEach(f => families.add(f));

  return Array.from(families).map(familyLabel);

}

/* =====================================================
   Attribute Gap Detection
===================================================== */

export function detectAttributeGaps({

  claimText = "",

  targetCompetency = {},

  warrants = []

}) {

  const expected = inferExpectedAttributesFromCompetency({

    claimText,

    competency: targetCompetency

  });


  // Family-level comparison. The old `actual.includes(lower(attr))` demanded
  // that a warrant's cognitiveAttribute be character-for-character one of
  // the expected phrases, which no warrant ever is.

  return expected.filter(attr =>

    !safeArray(warrants).some(w => attributesAlign(w?.cognitiveAttribute, attr))

  );

}

/* =====================================================
   Weak Attribute Detection
===================================================== */

export function detectWeakAttributes({

  warrants = []

}) {

  // Relative, not absolute -- see the same correction in
  // warrantCoverageOptimizer.detectWeakAttributes. The old rule
  // (`count <= 1`) flagged every cognitive area a well-balanced model
  // covered exactly once, turning breadth into a wall of warnings.

  const counts = familyCounts(warrants);

  const values = Object.values(counts);

  if (values.length < 2) return [];

  const max = Math.max(...values);

  if (max < 2) return [];

  return Object.entries(counts)

    .filter(([, count]) => count < max)

    .map(([key]) => familyLabel(key) || key);

}

/* =====================================================
   Missing Construct Evidence
===================================================== */

export function detectMissingConstructEvidence({

  targetCompetency,

  warrants = []

}) {

  if (!targetCompetency) return [];


  const construct = constructPath(targetCompetency);


  const hasEvidence = safeArray(warrants).some(w =>

    w?.competencyId === targetCompetency.id

  );


  if (!hasEvidence) {

    return [

      {

        construct,

        competencyId: targetCompetency.id

      }

    ];

  }


  return [];

}

/* =====================================================
   Missing Prerequisite Evidence
===================================================== */

export function detectPrerequisiteGaps({

  targetCompetency,

  competencyGraph = {},

  competencyEvidence = {}

}) {

  const warnings = [];


  const prereqs = safeArray(targetCompetency?.relationships)

    .filter(r => r.type === "prerequisite")

    .map(r => r.targetCompetencyId);


  prereqs.forEach(prId => {

    const prereq = competencyGraph?.[prId];


    if (!prereq) return;


    if (!competencyEvidence[prId]) {

      warnings.push({

        type: "missing_prerequisite",

        competencyId: prId,

        competencyName: prereq?.competency?.name

      });

    }


  });


  return warnings;

}

/* =====================================================
   Missing State Coverage
===================================================== */

export function detectStateCoverageGaps({

  competencyStates = [],

  warrants = []

}) {

  const missing = [];


  // Content-word overlap across everything the author typed, rather than a
  // literal substring test against the auto-generated reasoning statement.
  // Authors describe what a state looks like; they do not quote its label,
  // so the old test reported every state of every competency as uncovered.

  safeArray(competencyStates).forEach(state => {

    if (!state?.label) return;

    const covered = safeArray(warrants).some(w =>

      mentions(warrantText(w), state.label)

    );


    if (!covered) missing.push(state.label);

  });


  return missing;

}

/* =====================================================
   Generate Gap Recommendations
===================================================== */

export function generateGapRecommendations({

  claimText = "",

  targetCompetency = {},

  competencyGraph = {},

  competencyEvidence = {},

  competencyStates = [],

  warrants = []

}) {

  const recommendations = [];


  /* Attribute gaps */

  const attributeGaps = detectAttributeGaps({

    claimText,

    targetCompetency,

    warrants

  });


  attributeGaps.forEach(attr => {

    recommendations.push({

      type: "missing_attribute",

      attribute: attr,

      severity: "high",

      message: `No warrants provide evidence for "${attr}".`

    });

  });


  /* Weak attributes */

  const weakAttrs = detectWeakAttributes({ warrants });


  weakAttrs.forEach(attr => {

    recommendations.push({

      type: "weak_attribute",

      attribute: attr,

      severity: "medium",

      message: `"${attr}" is supported by fewer warrants than the best-covered area of this model.`

    });

  });


  /* Missing construct evidence */

  const missingConstructs = detectMissingConstructEvidence({

    targetCompetency,

    warrants

  });


  safeArray(missingConstructs).forEach(c => {

    recommendations.push({

      type: "missing_construct",

      construct: c.construct,

      severity: "high",

      message: `No evidence currently supports construct "${c.construct}".`

    });

  });


  /* Missing prerequisite evidence */

  const prerequisiteGaps = detectPrerequisiteGaps({

    targetCompetency,

    competencyGraph,

    competencyEvidence

  });


  prerequisiteGaps.forEach(p => {

    recommendations.push({

      type: "missing_prerequisite",

      competencyId: p.competencyId,

      severity: "high",

      message: `No evidence references prerequisite competency "${p.competencyName}".`

    });

  });


  /* Missing state evidence */

  const stateGaps = detectStateCoverageGaps({

    competencyStates,

    warrants

  });


  stateGaps.forEach(state => {

    recommendations.push({

      type: "missing_state",

      state,

      severity: "medium",

      message: `No warrant references competency state "${state}".`

    });

  });


  return recommendations;

}

/* =====================================================
   Generate Warrant Suggestions
===================================================== */

export function generateGapWarrantSuggestions({

  recommendations = [],

  claimText = "",

  targetCompetency

}) {

  const suggestions = [];


  safeArray(recommendations).forEach(rec => {

    if (rec.type !== "missing_construct") return;


    const warrants = generateWarrantSuggestions({

      claimText,

      competency: targetCompetency

    });


    suggestions.push({

      construct: rec.construct,

      competencyId: targetCompetency?.id,

      warrants

    });

  });


  return suggestions;

}

/* =====================================================
   Master Gap Engine
===================================================== */

export function runEvidenceGapEngine({

  claimText = "",

  targetCompetency = {},

  competencyStates = [],

  competencyGraph = {},

  competencyEvidence = {},

  warrants = []

}) {

  const recommendations = generateGapRecommendations({

    claimText,

    targetCompetency,

    competencyGraph,

    competencyEvidence,

    competencyStates,

    warrants

  });


  const warrantSuggestions = generateGapWarrantSuggestions({

    recommendations,

    claimText,

    targetCompetency

  });


  return {

    recommendations,

    warrantSuggestions

  };

}
