// /components/engines/warrantCoverageOptimizer.js
// 🧠 Competency‑Driven Warrant Coverage Optimizer (Enterprise ECD)
// ------------------------------------------------------------------
// Purpose
// -------
// Evaluates whether the current set of warrants provides balanced
// coverage for the target competency's evidence requirements.
//
// This optimizer DOES NOT generate warrants. Instead it:
// • evaluates attribute diversity
// • checks competency state coverage
// • verifies construct alignment
// • verifies prerequisite evidence alignment
// • checks evidence sufficiency
// • computes an interpretable health score
//
// IMPORTANT DESIGN PRINCIPLE
// --------------------------
// This module MUST use the same attribute vocabulary used by
// evidenceDiagnostics.js to prevent analytic inconsistencies.


import {
  attributesAlign,
  familyCounts,
  familyLabel,
  mentions,
  warrantText
} from "../utils/attributeAlignment"


/* =====================================================
   Utilities
===================================================== */

function safeArray(v){
  return Array.isArray(v) ? v : []
}

function lower(v=""){
  return String(v || "").toLowerCase().trim()
}

function unique(arr=[]){
  return [...new Set(arr.filter(Boolean))]
}


/* =====================================================
   Attribute Coverage Analysis
===================================================== */

export function analyzeAttributeCoverage(warrants=[]){

  const counts = {}

  safeArray(warrants).forEach(w => {

    const attr = lower(w?.cognitiveAttribute)

    if(!attr) return

    if(!counts[attr]) counts[attr] = 0

    counts[attr]++

  })

  return counts

}


/* =====================================================
   Attribute Diversity Enforcement
===================================================== */

export function enforceAttributeDiversity({

  warrants = [],

  expectedAttributes = []

}){

  const diagnostics = []

  if(!expectedAttributes.length) return diagnostics

  // Matched on cognitive process family, not on exact text. The previous
  // `coverage[lower(attr)]` lookup compared an expectation phrase against a
  // warrant's raw cognitiveAttribute string, which are drawn from two
  // different vocabularies (see utils/attributeAlignment.js) and so never
  // matched -- every expected attribute was reported as a gap regardless of
  // the warrants present, and each gap cost the structural health score 10
  // points.

  expectedAttributes.forEach(attr => {

    const covered = safeArray(warrants).some(w =>

      attributesAlign(w?.cognitiveAttribute, attr)

    )

    if(!covered){

      diagnostics.push({

        type : "attribute_gap",

        attribute : attr,

        severity : "high",

        message : `Evidence set does not include warrants supporting "${attr}".`

      })

    }

  })

  return diagnostics

}


/* =====================================================
   Attribute Weakness Detection
===================================================== */

export function detectWeakAttributes({

  warrants = []

}){

  const diagnostics = []

  // "Weak" has to mean weak RELATIVE to the rest of this evidence set.
  //
  // The old rule flagged any attribute supported by fewer than two warrants,
  // so a well-formed model with five warrants across five different
  // cognitive families produced five "Additional evidence recommended"
  // lines and lost 50 points of structural health for being diverse. A
  // family is now called out only when the model demonstrably CAN do better
  // -- some other family in the same model carries more warrants.

  const counts = familyCounts(warrants)

  const values = Object.values(counts)

  if(values.length < 2) return diagnostics

  const max = Math.max(...values)

  if(max < 2) return diagnostics

  Object.entries(counts).forEach(([key,count]) => {

    if(count >= max) return

    const label = familyLabel(key) || key

    diagnostics.push({

      type : "weak_attribute",

      attribute : label,

      severity : "low",

      message : `Only ${count} warrant${count === 1 ? "" : "s"} support${count === 1 ? "s" : ""} "${label}", against ${max} for the best-covered area. Evidence is unevenly distributed.`

    })

  })

  return diagnostics

}


/* =====================================================
   Competency State Coverage (Ordinal / Categorical)
===================================================== */

export function enforceStateCoverage({

  warrants = [],

  competencyStates = []

}){

  const diagnostics = []

  if(!competencyStates.length) return diagnostics

  // Matched against everything the author typed into the warrant, not just
  // the auto-generated reasoningStatement, and by content-word overlap
  // rather than a literal `includes()`. Authors describe a state ("applies
  // the procedure with occasional slips"), they do not quote its label
  // ("Developing"), so the old test failed for every state of every
  // competency -- four states cost 40 points of structural health on a model
  // that covered them all.

  competencyStates.forEach(state => {

    const found = safeArray(warrants).some(w =>

      mentions(warrantText(w), state?.label)

    )

    if(!found){

      diagnostics.push({

        type : "state_gap",

        state : state.label,

        severity : "medium",

        message : `No warrant references competency state "${state.label}".`

      })

    }

  })

  return diagnostics

}


