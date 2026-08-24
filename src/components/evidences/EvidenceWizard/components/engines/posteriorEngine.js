// posteriorEngine.js
// 🧠 Enterprise ECD — Posterior Inference Engine
// ------------------------------------------------
// Computes P(θ | Observed Evidence)

export function computePosterior({

    observations = {},   // { obsId: 1 | 0 }
    cpt = {},           // { obsId: { pHigh, pLow } }
    prior = { high: 0.5, low: 0.5 }

}) {

    let likelihoodHigh = 1;
    let likelihoodLow = 1;

    Object.entries(observations).forEach(([obsId, value]) => {

        const params = cpt[obsId];

        if (!params) return;

        const { pHigh, pLow } = params;

        if (value === 1) {

            likelihoodHigh *= pHigh;
            likelihoodLow *= pLow;

        } else {

            likelihoodHigh *= (1 - pHigh);
            likelihoodLow *= (1 - pLow);

        }

    });

    const unnormHigh = likelihoodHigh * prior.high;
    const unnormLow = likelihoodLow * prior.low;

    const total = unnormHigh + unnormLow;

    return {
        high: unnormHigh / total,
        low: unnormLow / total
    };

}