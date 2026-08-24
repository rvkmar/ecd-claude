// evidenceModelHealth.js
// 🧠 Enterprise Evidence Model Health Engine
// ---------------------------------------------------------------------
// Integrates diagnostics engines to produce a single Evidence Model
// health score and readiness evaluation for ECD authoring.

import { runEvidenceDiagnostics } from "../diagnostics/evidenceDiagnostics";
import { runConstructDiagnostics } from "../diagnostics/constructDiagnostics";
import { runEvidenceSufficiency } from "../diagnostics/evidenceSufficiency";


/* =====================================================
   Utility
===================================================== */

function clampScore(score) {
  if (score < 0) return 0;
  if (score > 100) return 100;
  return Math.round(score);
}


/* =====================================================
   Structural Integrity Score
===================================================== */

function computeStructuralIntegrity({
  constructWarnings = [],
  graphDiagnostics = [],
  redundantEvidence = []
}) {

  let penalty = 0;

  penalty += constructWarnings.length * 10;
  penalty += graphDiagnostics.length * 15;
  penalty += redundantEvidence.length * 5;

  const score = 100 - penalty;

  return clampScore(score);
}


/* =====================================================
   Attribute Balance Score
===================================================== */

function computeAttributeBalance(warrants = []) {

  const counts = {};

  warrants.forEach(w => {

    const attr = w?.cognitiveAttribute;

    if (!attr) return;

    if (!counts[attr]) counts[attr] = 0;

    counts[attr]++;

  });

  const values = Object.values(counts);

  if (!values.length) return 0;

  const max = Math.max(...values);
  const min = Math.min(...values);

  if (max === 0) return 0;

  const balanceRatio = min / max;

  return clampScore(balanceRatio * 100);

}


/* =====================================================
   Master Health Engine
===================================================== */

export function runEvidenceModelHealth({

  claimText = "",
  claimScore = 0,
  competencies = [],
  competencyModels = [],
  warrants = []

}) {

  /* ---------------- Evidence Diagnostics ---------------- */

  const evidence = runEvidenceDiagnostics({

    claimText,
    claimScore,
    competencies,
    warrants

  });

  /* ---------------- Construct Diagnostics ---------------- */

  const construct = runConstructDiagnostics({

    competencies,
    competencyModels,
    warrants

  });

  /* ---------------- Evidence Sufficiency ---------------- */

  const sufficiency = runEvidenceSufficiency({

    competencies,
    warrants

  });

  /* ---------------- Attribute Balance ---------------- */

  const attributeBalance = computeAttributeBalance(warrants);

  /* ---------------- Structural Integrity ---------------- */

  const structuralIntegrity = computeStructuralIntegrity({

    constructWarnings: construct.missingConstructs,
    graphDiagnostics: evidence.graphDiagnostics,
    redundantEvidence: construct.redundantEvidence

  });


  /* =====================================================
     Weighted Health Score
  ===================================================== */

  const healthScore = clampScore(

      claimScore * 0.15
    + evidence.coverageScore * 0.20
    + construct.constructCoverageScore * 0.20
    + sufficiency.sufficiencyScore * 0.25
    + structuralIntegrity * 0.20

  );


  /* =====================================================
     Readiness Level
  ===================================================== */

  let readiness = "weak";

  if (healthScore >= 85) readiness = "operational";
  else if (healthScore >= 70) readiness = "stable";
  else if (healthScore >= 50) readiness = "developing";


  /* =====================================================
     Return
  ===================================================== */

  return {

    healthScore,

    readiness,

    metrics: {

      claimQuality: claimScore,
      attributeCoverage: evidence.coverageScore,
      constructCoverage: construct.constructCoverageScore,
      evidenceSufficiency: sufficiency.sufficiencyScore,
      structuralIntegrity,
      attributeBalance

    },

    diagnostics: {

      evidenceDiagnostics: evidence,
      constructDiagnostics: construct,
      sufficiencyDiagnostics: sufficiency

    }

  };

}