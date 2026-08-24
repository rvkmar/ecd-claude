// posteriorEngineMulti.js
// 🧠 Enterprise ECD — Multi-State Posterior Engine (Advanced)
// ------------------------------------------------------------
// ✔ Log-space computation (numerical stability)
// ✔ Evidence contribution tracing (Step 7)
// ✔ Robust handling of missing CPT / priors
// ✔ Explainable output for audit + UI

export function computePosteriorMulti({

    observations = {},     // { obsId: 1 | 0 }
    cpt = {},              // { obsId: { levels: { L1: p, ... } } }
    prior = {},            // { L1: 0.3, L2: 0.4, L3: 0.3 }
    options = {}

}) {

    const {
        defaultProbability = 0.5,
        explain = true
    } = options;

    const states = Object.keys(prior);

    if (states.length === 0) {
        throw new Error("PosteriorEngine: prior is empty");
    }

    /* =====================================================
       Normalize Prior (Safety)
    ===================================================== */

    const priorTotal = states.reduce(
        (sum, s) => sum + (prior[s] || 0),
        0
    );

    const normalizedPrior = {};

    states.forEach(s => {
        normalizedPrior[s] =
            priorTotal > 0
                ? (prior[s] || 0) / priorTotal
                : 1 / states.length;
    });


    /* =====================================================
       Log Likelihood Initialization
    ===================================================== */

    const logLikelihood = {};
    const trace = {};   // audit trail

    states.forEach(s => {
        logLikelihood[s] = 0; // log(1)
        trace[s] = [];
    });


    /* =====================================================
       Process Observations
    ===================================================== */

    Object.entries(observations).forEach(([obsId, value]) => {

        const params = cpt[obsId]?.levels;

        states.forEach(state => {

            const rawP = params?.[state];

            // fallback probability
            const p =
                typeof rawP === "number"
                    ? rawP
                    : defaultProbability;

            const prob =
                value === 1
                    ? p
                    : (1 - p);

            // prevent log(0)
            const safeProb = Math.max(prob, 1e-9);

            const logVal = Math.log(safeProb);

            logLikelihood[state] += logVal;

            if (explain) {
                trace[state].push({
                    observableId: obsId,
                    value,
                    probability: prob,
                    logContribution: logVal
                });
            }

        });

    });


    /* =====================================================
       Combine with Prior (Log Space)
    ===================================================== */

    const logPosterior = {};

    states.forEach(state => {

        const logPrior = Math.log(
            Math.max(normalizedPrior[state], 1e-9)
        );

        logPosterior[state] =
            logLikelihood[state] + logPrior;

    });


    /* =====================================================
       Convert Back (Softmax Normalization)
    ===================================================== */

    const maxLog = Math.max(...Object.values(logPosterior));

    const expValues = {};
    let total = 0;

    states.forEach(state => {

        const val = Math.exp(logPosterior[state] - maxLog);

        expValues[state] = val;
        total += val;

    });

    const posterior = {};

    states.forEach(state => {

        posterior[state] =
            total > 0 ? expValues[state] / total : 0;

    });


    /* =====================================================
       Output
    ===================================================== */

    return {

        posterior,          // { L1: 0.2, L2: 0.5, ... }
        prior: normalizedPrior,
        logLikelihood,
        logPosterior,

        trace: explain ? trace : undefined,

        meta: {
            observedCount: Object.keys(observations).length,
            stateCount: states.length
        }

    };

}