/* =====================================================
   Construct Alignment Check
===================================================== */

export function enforceConstructCoverage({

  warrants = [],

  competency

}){

  const diagnostics = []

  if(!competency) return diagnostics

  // A warrant BOUND to this competency is construct evidence, full stop --
  // that binding is the structural link Step 3 requires on every warrant and
  // schema.js validates. The old check ignored it and instead demanded the
  // facet name appear verbatim inside reasoningStatement, so a model whose
  // every warrant targeted the competency was still told "No warrant
  // explicitly references the target construct."
  //
  // Textual reference is kept as a secondary route for warrants scoped to a
  // related competency (buildEvidenceScope pulls prerequisites and
  // correlates into the set).

  const boundToConstruct = safeArray(warrants).some(w =>

    w?.competencyId === competency.id

  )

  const referencesConstruct = safeArray(warrants).some(w => {

    const text = warrantText(w)

    return (
      mentions(text, competency?.facet) ||
      mentions(text, competency?.strand) ||
      mentions(text, competency?.name)
    )

  })

  if(!boundToConstruct && !referencesConstruct){

    diagnostics.push({

      type : "construct_gap",

      construct : `${competency.domain} → ${competency.strand} → ${competency.facet}`,

      severity : "high",

      message : "No warrant targets or references the target construct."

    })

  }

  return diagnostics

}


/* =====================================================
   Prerequisite Evidence Coverage
===================================================== */

export function enforcePrerequisiteCoverage({

  warrants = [],

  competency,

  competencies = []

}){

  const diagnostics = []

  const prereqs = safeArray(competency?.relationships)

    .filter(r => r.type === "prerequisite")

  prereqs.forEach(rel => {

    const prereq = competencies.find(

      c => c.id === rel.targetCompetencyId

    )

    if(!prereq) return

    // Same correction as construct coverage: a warrant explicitly bound to
    // the prerequisite competency IS evidence for it. Only fall back to
    // textual reference when no warrant is bound.

    const found = safeArray(warrants).some(w =>

      w?.competencyId === prereq.id ||

      mentions(warrantText(w), prereq.name)

    )

    if(!found){

      diagnostics.push({

        type : "prerequisite_gap",

        competency : prereq.name,

        severity : "medium",

        message : `No warrant references prerequisite competency "${prereq.name}".`

      })

    }

  })

  return diagnostics

}


/* =====================================================
   Evidence Sufficiency Check
===================================================== */

export function enforceEvidenceSufficiency({

  warrants = [],

  minimum = 3

}){

  if(warrants.length >= minimum) return []

  return [{

    type : "insufficient_evidence",

    severity : "medium",

    message : `Evidence model contains only ${warrants.length} warrants. At least ${minimum} recommended.`

  }]

}


/* =====================================================
   Coverage Health Score
===================================================== */

const SEVERITY_PENALTY = {
  high   : 15,
  medium : 8,
  low    : 3
}

function computeCoverageScore(diagnostics=[]){

  if(!diagnostics.length) return 100

  // Weighted by severity instead of a flat 10 per diagnostic. A model with
  // one genuine construct gap and four "evidence is unevenly distributed"
  // notes is not equally broken in five ways, and the flat rule drove the
  // score to 0 quickly enough that it stopped discriminating between models
  // at all.

  const penalties = diagnostics.reduce(

    (total, d) => total + (SEVERITY_PENALTY[d?.severity] ?? 8),

    0

  )

  return Math.max(0, 100 - penalties)

}


/* =====================================================
   Master Coverage Optimizer
===================================================== */

export function optimizeWarrantCoverage({

  warrants = [],

  competency,

  competencies = [],

  expectedAttributes = [],

  competencyStates = []

}){

  const diagnostics = []


  /* Attribute Coverage */

  diagnostics.push(

    ...enforceAttributeDiversity({

      warrants,

      expectedAttributes

    })

  )


  /* Attribute Weakness */

  diagnostics.push(

    ...detectWeakAttributes({

      warrants

    })

  )


  /* State Coverage */

  diagnostics.push(

    ...enforceStateCoverage({

      warrants,

      competencyStates

    })

  )


  /* Construct Alignment */

  diagnostics.push(

    ...enforceConstructCoverage({

      warrants,

      competency

    })

  )


  /* Prerequisite Evidence */

  diagnostics.push(

    ...enforcePrerequisiteCoverage({

      warrants,

      competency,

      competencies

    })

  )


  /* Evidence Sufficiency */

  diagnostics.push(

    ...enforceEvidenceSufficiency({

      warrants

    })

  )


  const healthScore = computeCoverageScore(diagnostics)


  return {

    healthScore,

    diagnostics

  }

}
