// irtEngine.js
// 🧠 Enterprise IRT Engine (Research Grade)
// -----------------------------------------
// ✔ 1PL / 2PL / 3PL
// ✔ Stable likelihood (log-space)
// ✔ Fisher Information (3PL aware)
// ✔ θ estimation (MLE)
// ✔ Likelihood + Information curves
// ✔ Adaptive testing utilities

/* =====================================================
   Core Probability Model (1PL / 2PL / 3PL)
===================================================== */

export const logistic = (z) =>
    1 / (1 + Math.exp(-z));

export const probability = (theta, item) => {

    const a = item.a ?? 1;
    const b = item.b ?? 0;
    const c = item.c ?? 0; // guessing (3PL)

    const expo = a * (theta - b);
    const L = logistic(expo);

    // 3PL
    return c + (1 - c) * L;
};


/* =====================================================
   Log Likelihood (Stable)
===================================================== */

export const logLikelihood = (theta, responses, items) => {

    let ll = 0;

    items.forEach(item => {

        const u = responses[item.id];
        if (u === undefined) return;

        const p = probability(theta, item);

        // clamp for stability
        const safeP = Math.max(Math.min(p, 1 - 1e-9), 1e-9);

        ll += u === 1
            ? Math.log(safeP)
            : Math.log(1 - safeP);

    });

    return ll;
};


/* =====================================================
   Fisher Information (3PL CORRECT)
===================================================== */

export const itemInformation = (theta, item) => {

    const a = item.a ?? 1;
    const b = item.b ?? 0;
    const c = item.c ?? 0;

    const p = probability(theta, item);

    const q = 1 - p;

    // 3PL information formula
    const L = (p - c) / (1 - c);

    return (a * a) * (q / p) * (L * L);
};


export const testInformation = (theta, items) => {

    return items.reduce(
        (sum, item) => sum + itemInformation(theta, item),
        0
    );

};


/* =====================================================
   Standard Error
===================================================== */

export const standardError = (theta, items) => {

    const info = testInformation(theta, items);

    return info > 0
        ? 1 / Math.sqrt(info)
        : Infinity;

};


/* =====================================================
   θ Estimation (MLE — Grid Search)
===================================================== */

export const estimateThetaMLE = (responses, items) => {

    let bestTheta = 0;
    let bestLL = -Infinity;

    for (let theta = -3; theta <= 3; theta += 0.05) {

        const ll = logLikelihood(theta, responses, items);

        if (ll > bestLL) {
            bestLL = ll;
            bestTheta = theta;
        }

    }

    return bestTheta;

};


/* =====================================================
   Likelihood Curve (Normalized)
===================================================== */

export const likelihoodCurve = (responses, items) => {

    const raw = [];

    let maxLL = -Infinity;

    for (let theta = -3; theta <= 3; theta += 0.1) {

        const ll = logLikelihood(theta, responses, items);

        raw.push({ theta, ll });

        if (ll > maxLL) maxLL = ll;

    }

    // normalize using log-sum-exp trick
    return raw.map(p => ({
        theta: p.theta,
        value: Math.exp(p.ll - maxLL)
    }));

};


/* =====================================================
   Information Curve
===================================================== */

export const informationCurve = (items) => {

    const curve = [];

    for (let theta = -3; theta <= 3; theta += 0.1) {

        curve.push({
            theta,
            info: testInformation(theta, items)
        });

    }

    return curve;

};


/* =====================================================
   Adaptive Item Selection
===================================================== */

export const selectNextItem = (theta, items, usedIds = []) => {

    let bestItem = null;
    let bestInfo = -Infinity;

    items.forEach(item => {

        if (usedIds.includes(item.id)) return;

        const info = itemInformation(theta, item);

        if (info > bestInfo) {
            bestInfo = info;
            bestItem = item;
        }

    });

    return bestItem;

};


/* =====================================================
   Utility: Clamp θ
===================================================== */

export const clampTheta = (theta, min = -3, max = 3) => {
    return Math.max(min, Math.min(max, theta));
};


/* =====================================================
   PRIOR (Normal distribution)
===================================================== */

export const normalPDF = (theta, mean = 0, sd = 1) => {

    const coeff = 1 / (sd * Math.sqrt(2 * Math.PI));
    const exponent = -0.5 * Math.pow((theta - mean) / sd, 2);

    return coeff * Math.exp(exponent);

};

export const logNormalPDF = (theta, mean = 0, sd = 1) => {

    return -Math.log(sd * Math.sqrt(2 * Math.PI))
        - 0.5 * Math.pow((theta - mean) / sd, 2);

};

/* =====================================================
   MAP Estimation
===================================================== */

export const estimateThetaMAP = (
    responses,
    items,
    prior = { mean: 0, sd: 1 }
) => {

    let bestTheta = 0;
    let bestScore = -Infinity;

    for (let theta = -3; theta <= 3; theta += 0.05) {

        const ll = logLikelihood(theta, responses, items);
        const lp = logNormalPDF(theta, prior.mean, prior.sd);

        const score = ll + lp;

        if (score > bestScore) {
            bestScore = score;
            bestTheta = theta;
        }

    }

    return bestTheta;

};

/* =====================================================
   EAP Estimation (Numerical Integration)
===================================================== */

export const estimateThetaEAP = (
    responses,
    items,
    prior = { mean: 0, sd: 1 }
) => {

    let numerator = 0;
    let denominator = 0;

    for (let theta = -3; theta <= 3; theta += 0.05) {

        const ll = logLikelihood(theta, responses, items);
        const priorVal = normalPDF(theta, prior.mean, prior.sd);

        const weight = Math.exp(ll) * priorVal;

        numerator += theta * weight;
        denominator += weight;

    }

    return denominator > 0
        ? numerator / denominator
        : 0;

};

/* =====================================================
   Posterior Curve
===================================================== */

export const posteriorCurve = (
    responses,
    items,
    prior = { mean: 0, sd: 1 }
) => {

    const raw = [];

    let maxLog = -Infinity;

    for (let theta = -3; theta <= 3; theta += 0.1) {

        const ll = logLikelihood(theta, responses, items);
        const lp = logNormalPDF(theta, prior.mean, prior.sd);

        const logPost = ll + lp;

        raw.push({ theta, logPost });

        if (logPost > maxLog) maxLog = logPost;

    }

    return raw.map(p => ({
        theta: p.theta,
        value: Math.exp(p.logPost - maxLog)
    }));

};

// θ → Percentile using Normal CDF
export const thetaToPercentile = (theta, mean = 0, sd = 1) => {

    const z = (theta - mean) / sd;

    // Approximation of normal CDF (Abramowitz & Stegun)
    const t = 1 / (1 + 0.2316419 * Math.abs(z));
    const d = 0.3989423 * Math.exp(-z * z / 2);

    let prob = d * t * (
        0.3193815 +
        t * (-0.3565638 +
        t * (1.781478 +
        t * (-1.821256 +
        t * 1.330274)))
    );

    if (z > 0) prob = 1 - prob;

    return prob * 100; // percentile
};

/* =====================================================
   Empirical Percentile (DATA-DRIVEN)
===================================================== */

export const thetaToPercentileEmpirical = (theta, distribution = []) => {

    if (!distribution.length) return null;

    // sort ascending
    const sorted = [...distribution].sort((a, b) => a - b);

    let count = 0;

    sorted.forEach(val => {
        if (val <= theta) count++;
    });

    return (count / sorted.length) * 100;
};