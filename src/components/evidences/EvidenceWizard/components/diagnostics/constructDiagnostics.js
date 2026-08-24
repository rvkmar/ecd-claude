// /components/diagnostics/constructDiagnostics.js
// 🧠 Enterprise ECD Construct Diagnostics Engine
// -----------------------------------------------------------------------------
// Evaluates structural alignment between the Evidence Model and
// Competency Model within the ECD framework.
//
// Responsibilities
// • Construct coverage evaluation
// • Competency → construct aggregation
// • Evidence density diagnostics
// • Redundant warrant detection
// • Dimensional model validation
// • Construct coverage scoring
//
// Design Principles
// • deterministic analytics
// • competencyId-based linkage
// • defensive programming
// • pure functional processing


/* =====================================================
   Utilities
===================================================== */

function safe(text=""){
  return String(text || "").trim()
}

function safeArray(v){
  return Array.isArray(v) ? v : []
}

function deepClone(obj){
  return JSON.parse(JSON.stringify(obj))
}


/* =====================================================
   Construct Key Builder
===================================================== */

export function buildConstructKey(competency){

  const domain = safe(competency?.domain) || "Unknown Domain"
  const strand = safe(competency?.strand) || "Unknown Strand"
  const facet  = safe(competency?.facet)  || "Unknown Facet"

  return `${domain} → ${strand} → ${facet}`

}


/* =====================================================
   Construct Map Builder

   Groups competencies into construct definitions
===================================================== */

export function buildConstructMap(competencies=[]){

  const constructMap = {}

  safeArray(competencies).forEach(c => {

    const key = buildConstructKey(c)

    if(!constructMap[key]){

      constructMap[key] = {

        construct : key,

        competencyIds : [],

        coverageCount : 0,

        covered : false

      }

    }

    constructMap[key].competencyIds.push(c.id)

  })

  return constructMap

}


/* =====================================================
   Map Warrants → Competency Evidence

   Counts evidence occurrences per competency
===================================================== */

export function mapWarrantsToCompetencies({

  competencies = [],

  warrants = []

}){

  const competencyEvidence = {}

  safeArray(competencies).forEach(c => {

    competencyEvidence[c.id] = 0

  })


  safeArray(warrants).forEach(w => {

    const compId = w?.competencyId

    if(!compId) return

    if(competencyEvidence[compId] !== undefined){

      competencyEvidence[compId]++

    }

  })


  return competencyEvidence

}


/* =====================================================
   Aggregate Evidence → Construct Level
===================================================== */

export function mapCompetenciesToConstructs({

  constructMap = {},

  competencyEvidence = {}

}){

  const result = deepClone(constructMap)

  Object.values(result).forEach(entry => {

    entry.competencyIds.forEach(id => {

      const evidenceCount = competencyEvidence[id] || 0

      if(evidenceCount > 0){

        entry.covered = true

        entry.coverageCount += evidenceCount

      }

    })

  })

  return result

}


/* =====================================================
   Detect Missing Construct Coverage
===================================================== */

export function detectMissingConstructs(constructMap={}){

  const warnings = []

  Object.values(constructMap).forEach(entry => {

    if(!entry.covered){

      warnings.push({

        type : "missing_construct",

        construct : entry.construct,

        message : `No evidence currently supports construct "${entry.construct}".`

      })

    }

  })

  return warnings

}


/* =====================================================
   Detect Redundant Evidence

   Too many warrants targeting the same competency
===================================================== */

export function detectRedundantEvidence({

  competencies = [],

  competencyEvidence = {},

  threshold = 3

}){

  const warnings = []

  Object.entries(competencyEvidence).forEach(([id,count]) => {

    if(count > threshold){

      const comp = competencies.find(c => c.id === id)

      warnings.push({

        type : "redundant_evidence",

        competency : comp?.name || id,

        count,

        message : `Competency "${comp?.name || id}" has ${count} warrants (recommended ≤ ${threshold}).`

      })

    }

  })

  return warnings

}


/* =====================================================
   Dimensional Integrity Validation

   Validates measurement intent constraints
===================================================== */

export function checkDimensionality({

  competencies = [],

  competencyModels = []

}){

  const warnings = []


  const modelMap = {}

  safeArray(competencyModels).forEach(m => {

    modelMap[m.id] = m

  })


  const modelUsage = {}


  safeArray(competencies).forEach(c => {

    if(!c.modelId) return

    if(!modelUsage[c.modelId]){

      modelUsage[c.modelId] = []

    }

    modelUsage[c.modelId].push(c)

  })


  Object.entries(modelUsage).forEach(([modelId, comps]) => {

    const model = modelMap[modelId]

    if(!model) return


    /* --------------------------------------------------
       Unidimensional model
       Only warn if MULTIPLE competencies bound
    -------------------------------------------------- */

    if(model.measurementIntent === "unidimensional" && comps.length > 1){

      warnings.push({

        type : "unidimensional_violation",

        model : model.name,

        competencies : comps.length,

        message : `Unidimensional model "${model.name}" has ${comps.length} competencies bound.`

      })

    }


    /* --------------------------------------------------
       Multidimensional model
       Warn if only one competency present
    -------------------------------------------------- */

    if(model.measurementIntent === "multidimensional" && comps.length === 1){

      warnings.push({

        type : "weak_multidimensional_structure",

        model : model.name,

        competencies : comps.length,

        message : `Multidimensional model "${model.name}" contains only one competency.`

      })

    }

  })


  return warnings

}


/* =====================================================
   Construct Coverage Score
===================================================== */

export function computeConstructCoverageScore(constructMap={}){

  const constructs = Object.values(constructMap)

  if(!constructs.length) return 0


  const covered = constructs.filter(c => c.covered).length


  return Math.round((covered / constructs.length) * 100)

}


/* =====================================================
   Master Construct Diagnostics Runner
===================================================== */

export function runConstructDiagnostics({

  competencies = [],

  competencyModels = [],

  warrants = []

}){

  /* Build construct definitions */

  const baseConstructMap = buildConstructMap(competencies)


  /* Map warrants → competencies */

  const competencyEvidence = mapWarrantsToCompetencies({

    competencies,

    warrants

  })


  /* Aggregate competency evidence → constructs */

  const mappedConstructs = mapCompetenciesToConstructs({

    constructMap : baseConstructMap,

    competencyEvidence

  })


  /* Structural diagnostics */

  const missingConstructs = detectMissingConstructs(mappedConstructs)


  const redundantEvidence = detectRedundantEvidence({

    competencies,

    competencyEvidence

  })


  const dimensionalityWarnings = checkDimensionality({

    competencies,

    competencyModels

  })


  /* Coverage score */

  const constructCoverageScore = computeConstructCoverageScore(mappedConstructs)


  return {

    constructMap : mappedConstructs,

    competencyEvidence,

    constructCoverageScore,

    missingConstructs,

    redundantEvidence,

    dimensionalityWarnings

  }

}
