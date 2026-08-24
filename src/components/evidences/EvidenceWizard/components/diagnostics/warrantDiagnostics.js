// warrantDiagnostics.js
// 🧠 ECD Warrant Strength Engine
// Evaluates the inferential strength of a single warrant

export function runWarrantDiagnostics(warrant = {}) {

    const diagnostics = [];
    const warnings = [];
    const missingComponents = [];

    let score = 0;

    const {

        observableEvidence,
        cognitiveAttribute,
        performanceCondition,
        warrantRule,
        backingEvidence,
        reasoningStatement

    } = warrant;

    // The Toulmin rebuttal is stored as `limitationClause` -- that is the
    // name schema.js validates, WarrantCard edits and the generated
    // reasoning statement is built from. This engine only ever read
    // `rebuttalCondition` (WarrantBuilder's old name for the same field),
    // so it reported "Rebuttal condition not specified." and withheld its
    // 10 strength points for every warrant, including ones whose rebuttal
    // was filled in and visible on screen. Read both names.
    const rebuttalCondition =
        warrant.limitationClause || warrant.rebuttalCondition;



    /* =====================================================
       Observable Evidence
    ===================================================== */

    if (observableEvidence && observableEvidence.length > 5) {

        score += 20;

        diagnostics.push({
            type: "observable_evidence",
            message: "Observable evidence clearly defined."
        });

    } else {

        missingComponents.push("observableEvidence");

        warnings.push({
            type: "missing_evidence",
            message: "Observable evidence is not clearly specified."
        });

    }



    /* =====================================================
       Cognitive Attribute
    ===================================================== */

    if (cognitiveAttribute && cognitiveAttribute.length > 3) {

        score += 20;

        diagnostics.push({
            type: "attribute",
            message: "Latent cognitive attribute identified."
        });

    } else {

        missingComponents.push("cognitiveAttribute");

        warnings.push({
            type: "missing_attribute",
            message: "Cognitive attribute is missing."
        });

    }



    /* =====================================================
       Performance Condition
    ===================================================== */

    if (performanceCondition && performanceCondition.length > 5) {

        score += 15;

        diagnostics.push({
            type: "condition",
            message: "Performance condition specified."
        });

    } else {

        warnings.push({
            type: "missing_condition",
            message: "Performance condition not defined."
        });

    }



    /* =====================================================
       Warrant Rule (Inference Logic)
    ===================================================== */

    if (warrantRule && warrantRule.length > 10) {

        score += 20;

        diagnostics.push({
            type: "rule",
            message: "Inference rule connecting evidence to attribute present."
        });

    } else {

        warnings.push({
            type: "missing_rule",
            message: "Warrant reasoning rule is weak or missing."
        });

    }



    /* =====================================================
       Backing Evidence
    ===================================================== */

    if (backingEvidence && backingEvidence.length > 10) {

        score += 15;

        diagnostics.push({
            type: "backing",
            message: "Theoretical or empirical backing provided."
        });

    } else {

        warnings.push({
            type: "missing_backing",
            message: "No theoretical or empirical backing provided."
        });

    }



    /* =====================================================
       Rebuttal Condition
    ===================================================== */

    if (rebuttalCondition && rebuttalCondition.length > 8) {

        score += 10;

        diagnostics.push({
            type: "rebuttal",
            message: "Rebuttal condition specified."
        });

    } else {

        warnings.push({
            type: "missing_rebuttal",
            message: "Rebuttal condition not specified."
        });

    }



    /* =====================================================
       Reasoning Statement Quality
    ===================================================== */

    if (reasoningStatement && reasoningStatement.length > 50) {

        score += 10;

        diagnostics.push({
            type: "reasoning_statement",
            message: "Formal warrant reasoning statement present."
        });

    } else {

        warnings.push({
            type: "weak_reasoning",
            message: "Reasoning statement may be too short."
        });

    }



    /* =====================================================
       Final Score
    ===================================================== */

    const strengthScore = Math.min(score, 100);



    return {

        strengthScore,
        diagnostics,
        warnings,
        missingComponents

    };

}