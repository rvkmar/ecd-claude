// /components/engines/warrantSuggestionEngine.js
// 🧠 Enterprise Competency‑Aware Warrant Suggestion Engine
// ---------------------------------------------------------------------
// Generates Toulmin‑structured warrants aligned with the selected
// competency, its construct hierarchy, states, and relationships.
//
// Enhancements over the previous engine:
// • Fully competency‑aware
// • Claim action detection
// • Relationship‑aware reasoning
// • Construct hierarchy integration
// • Competency state‑aware warrant variants
// • Multiple cognitive attribute coverage
// • Observable evidence generation

import { detectCognitiveAction } from "../vocabulary/cognitiveActionLexicon";
import { evidencePatterns } from "../vocabulary/evidencePatternLibrary";
import { generateObservableEvidence } from "../vocabulary/observableEvidenceGenerator";

/* =====================================================
   Utilities
===================================================== */

function safeArray(v){ return Array.isArray(v)?v:[] }
function safe(v=""){ return String(v||"").trim() }
function lower(v=""){ return String(v||"").toLowerCase() }
function unique(arr=[]){ return [...new Set(arr.filter(Boolean))] }

function constructPath(c){
  return [c?.domain,c?.strand,c?.facet].filter(Boolean).join(" → ")
}

/* =====================================================
   Relationship Extraction
===================================================== */

function extractRelationships(competency, competencies=[]){

  const map={ prerequisites:[], parents:[], correlates:[] }

  safeArray(competency?.relationships).forEach(rel=>{

    const target = competencies.find(c=>c.id===rel.targetCompetencyId)
    if(!target) return

    if(rel.type==="prerequisite") map.prerequisites.push(target)

    if(rel.type==="part-of") map.parents.push(target)

    if(rel.type==="correlates-with") map.correlates.push(target)

  })

  return map
}

/* =====================================================
   Attribute Inference
===================================================== */

function inferAttributes(competency){

  const attrs=[]

  if(competency?.domain==="Mathematics"){
    attrs.push("conceptual understanding")
    attrs.push("procedural fluency")
  }

  if(lower(competency?.strand).includes("algebra")){
    attrs.push("symbolic reasoning")
    attrs.push("representation competence")
  }

  if(competency?.variableType==="ordinal"){
    attrs.push("developmental progression")
  }

  return unique(attrs)
}

/* =====================================================
   Evidence Pattern Selection
===================================================== */

function selectEvidencePatterns(actionType){

  const patterns=[]

  if(actionType && evidencePatterns[actionType]){
    patterns.push(evidencePatterns[actionType])
  }

  if(evidencePatterns.representation) patterns.push(evidencePatterns.representation)

  if(actionType==="conceptual" && evidencePatterns.reasoning)
    patterns.push(evidencePatterns.reasoning)

  if(actionType==="strategic" && evidencePatterns.strategy)
    patterns.push(evidencePatterns.strategy)

  return unique(patterns)
}

/* =====================================================
   Performance Condition Generator
===================================================== */

function generateConditions(competency){

  const strand = competency?.strand || "the domain"

  return [

    `across routine tasks in ${strand}`,

    "across multiple symbolic representations",

    "within increasingly complex problem situations",

    "within unfamiliar contexts requiring independent reasoning"

  ]

}

/* =====================================================
   Relationship‑Aware Logic Builders
===================================================== */

function buildRule(rule,relationships){

  if(!relationships.parents.length) return rule

  const parent=relationships.parents[0]

  return `${rule}, because this competency contributes to the broader construct "${parent.name}"`
}

function buildBacking(backing,relationships){

  if(!relationships.correlates.length) return backing

  const corr=relationships.correlates[0]

  return `${backing}. Research also indicates strong correlation with "${corr.name}"`
}

function buildRebuttal(relationships){

  if(relationships.prerequisites.length>0){

    const prereq=relationships.prerequisites[0]

    return `the prerequisite competency "${prereq.name}" has not yet been mastered`

  }

  return "responses result from guessing or superficial strategies"
}

/* =====================================================
   Toulmin Warrant Template
===================================================== */

function buildWarrant({observable,attribute,condition,rule,backing,rebuttal}){

return `Observed evidence that the student ${observable} ${condition} provides support for the inference that the student possesses ${attribute}.

This inference is justified because ${rule}.

This interpretation is supported by ${backing}.

However, this inference may not hold if ${rebuttal}.`

}

