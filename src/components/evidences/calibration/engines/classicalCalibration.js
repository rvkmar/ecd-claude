// classicalCalibration.js
// 🧠 Enterprise ECD — CSV Response Matrix → Provisional Item Parameters
// ---------------------------------------------------------------------
// WHAT THIS IS
// A response matrix (rows = examinees, columns = observables, cells =
// 1/0) is turned into classical item statistics and a *provisional*
// logistic parameterisation:
//
//   p        proportion correct
//   r_pb     corrected item-total (point-biserial) correlation
//   b        logit difficulty, ln((1 - p') / p'), mean-centred
//   a        1.7 · r / sqrt(1 - r²)   (normal-ogive → logistic)
//
// WHAT THIS IS NOT
// This is NOT marginal maximum likelihood. There is no EM loop, no
// standard errors, no fit statistics, no linking. It is the classical
// approximation every psychometrics textbook opens with, and it exists
// so a team can exercise the whole calibration → activation → inference
// path from a spreadsheet before a real estimation bureau is wired in.
// Every parameter set produced here is stamped
// calibrationMethod: "classical-approximation (…)" so it is never
// mistaken for a defensible operational calibration.
// ---------------------------------------------------------------------

const MISSING_TOKENS = new Set(["", "na", "n/a", "null", "nan", ".", "-", "*"]);

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const round = (v, dp = 4) => Number(Number(v).toFixed(dp));

/* =====================================================
   CSV / TSV PARSING
===================================================== */

export function parseResponseMatrix(text, { fileName = "" } = {}) {

    const errors = [];
    const warnings = [];

    const raw = String(text || "").replace(/\r\n?/g, "\n").trim();

    if (!raw) {
        return { ok: false, errors: ["The response file is empty."], warnings, matrix: null };
    }

    const delimiter = fileName.toLowerCase().endsWith(".tsv")
        ? "\t"
        : (raw.split("\n")[0].includes("\t") && !raw.split("\n")[0].includes(","))
            ? "\t"
            : ",";

    const lines = raw.split("\n").filter(l => l.trim().length > 0);

    if (lines.length < 2) {
        return {
            ok: false,
            errors: ["The response file needs a header row plus at least one response row."],
            warnings,
            matrix: null,
        };
    }

    const header = splitRow(lines[0], delimiter);

    // First column is treated as an examinee identifier when it is
    // obviously one; otherwise every column is an observable.
    const firstIsId = /^(student|examinee|person|candidate|respondent)?_?id$/i.test(
        header[0].trim()
    );

    const idColumn = firstIsId ? header[0].trim() : null;
    const observableIds = (firstIsId ? header.slice(1) : header).map(h => h.trim());

    if (!observableIds.length) {
        return { ok: false, errors: ["No observable columns found in the header row."], warnings, matrix: null };
    }

    const duplicates = observableIds.filter((id, i) => observableIds.indexOf(id) !== i);

    if (duplicates.length) {
        errors.push(`Duplicate observable column(s): ${[...new Set(duplicates)].join(", ")}.`);
    }

    const rows = [];
    let nonBinary = 0;

    lines.slice(1).forEach((line, i) => {

        const cells = splitRow(line, delimiter);
        const values = firstIsId ? cells.slice(1) : cells;

        if (values.length !== observableIds.length) {
            errors.push(
                `Row ${i + 2} has ${values.length} response cell(s) but the header declares ${observableIds.length}.`
            );
            return;
        }

        const responses = {};

        observableIds.forEach((obsId, c) => {

            const cell = String(values[c] ?? "").trim();

            if (MISSING_TOKENS.has(cell.toLowerCase())) {
                responses[obsId] = null;   // omitted / not reached
                return;
            }

            const num = Number(cell);

            if (!Number.isFinite(num)) {
                responses[obsId] = null;
                nonBinary++;
                return;
            }

            if (num !== 0 && num !== 1) {
                nonBinary++;
                responses[obsId] = num > 0 ? 1 : 0;
                return;
            }

            responses[obsId] = num;
        });

        rows.push({
            id: firstIsId ? String(cells[0]).trim() : `row_${i + 1}`,
            responses,
        });
    });

    if (errors.length) {
        return { ok: false, errors, warnings, matrix: null };
    }

    if (nonBinary > 0) {
        warnings.push(
            `${nonBinary} cell(s) were not a clean 0/1 and were coerced (non-numeric → missing, positive → 1). Only dichotomous scoring is supported.`
        );
    }

    if (rows.length < 30) {
        warnings.push(
            `Only ${rows.length} response rows — item statistics from a sample this small are indicative at best.`
        );
    }

    return {
        ok: true,
        errors,
        warnings,
        matrix: { idColumn, observableIds, rows },
    };
}

