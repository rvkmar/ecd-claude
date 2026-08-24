// /ecd/diagnostics/claimDiagnostics.js
// 🧠 ECD Claim Diagnostics Engine
// Shared analytics module for evaluating articulated claims

/* =========================================================
   Grammar Polisher
========================================================= */

export function polishClaimGrammar(text) {

    if (!text) return "";

    let cleaned = text;

    cleaned = cleaned.replace(/\s+/g, " ");
    cleaned = cleaned.replace(/,\s*,/g, ",");
    cleaned = cleaned.replace(/,\s*\./g, ".");
    cleaned = cleaned.replace(/sufficient to sufficient to/gi, "sufficient to");

    cleaned = cleaned.trim();

    cleaned =
        cleaned.charAt(0).toUpperCase() +
        cleaned.slice(1);

    return cleaned;
}



/* =========================================================
   Linguistic Claim Quality Score
========================================================= */

export function computeClaimQualityScore({
    claimText,
    competency,
    levelClause
}) {

    const claimRaw = (claimText || "").trim();

    if (!claimRaw) return null;

    const claim = claimRaw.toLowerCase();

    let score = 0;
    const errors = {};

    /* length */

    if (claimRaw.length >= 80) {
        score += 20;
    } else {
        errors.length =
            "Claim should be ≥ 80 characters.";
    }

    /* inferential language */

    if (claim.includes("can")) {
        score += 15;
    } else {
        errors.inference =
            "Claim must express inferential ability.";
    }

    /* scope clause */

    if (claim.includes("across")) {
        score += 10;
    }

    /* transfer clause */

    if (claim.includes("sufficient to")) {
        score += 10;
    }

    /* observational words */

    const observationalWords = ["score", "correct", "points"];

    const containsObservational =
        observationalWords.some(w => claim.includes(w));

    if (!containsObservational) {
        score += 10;
    }

    /* domain alignment */

    if (
        competency?.facet &&
        claim.includes(competency.facet.toLowerCase())
    ) {
        score += 15;
    }

    /* variable type alignment */

    if (
        levelClause &&
        claim.includes(levelClause.split(" ")[0])
    ) {
        score += 10;
    }

    score = Math.min(score, 100);

    return {
        score,
        errors
    };

}



/* =========================================================
   Semantic Alignment Check
========================================================= */

export function evaluateClaimSemanticAlignment({
    claimText,
    competencyDescription
}) {

    const claim = claimText?.toLowerCase() || "";
    const description = competencyDescription?.toLowerCase() || "";

    if (!claim || !description) return null;

    const descTokens =
        description
            .split(/\W+/)
            .filter(t => t.length > 4);

    const overlap =
        descTokens.filter(token =>
            claim.includes(token)
        );

    const alignmentRatio =
        descTokens.length > 0
            ? overlap.length / descTokens.length
            : 0;

    if (alignmentRatio < 0.2) {

        return {
            warning:
                "Claim may not align strongly with competency description.",
            alignmentRatio
        };

    }

    return {
        warning: null,
        alignmentRatio
    };

}



/* =========================================================
   Full Claim Diagnostics
========================================================= */

export function runClaimDiagnostics({
    claimText,
    competency,
    levelClause
}) {

    const grammarCleaned =
        polishClaimGrammar(claimText);

    const quality =
        computeClaimQualityScore({
            claimText: grammarCleaned,
            competency,
            levelClause
        });

    const semantic =
        evaluateClaimSemanticAlignment({
            claimText: grammarCleaned,
            competencyDescription: competency?.description
        });

    return {

        cleanedClaim: grammarCleaned,

        qualityScore: quality?.score ?? null,

        validationErrors: quality?.errors ?? {},

        semanticWarning: semantic?.warning ?? null,

        semanticAlignment:
            semantic?.alignmentRatio ?? null

    };

}