/* =====================================================
   Pattern Warrant Generator
===================================================== */

function generatePatternWarrant({pattern,competency,condition,relationships}){

  const facet = lower(competency?.facet || "the construct")

  const observable = pattern.behaviors?.(facet)?.[0]
    || `successfully interprets symbolic representations related to ${facet}`

  const attribute = pattern.attributes?.[0]
    || "conceptual understanding"

  let rule = pattern.rules?.(facet)?.[0]
    || `successful performance requires understanding of ${facet}`

  let backing = pattern.backing?.[0]
    || "empirical research in mathematics learning sciences"

  rule = buildRule(rule,relationships)

  backing = buildBacking(backing,relationships)

  const rebuttal = buildRebuttal(relationships)

  const reasoning = buildWarrant({
    observable,
    attribute,
    condition,
    rule,
    backing,
    rebuttal
  })

  return {

    competencyId: competency?.id,

    observableEvidence: observable,

    cognitiveAttribute: attribute,

    performanceCondition: condition,

    warrantRule: rule,

    backingEvidence: backing,

    rebuttalCondition: rebuttal,

    reasoningStatement: reasoning

  }

}

/* =====================================================
   Observable Evidence Warrants
===================================================== */

function generateObservableEvidenceWarrants({competency,claimText,relationships}){

  const facet = competency?.facet || "the construct"

  const evidenceList = generateObservableEvidence({
    competency,
    claimText
  }).slice(0,3)

  return evidenceList.map(obs=>{

    const rule = `interpreting ${facet} requires understanding symbolic relationships`

    const backing = buildBacking(
      "empirical research on conceptual understanding in mathematics",
      relationships
    )

    const rebuttal = buildRebuttal(relationships)

    const reasoning = buildWarrant({

      observable:obs,

      attribute:"conceptual understanding",

      condition:`within tasks involving ${facet}`,

      rule:buildRule(rule,relationships),

      backing,

      rebuttal

    })

    return {

      competencyId:competency?.id,

      observableEvidence:obs,

      cognitiveAttribute:"conceptual understanding",

      performanceCondition:`within tasks involving ${facet}`,

      warrantRule:buildRule(rule,relationships),

      backingEvidence:backing,

      rebuttalCondition:rebuttal,

      reasoningStatement:reasoning

    }

  })

}

/* =====================================================
   State‑Aware Warrants (Ordinal Competencies)
===================================================== */

function generateStateWarrants({competency,states=[]}){

  if(!states.length) return []

  return states.map(state=>{

    const observable=`demonstrates performance characteristic of the "${state.label}" developmental level`

    const rule=`progression to the "${state.label}" level reflects increasing mastery of ${competency.facet}`

    const reasoning = buildWarrant({

      observable,

      attribute:"developmental progression",

      condition:"within tasks measuring increasing difficulty",

      rule,

      backing:"developmental learning progressions in mathematics education",

      rebuttal:"performance reflects temporary strategy use rather than stable competency"

    })

    return{

      competencyId:competency?.id,

      observableEvidence:observable,

      cognitiveAttribute:"developmental progression",

      performanceCondition:"within tasks measuring increasing difficulty",

      warrantRule:rule,

      backingEvidence:"developmental learning progressions in mathematics education",

      rebuttalCondition:"performance reflects temporary strategy use",

      reasoningStatement:reasoning

    }

  })

}

/* =====================================================
   Main Suggestion Engine
===================================================== */

export function generateWarrantSuggestions({

  claimText="",

  competency,

  competencies=[]

}){

  if(!competency) return []

  const action = detectCognitiveAction(claimText)

  const actionType = action?.actionType

  const relationships = extractRelationships(competency,competencies)

  const patterns = selectEvidencePatterns(actionType)

  const conditions = generateConditions(competency)

  const suggestions=[]

  patterns.forEach((pattern,i)=>{

    const condition = conditions[i % conditions.length]

    suggestions.push(

      generatePatternWarrant({

        pattern,

        competency,

        condition,

        relationships

      })

    )

  })

  suggestions.push(

    ...generateObservableEvidenceWarrants({

      competency,

      claimText,

      relationships

    })

  )

  suggestions.push(

    ...generateStateWarrants({

      competency,

      states:competency?.states||[]

    })

  )

  return suggestions

}