function splitRow(line, delimiter) {

    // Deliberately simple: response matrices are numeric, so the quoted
    // field / embedded delimiter cases that need a real CSV parser do
    // not arise. Quotes are stripped defensively anyway.
    return line
        .split(delimiter)
        .map(cell => cell.trim().replace(/^"(.*)"$/, "$1"));
}

/* =====================================================
   CLASSICAL ITEM STATISTICS
===================================================== */

export function calibrateFromResponseMatrix({
    matrix,
    subtype = "2pl",
    centreDifficulty = true,
}) {

    const warnings = [];
    const { observableIds, rows } = matrix;

    const isRasch = ["rasch", "1pl"].includes(String(subtype).toLowerCase());
    const is3pl = String(subtype).toLowerCase() === "3pl";

    /* ---------- person totals ---------- */

    const totals = rows.map(r =>
        observableIds.reduce(
            (sum, id) => sum + (r.responses[id] === 1 ? 1 : 0),
            0
        )
    );

    /* ---------- per-observable statistics ---------- */

    const stats = {};

    observableIds.forEach(obsId => {

        const pairs = [];
        let n = 0;
        let correct = 0;

        rows.forEach((r, i) => {

            const v = r.responses[obsId];

            if (v === null || v === undefined) return;

            n++;
            if (v === 1) correct++;

            // Corrected item-total: the item is removed from the score it
            // is being correlated against, otherwise every item correlates
            // with itself and short tests look far more coherent than they are.
            pairs.push([v, totals[i] - (v === 1 ? 1 : 0)]);
        });

        if (n === 0) {
            warnings.push(`${obsId}: no usable responses — parameters fall back to a = 1, b = 0.`);
            stats[obsId] = { n: 0, correct: 0, p: 0.5, r: 0, degenerate: true };
            return;
        }

        const p = correct / n;

        if (p === 0 || p === 1) {
            warnings.push(
                `${obsId}: every response was ${p === 1 ? "correct" : "incorrect"} — difficulty is not identified and has been Winsorised.`
            );
        }

        stats[obsId] = {
            n,
            correct,
            p,
            r: pearson(pairs),
            degenerate: false,
        };
    });

    /* ---------- logistic parameterisation ---------- */

    const parameters = {};
    const rawB = {};

    observableIds.forEach(obsId => {

        const s = stats[obsId];

        // Winsorised proportion keeps b finite for perfect / zero items.
        const pAdj = clamp((s.correct + 0.5) / (s.n + 1), 0.01, 0.99);

        rawB[obsId] = Math.log((1 - pAdj) / pAdj);
    });

    const meanB =
        observableIds.reduce((sum, id) => sum + rawB[id], 0) /
        (observableIds.length || 1);

    observableIds.forEach(obsId => {

        const s = stats[obsId];

        const b = centreDifficulty ? rawB[obsId] - meanB : rawB[obsId];

        let a = 1;

        if (!isRasch) {
            const r = clamp(s.r, 0.05, 0.95);
            a = clamp((1.7 * r) / Math.sqrt(1 - r * r), 0.3, 2.5);
        }

        if (!isRasch && s.r < 0.2) {
            warnings.push(
                `${obsId}: point-biserial ${s.r.toFixed(2)} is below 0.20 — review the observable or its evidence rule before operational use.`
            );
        }

        parameters[obsId] = {
            a: round(a),
            b: round(b),
            c: is3pl ? 0.2 : 0,
            pValue: round(s.p, 3),
            pointBiserial: round(s.r, 3),
            n: s.n,
        };
    });

    if (is3pl) {
        warnings.push(
            "Guessing (c) cannot be estimated classically; every item was assigned c = 0.20. Replace with a real 3PL calibration before operational use."
        );
    }

    /* ---------- test-level statistics ---------- */

    const fit = {
        method: "classical-approximation",
        nPersons: rows.length,
        nObservables: observableIds.length,
        meanScore: round(mean(totals), 3),
        sdScore: round(Math.sqrt(variance(totals)), 3),
        kr20: round(kr20(stats, observableIds, totals), 3),
        difficultyCentred: centreDifficulty,
    };

    if (Number.isFinite(fit.kr20) && fit.kr20 < 0.6) {
        warnings.push(
            `KR-20 internal consistency is ${fit.kr20} — below the 0.60 usually treated as a floor for reporting individual results.`
        );
    }

    return {
        parameters,
        fit,
        warnings,
        stats,
    };
}

