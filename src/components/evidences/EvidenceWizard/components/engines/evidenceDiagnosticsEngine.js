// evidenceDiagnosticsEngine.js
// 🧠 Enterprise ECD Evidence Diagnostics Engine
// ------------------------------------------------
// Evaluates evidence rule structure before statistical modelling

export function runEvidenceDiagnosticsEngine({
  observables = [],
  warrants = []
}) {

  const diagnostics = [];

  /* =========================================================
     Evidence Direction Distribution
  ========================================================= */

  const directionCount = {
    supports: 0,
    weakens: 0,
    neutral: 0
  };

  observables.forEach(o => {

    const dir = o?.evidenceRule?.direction;

    if (dir === "supports") directionCount.supports++;
    if (dir === "weakens") directionCount.weakens++;
    if (dir === "neutral") directionCount.neutral++;

  });


  const totalDirectional =
    directionCount.supports +
    directionCount.weakens;


  /* ---------- No supporting evidence ---------- */

  if (directionCount.supports === 0) {

    diagnostics.push({
      type: "critical",
      code: "NO_SUPPORT_EVIDENCE",
      message:
        "No observable evidence supports the claim. Evidence model cannot confirm the claim."
    });

  }


  /* ---------- No falsification evidence ---------- */

  if (directionCount.weakens === 0) {

    diagnostics.push({
      type: "warning",
      code: "NO_FALSIFICATION_EVIDENCE",
      message:
        "Evidence structure contains no weakening evidence. Consider including falsification signals."
    });

  }


  /* ---------- Dominance imbalance ---------- */

  if (totalDirectional > 0) {

    const supportRatio =
      directionCount.supports / totalDirectional;

    const weakenRatio =
      directionCount.weakens / totalDirectional;

    if (supportRatio > 0.9) {

      diagnostics.push({
        type: "warning",
        code: "SUPPORT_DOMINANCE",
        message:
          "Evidence structure is overwhelmingly support-dominant. Risk of confirmation bias."
      });

    }

    if (weakenRatio > 0.7) {

      diagnostics.push({
        type: "warning",
        code: "WEAKEN_DOMINANCE",
        message:
          "Evidence structure heavily favors weakening signals. Claim confirmation may be unstable."
      });

    }

  }


  /* =========================================================
     Strength Distribution Analysis
  ========================================================= */

  const strengthBuckets = {
    weak: 0,
    moderate: 0,
    strong: 0
  };

  observables.forEach(o => {

    const s = o?.evidenceRule?.strengthLevel;

    if (typeof s !== "number") return;

    if (s <= 2) strengthBuckets.weak++;
    else if (s === 3) strengthBuckets.moderate++;
    else strengthBuckets.strong++;

  });


  const totalStrengthSignals =
    strengthBuckets.weak +
    strengthBuckets.moderate +
    strengthBuckets.strong;


  if (totalStrengthSignals > 0) {

    if (strengthBuckets.strong === 0) {

      diagnostics.push({
        type: "info",
        code: "NO_STRONG_EVIDENCE",
        message:
          "No strong evidentiary signals detected. Model may lack decisive evidence."
      });

    }

    if (strengthBuckets.weak === totalStrengthSignals) {

      diagnostics.push({
        type: "warning",
        code: "ALL_WEAK_SIGNALS",
        message:
          "All evidence signals are weak. Evidence model may lack discriminative power."
      });

    }

  }


  /* =========================================================
     Warrant Coverage Diagnostics
  ========================================================= */

  warrants.forEach(w => {

    const related = observables.filter(
      o => o.warrantId === w.id
    );

    const directional = related.filter(
      o =>
        o?.evidenceRule?.direction === "supports" ||
        o?.evidenceRule?.direction === "weakens"
    );

    if (directional.length === 0) {

      diagnostics.push({
        type: "warning",
        code: "WARRANT_NO_DIRECTIONAL_EVIDENCE",
        message:
          `Warrant "${w.id}" has no directional evidence rules.`,
        warrantId: w.id
      });

    }

  });


  /* =========================================================
     Activation Condition Quality
  ========================================================= */

  observables.forEach(o => {

    const condition =
      o?.evidenceRule?.activationCondition || "";

    if (condition.length < 15) {

      diagnostics.push({
        type: "info",
        code: "WEAK_ACTIVATION_CONDITION",
        message:
          `Observable "${o.id}" has weak activation condition description.`,
        observableId: o.id
      });

    }

  });


  /* =========================================================
     Justification Quality
  ========================================================= */

  observables.forEach(o => {

    const justification =
      o?.evidenceRule?.justification || "";

    if (justification.length < 25) {

      diagnostics.push({
        type: "info",
        code: "WEAK_JUSTIFICATION",
        message:
          `Observable "${o.id}" has limited inferential justification.`,
        observableId: o.id
      });

    }

  });


  /* =========================================================
     Compute Evidence Health Score
  ========================================================= */

  let healthScore = 100;

  diagnostics.forEach(d => {

    if (d.type === "critical") healthScore -= 40;
    if (d.type === "warning") healthScore -= 15;
    if (d.type === "info") healthScore -= 5;

  });

  healthScore = Math.max(0, healthScore);


  return {

    directionCount,

    strengthBuckets,

    healthScore,

    diagnostics

  };

}