// modelSubtypeEngine.js
// 🧠 Enterprise Measurement Model Rule Engine
// --------------------------------------------------
// Central registry controlling statistical model families,
// subtype compatibility, scoring modes, parameter metadata,
// and validation logic for the Evidence Model Wizard.
//
// This file is the SINGLE SOURCE OF TRUTH for
// measurement model rules across Step6.


/* =====================================================
   Subtype Registry
   ===================================================== */

const SUBTYPE_REGISTRY = {

    /* ---------- Classical Test Theory ---------- */

    "raw_total": {
        id: "raw_total",
        label: "Raw Total Score",
        family: "ctt",
        scoring: ["binary", "polytomous"],
        parameters: ["itemDifficulty", "itemDiscrimination", "reliability"],
        description:
            "Unweighted total of the scored observables. Interpreted directly against a cut score on the raw scale."
    },

    "weighted_total": {
        id: "weighted_total",
        label: "Weighted Total Score",
        family: "ctt",
        scoring: ["binary", "polytomous"],
        parameters: ["weights", "itemDifficulty", "itemDiscrimination", "reliability"],
        description:
            "Total in which each observable contributes according to an author-assigned weight."
    },

    "percent_correct": {
        id: "percent_correct",
        label: "Percent of Maximum",
        family: "ctt",
        scoring: ["binary", "polytomous"],
        parameters: ["maxScore", "reliability"],
        description:
            "Total expressed as a percentage of the maximum attainable score, so the cut score is scale-independent."
    },

    "standardized_score": {
        id: "standardized_score",
        label: "Standardized Score (z / scaled)",
        family: "ctt",
        scoring: ["binary", "polytomous"],
        parameters: ["normMean", "normSD", "reliability"],
        description:
            "Total referenced to a norm group mean and standard deviation. Requires a norm sample; norm-referenced rather than criterion-referenced."
    },


    /* ---------- Rasch Models ---------- */

    "1pl": {
        id: "1pl",
        label: "1PL (Rasch Model)",
        family: "rasch",
        scoring: ["binary"],
        parameters: ["difficulty"],
        description:
            "Single-parameter logistic Rasch model. All items share equal discrimination."
    },

    "pcm": {
        id: "pcm",
        label: "Partial Credit Model (PCM)",
        family: "rasch",
        scoring: ["polytomous"],
        parameters: ["thresholds"],
        description:
            "Polytomous Rasch model allowing item-specific category thresholds."
    },

    "rsm": {
        id: "rsm",
        label: "Rating Scale Model (RSM)",
        family: "rasch",
        scoring: ["polytomous"],
        parameters: ["thresholds"],
        description:
            "Polytomous Rasch model where all items share identical threshold structure."
    },


    /* ---------- Dichotomous IRT ---------- */

    "2pl": {
        id: "2pl",
        label: "2PL",
        family: "irt",
        scoring: ["binary"],
        parameters: ["difficulty", "discrimination"],
        description:
            "Two-parameter logistic IRT model allowing variable item discrimination."
    },

    "3pl": {
        id: "3pl",
        label: "3PL",
        family: "irt",
        scoring: ["binary"],
        parameters: ["difficulty", "discrimination", "guessing"],
        description:
            "Three-parameter logistic IRT model including guessing parameter."
    },


    /* ---------- Polytomous IRT ---------- */

    "grm": {
        id: "grm",
        label: "Graded Response Model (GRM)",
        family: "irt",
        scoring: ["polytomous"],
        parameters: ["discrimination", "thresholds"],
        description:
            "Polytomous IRT model used for ordered response categories (e.g., Likert scales)."
    },

    "gpcm": {
        id: "gpcm",
        label: "Generalized Partial Credit Model (GPCM)",
        family: "irt",
        scoring: ["polytomous"],
        parameters: ["difficulty", "discrimination", "thresholds"],
        description:
            "Generalization of the Partial Credit Model allowing variable discrimination."
    }

};



/* =====================================================
   Model Family Registry
   ===================================================== */

const MODEL_REGISTRY = {

    ctt: {

        label: "Classical Test Theory",

        subtypes: {

            binary: ["raw_total", "weighted_total", "percent_correct", "standardized_score"],

            polytomous: ["raw_total", "weighted_total", "percent_correct", "standardized_score"]

        }

    },

    rasch: {

        label: "Rasch Measurement Model",

        subtypes: {

            binary: ["1pl"],

            polytomous: ["pcm", "rsm"]

        }

    },

    irt: {

        label: "Item Response Theory",

        subtypes: {

            binary: ["1pl", "2pl", "3pl"],

            polytomous: ["grm", "gpcm"]

        }

    },

    bayesian_network: {

        label: "Bayesian Network",

        subtypes: {

            binary: [],
            polytomous: []

        }

    },

    sum: {

        label: "Deterministic Sum Score",

        subtypes: {

            binary: [],
            polytomous: []

        }

    },

    threshold: {

        label: "Mastery Threshold Model",

        subtypes: {

            binary: [],
            polytomous: []

        }

    }

};



/* =====================================================
   Core API
   ===================================================== */

/**
 * Returns subtype IDs allowed for a given
 * model family and scoring mode.
 */
export function getAllowedSubtypes({

    modelType,
    scoringMode

}) {

    if (!modelType) return [];

    const model = MODEL_REGISTRY[modelType];

    if (!model) return [];

    return model.subtypes?.[scoringMode] || [];

}



/**
 * Returns full metadata for a subtype.
 */
export function getSubtypeMetadata(subtypeId) {

    return SUBTYPE_REGISTRY[subtypeId] || null;

}



/**
 * Returns dropdown options for UI selectors.
 */
export function getSubtypeOptions({

    modelType,
    scoringMode

}) {

    const ids =
        getAllowedSubtypes({ modelType, scoringMode });

    return ids.map(id => {

        const meta = SUBTYPE_REGISTRY[id];

        return {

            value: id,
            label: meta?.label || id.toUpperCase(),
            description: meta?.description || ""

        };

    });

}



/**
 * Validates whether a subtype is compatible
 * with the chosen model family and scoring mode.
 */
export function validateSubtype({

    modelType,
    scoringMode,
    subtype

}) {

    const allowed =
        getAllowedSubtypes({ modelType, scoringMode });

    return allowed.includes(subtype);

}



/**
 * Returns metadata for a model family.
 */
export function getModelMetadata(modelType) {

    return MODEL_REGISTRY[modelType] || null;

}



/**
 * Returns parameter requirements for a subtype.
 */
export function getSubtypeParameters(subtypeId) {

    const meta = SUBTYPE_REGISTRY[subtypeId];

    return meta?.parameters || [];

}