/* =====================================================
   → CALIBRATION PACKAGE
   Wrapped into the same shape parseCalibrationJson emits so
   the import panel has exactly one downstream code path.
===================================================== */

export function responseMatrixToPackage({
    matrix,
    subtype = "2pl",
    calibratedBy,
    notes = "",
    fileName = null,
}) {

    const { parameters, fit, warnings, stats } = calibrateFromResponseMatrix({
        matrix,
        subtype,
    });

    const label = ["rasch", "1pl"].includes(String(subtype).toLowerCase())
        ? "logit difficulty"
        : "logit difficulty + point-biserial discrimination";

    return {
        pkg: {
            kind: "irt-parameters",
            fileVersion: "1.0",
            target: { statisticalModel: { type: "irt", subtype } },
            provenance: {
                calibratedBy: calibratedBy || "unknown",
                calibrationMethod: `classical-approximation (${label})`,
                calibrationDate: new Date().toISOString().slice(0, 10),
                sampleSize: matrix.rows.length,
                software: "ECD platform — classicalCalibration.js",
                notes:
                    notes ||
                    "Provisional parameters derived from a raw response matrix. Not a marginal maximum likelihood calibration.",
            },
            scale: {
                metric: "theta",
                mean: 0,
                sd: 1,
                linking: "none — difficulties centred on this sample",
            },
            fit,
            decisionRule: null,
            parameters,
            prior: null,
        },
        warnings,
        stats,
        fileName,
    };
}

/* =====================================================
   MATH HELPERS
===================================================== */

function mean(values) {
    if (!values.length) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
}

function variance(values) {
    if (values.length < 2) return 0;
    const m = mean(values);
    return values.reduce((sum, v) => sum + (v - m) ** 2, 0) / values.length;
}

function pearson(pairs) {

    if (pairs.length < 3) return 0;

    const xs = pairs.map(p => p[0]);
    const ys = pairs.map(p => p[1]);

    const mx = mean(xs);
    const my = mean(ys);

    let num = 0;
    let dx = 0;
    let dy = 0;

    for (let i = 0; i < pairs.length; i++) {
        const a = xs[i] - mx;
        const b = ys[i] - my;
        num += a * b;
        dx += a * a;
        dy += b * b;
    }

    const den = Math.sqrt(dx * dy);

    return den === 0 ? 0 : num / den;
}

function kr20(stats, observableIds, totals) {

    const k = observableIds.length;

    if (k < 2) return NaN;

    const varTotal = variance(totals);

    if (varTotal === 0) return NaN;

    const sumPQ = observableIds.reduce((sum, id) => {
        const p = stats[id].p;
        return sum + p * (1 - p);
    }, 0);

    return (k / (k - 1)) * (1 - sumPQ / varTotal);
}
