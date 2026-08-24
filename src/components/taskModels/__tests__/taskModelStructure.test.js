// src/components/taskModels/__tests__/taskModelStructure.test.js
//
// Covers the Task Model layer's structural contract: what a draft may
// look like mid-authoring, what confirmation requires, and the weight
// arithmetic the wizard now depends on.
//
// These exist because of two real dead ends.
//
// 1. WEIGHTS. schema.js requires expectedObservations weights to sum to
//    1. The wizard defaulted every new observable to weight 1 and its
//    input carried min="1", so a two-observable Task Model summed to 2
//    and 0.5 could not be typed. No Task Model with more than one
//    observable could be saved, and the failure arrived as an opaque 400.
//
// 2. DRAFT SAVES. The wizard silently PUTs its draft on every Next.
//    Every presence rule ran strict, so a draft leaving Step 2 -- which
//    legitimately has no observables, structure or blueprint yet -- came
//    back 400 listing fields the author had not reached. Same defect
//    already fixed for competency and evidence models.

import { describe, it, expect } from "vitest";

import { validateEntity } from "../../../utils/schema.js";
import { validateTaskModelLifecycle } from "../../../../server/utils/lifecycleValidation.js";
import {
    activationBlockers,
    addObservationWeight,
    computeValidity,
    difficultyScaleFor,
    evidenceCompatibilityNotes,
    formatWeight,
    itemsInstantiating,
    operationalReadiness,
    removeObservationWeight,
    distributeWeightsEvenly,
    normalizeFairnessRisks,
    normalizeWeights,
    sumWeights,
    taskModelReadiness,
    weightsAreNormalized,
    zeroWeightObservations,
} from "../taskModelConstants.js";

const db = {
    evidenceModels: [
        {
            id: "em1",
            name: "EM One",
            status: "confirmed",
            locked: true,
            versionNumber: 1,
            competencyId: "c1",
            observables: [
                { id: "o1", statement: "Solves", type: "mcq" },
                { id: "o2", statement: "Justifies", type: "constructed" },
            ],
        },
        {
            id: "em2",
            name: "EM Two",
            status: "operational",
            locked: true,
            versionNumber: 2,
            competencyId: "c2",
            observables: [{ id: "o3", statement: "Explains", type: "constructed" }],
        },
        {
            id: "em3",
            name: "Archived",
            status: "archived",
            locked: true,
            versionNumber: 1,
            competencyId: "c3",
            observables: [],
        },
    ],
    taskModels: [],
};

/** A Task Model that satisfies every confirmation-time rule. */
function makeTaskModel(overrides = {}) {
    return {
        id: "tm1",
        name: "Multi-step equation",
        description: "Solve and justify.",
        status: "draft",
        locked: false,
        versionNumber: 1,
        evidenceModelIds: ["em1"],
        primaryEvidenceModelId: "em1",
        expectedObservations: [
            { observationId: "o1", evidenceModelId: "em1", required: true, weight: 0.6 },
            { observationId: "o2", evidenceModelId: "em1", required: false, weight: 0.4 },
        ],
        taskStructure: {
            presentationMode: "interactive",
            responseFormat: "selected",
            stimulusPolicy: "static",
        },
        blueprintConstraints: {
            difficultyRange: { min: 0, max: 1 },
            exposurePolicy: {},
        },
        taskCompositionType: "atomic",
        subTaskIds: [],
        actions: ["select"],
        accessibilityAssumptions: { languageLoad: "below target grade band" },
        equivalenceGroupId: "grp-1",
        ...overrides,
    };
}

describe("draft-time vs confirmation-time validation", () => {
    /** What the wizard actually holds while leaving Step 2. */
    const partial = {
        id: "tmX",
        name: "New task",
        description: "",
        status: "draft",
        locked: false,
        versionNumber: 1,
        evidenceModelIds: ["em1"],
        primaryEvidenceModelId: "em1",
        expectedObservations: [],
        taskStructure: { presentationMode: "", responseFormat: "", stimulusPolicy: "" },
        blueprintConstraints: { difficultyRange: {}, exposurePolicy: {} },
    };

    it("accepts a draft that has not reached the later steps", () => {
        const result = validateEntity("taskModels", partial, db, { strict: false });
        expect(result.errors).toEqual([]);
        expect(result.valid).toBe(true);
    });

    it("rejects that same draft at confirmation", () => {
        expect(validateEntity("taskModels", partial, db, { strict: true }).valid).toBe(false);
    });

    it("still rejects a value that is present but invalid, even while drafting", () => {
        const inverted = makeTaskModel({
            blueprintConstraints: { difficultyRange: { min: 1, max: 0 } },
        });
        expect(validateEntity("taskModels", inverted, db, { strict: false }).valid).toBe(false);
    });
});

describe("observable weight allocation", () => {
    it("accepts weights that sum to 1", () => {
        const result = validateEntity("taskModels", makeTaskModel(), db);
        expect(result.errors).toEqual([]);
    });

    it("rejects the old default of weight 1 per observable, and names the total", () => {
        const model = makeTaskModel({
            expectedObservations: [
                { observationId: "o1", evidenceModelId: "em1", required: true, weight: 1 },
                { observationId: "o2", evidenceModelId: "em1", required: false, weight: 1 },
            ],
        });

        const result = validateEntity("taskModels", model, db);
        expect(result.valid).toBe(false);
        expect(result.errors.some((e) => e.includes("2.000"))).toBe(true);
    });

    it("permits a zero weight while drafting", () => {
        const model = makeTaskModel({
            expectedObservations: [
                { observationId: "o1", evidenceModelId: "em1", required: true, weight: 1 },
                { observationId: "o2", evidenceModelId: "em1", required: false, weight: 0 },
            ],
        });
        expect(validateEntity("taskModels", model, db, { strict: false }).valid).toBe(true);
    });

    it("splits three ways to exactly 1, absorbing the rounding residual", () => {
        const thirds = distributeWeightsEvenly([{}, {}, {}]);
        expect(sumWeights(thirds)).toBe(1);
        expect(weightsAreNormalized(thirds)).toBe(true);
    });

    it("normalizes while preserving proportions", () => {
        const result = normalizeWeights([{ weight: 2 }, { weight: 2 }, { weight: 1 }]);
        expect(result.map((r) => r.weight)).toEqual([0.4, 0.4, 0.2]);
        expect(sumWeights(result)).toBe(1);
    });

    it("falls back to an even split when every weight is zero", () => {
        expect(sumWeights(normalizeWeights([{ weight: 0 }, { weight: 0 }]))).toBe(1);
    });
});

describe("evidence binding replaces the competency declaration", () => {
    it("rejects a primary that is not among the bound models", () => {
        const model = makeTaskModel({ primaryEvidenceModelId: "em2" });
        const result = validateEntity("taskModels", model, db);
        expect(result.valid).toBe(false);
        expect(result.errors.some((e) => /not among the declared/.test(e))).toBe(true);
    });

    it("requires a primary at confirmation but not while drafting", () => {
        const model = makeTaskModel({ primaryEvidenceModelId: "" });
        expect(validateEntity("taskModels", model, db).valid).toBe(false);
        expect(validateEntity("taskModels", model, db, { strict: false }).valid).toBe(true);
    });

    it("accepts an OPERATIONAL evidence model", () => {
        // Regression: the builder panel and the wizard context each
        // narrowed to `confirmed && locked`, so an activated evidence
        // model vanished from the picker and could never receive a task.
        const model = makeTaskModel({
            evidenceModelIds: ["em2"],
            primaryEvidenceModelId: "em2",
            expectedObservations: [
                { observationId: "o3", evidenceModelId: "em2", required: true, weight: 1 },
            ],
        });
        expect(validateEntity("taskModels", model, db).errors).toEqual([]);
    });

    it("rejects an archived evidence model", () => {
        const model = makeTaskModel({
            evidenceModelIds: ["em3"],
            primaryEvidenceModelId: "em3",
            expectedObservations: [
                { observationId: "o1", evidenceModelId: "em3", required: true, weight: 1 },
            ],
        });
        expect(validateEntity("taskModels", model, db).valid).toBe(false);
    });
});

describe("composition integrity", () => {
    it("refuses sub-tasks on an atomic task", () => {
        const model = makeTaskModel({ taskCompositionType: "atomic", subTaskIds: ["tm9"] });
        expect(validateEntity("taskModels", model, db).valid).toBe(false);
    });

    it("refuses a self-referencing sub-task", () => {
        const model = makeTaskModel({
            taskCompositionType: "composite",
            subTaskIds: ["tm1"],
        });
        expect(validateEntity("taskModels", model, db).valid).toBe(false);
    });
});

describe("lifecycle gates", () => {
    it("requires a primary evidence model from reviewed onward", () => {
        const errors = validateTaskModelLifecycle(
            makeTaskModel({ status: "reviewed", primaryEvidenceModelId: "" })
        );
        expect(errors.some((e) => /primary Evidence Model/.test(e))).toBe(true);
    });

    it("passes a complete reviewed model", () => {
        expect(validateTaskModelLifecycle(makeTaskModel({ status: "reviewed" }))).toEqual([]);
    });

    it("requires sub-tasks on a confirmed composite task", () => {
        const errors = validateTaskModelLifecycle(
            makeTaskModel({
                status: "confirmed",
                taskCompositionType: "composite",
                subTaskIds: [],
            })
        );
        expect(errors.some((e) => /sub-task/.test(e))).toBe(true);
    });

    it("treats an empty accessibilityAssumptions object as absent", () => {
        // `{}` is truthy, so the old bare truthiness test let a model go
        // operational with no accessibility documentation at all.
        const errors = validateTaskModelLifecycle(
            makeTaskModel({ status: "operational", accessibilityAssumptions: {} })
        );
        expect(errors.some((e) => /accessibility/.test(e))).toBe(true);
    });

    it("passes an operational model with documented accessibility", () => {
        // No `db` argument, so the item rule is skipped -- this asserts the
        // structural half only. The item rule is covered against the real
        // route in server/routes/__tests__/taskModelLifecycle.test.js.
        expect(validateTaskModelLifecycle(makeTaskModel({ status: "operational" }))).toEqual([]);
    });

    const liveEvidence = [{ id: "em1", name: "EM One", status: "operational" }];
    const confirmedItem = {
        taskModelId: "tm1",
        taskModelVersion: 1,
        status: "confirmed",
    };

    it("refuses activation when no Item instantiates this version", () => {
        const errors = validateTaskModelLifecycle(
            makeTaskModel({ status: "operational" }),
            { items: [], evidenceModels: liveEvidence }
        );
        expect(errors.some((e) => /no Item instantiates/.test(e))).toBe(true);
    });

    it("refuses activation while a bound Evidence Model is not yet live", () => {
        const errors = validateTaskModelLifecycle(
            makeTaskModel({ status: "operational" }),
            {
                items: [confirmedItem],
                evidenceModels: [{ id: "em1", name: "EM One", status: "confirmed" }],
            }
        );
        expect(errors.some((e) => /must be operational first/.test(e))).toBe(true);
    });

    it("accepts activation once the evidence is live and an Item is confirmed", () => {
        const errors = validateTaskModelLifecycle(
            makeTaskModel({ status: "operational" }),
            { items: [confirmedItem], evidenceModels: liveEvidence }
        );
        expect(errors).toEqual([]);
    });
});

describe("shared readiness derivation", () => {
    // The wizard, the review checklist, the list, the table and the
    // dashboard all read from taskModelReadiness/computeValidity. They
    // used to carry three divergent copies, so the review step could show
    // a red cross beside an enabled Confirm button.
    it("reports a complete model as ready and valid", () => {
        expect(taskModelReadiness(makeTaskModel()).isComplete).toBe(true);
        expect(computeValidity(makeTaskModel())).toBe("valid");
    });

    it("fails the weights check specifically when weights do not total 1", () => {
        const model = makeTaskModel({
            expectedObservations: [
                { observationId: "o1", evidenceModelId: "em1", required: true, weight: 1 },
                { observationId: "o2", evidenceModelId: "em1", required: false, weight: 1 },
            ],
        });

        const weightsCheck = taskModelReadiness(model).checks.find((c) => c.key === "weights");
        expect(weightsCheck.valid).toBe(false);
        expect(computeValidity(model)).toBe("incomplete");
    });

    it("reports a model with no evidence binding as invalid", () => {
        expect(
            computeValidity(
                makeTaskModel({ evidenceModelIds: [], primaryEvidenceModelId: "" })
            )
        ).toBe("invalid");
    });
});

describe("legacy fairness risks", () => {
    it("upgrades bare strings to the structured shape", () => {
        const [legacy, structured] = normalizeFairnessRisks([
            "reading load too high",
            { category: "cultural", description: "context assumed", severity: "high" },
        ]);

        expect(legacy.description).toBe("reading load too high");
        expect(legacy.severity).toBe("medium");
        expect(structured.category).toBe("cultural");
        expect(structured.severity).toBe("high");
    });
});

describe("evidence compatibility advisories", () => {
    // These mirror the confirmation-time coherence rules in schema.js.
    // They exist so the author meets an incompatibility while choosing the
    // task form in Step 4, rather than as a refusal at Step 8 -- and they
    // must stay in step with that block.
    const irtEvidence = {
        id: "emIrt",
        name: "Numerical Reasoning",
        statisticalModels: [{ id: "sm1", type: "irt", active: true }],
    };

    it("flags an incompatible response format as blocking", () => {
        const notes = evidenceCompatibilityNotes(
            {
                evidenceModelIds: ["emIrt"],
                taskStructure: { responseFormat: "constructed" },
                expectedObservations: [],
            },
            [irtEvidence]
        );

        expect(notes.some((n) => n.severity === "blocking")).toBe(true);
        expect(notes[0].model).toBe("Numerical Reasoning");
    });

    it("treats an unset response format as pending, not blocking", () => {
        const notes = evidenceCompatibilityNotes(
            {
                evidenceModelIds: ["emIrt"],
                taskStructure: { responseFormat: "" },
                expectedObservations: [],
            },
            [irtEvidence]
        );

        expect(notes.every((n) => n.severity === "pending")).toBe(true);
    });

    it("says nothing about a compatible form", () => {
        const notes = evidenceCompatibilityNotes(
            {
                evidenceModelIds: ["emIrt"],
                taskStructure: { responseFormat: "selected", stimulusPolicy: "parameterized" },
                expectedObservations: [],
            },
            [irtEvidence]
        );

        expect(notes).toEqual([]);
    });

    it("ignores evidence with no active statistical model", () => {
        expect(
            evidenceCompatibilityNotes({ evidenceModelIds: ["x"] }, [
                { id: "x", name: "X", statisticalModels: [{ type: "irt", active: false }] },
            ])
        ).toEqual([]);
    });
});

describe("targeting an observable always gives it weight", () => {
    // Reported from a live walkthrough: the first observable ticked
    // defaulted to Required / weight 1, every later one to Optional /
    // weight 0. The total stayed at 1.000, so the normalized gate passed
    // and Next enabled with two of three observables carrying no
    // evidential weight and nothing warning about it.

    it("never produces a zero-weight entry", () => {
        let obs = [];
        for (const id of ["a", "b", "c"]) {
            obs = addObservationWeight(obs, { observationId: id });
        }

        expect(zeroWeightObservations(obs)).toEqual([]);
        expect(sumWeights(obs)).toBe(1);
    });

    it("preserves the relative weighting of what is already there", () => {
        const result = addObservationWeight(
            [{ observationId: "x", weight: 0.7 }, { observationId: "y", weight: 0.3 }],
            { observationId: "z" }
        );

        expect(result[0].weight).toBeGreaterThan(result[1].weight);
        expect(result[0].weight / result[1].weight).toBeCloseTo(7 / 3, 2);
        expect(sumWeights(result)).toBe(1);
    });

    it("does not make the newest entry the smallest through rounding", () => {
        // The residual lands on the largest entry, not the last, so adding
        // a third to an even pair no longer yields 0.3334/0.3334/0.3332.
        let obs = [];
        for (const id of ["a", "b", "c"]) {
            obs = addObservationWeight(obs, { observationId: id });
        }

        obs.forEach((o) => expect(Math.abs(o.weight - 1 / 3)).toBeLessThanOrEqual(0.0001));
        expect(obs[2].weight).toBeGreaterThanOrEqual(Math.min(...obs.map((o) => o.weight)));
    });

    it("rescales the survivors back to 1 on removal", () => {
        expect(sumWeights(removeObservationWeight([{ weight: 0.3333 }, { weight: 0.3333 }]))).toBe(1);
    });

    it("fails readiness on 1 / 0 / 0 even though it totals 1", () => {
        const model = makeTaskModel({
            expectedObservations: [
                { observationId: "o1", evidenceModelId: "em1", required: true, weight: 1 },
                { observationId: "o2", evidenceModelId: "em1", required: false, weight: 0 },
            ],
        });

        expect(weightsAreNormalized(model.expectedObservations)).toBe(true);
        expect(taskModelReadiness(model).checks.find((c) => c.key === "weights").valid).toBe(false);
    });

    it("is rejected server-side at confirmation but tolerated while drafting", () => {
        const model = makeTaskModel({
            expectedObservations: [
                { observationId: "o1", evidenceModelId: "em1", required: true, weight: 1 },
                { observationId: "o2", evidenceModelId: "em1", required: false, weight: 0 },
            ],
        });

        const strict = validateEntity("taskModels", model, db);
        expect(strict.valid).toBe(false);
        expect(strict.errors.some((e) => /zero weight/.test(e))).toBe(true);

        expect(validateEntity("taskModels", model, db, { strict: false }).valid).toBe(true);
    });
});

describe("weight rendering", () => {
    it("shows the stored value rather than rounding it away", () => {
        // 3dp rendered 0.3333/0.3333/0.3334 as 0.333 three times, so a
        // reviewer read 0.999 beneath a heading claiming a total of 1.
        expect(formatWeight(0.3334)).toBe("0.3334");
        expect(formatWeight(0.5)).toBe("0.5");
    });
});

describe("difficulty scale follows the bound evidence", () => {
    // The range is expressed on the statistical model's own scale, and
    // those are not interchangeable. The wizard used to prefill 0-1
    // unconditionally, handing an IRT-backed task a CTT range on a logit
    // field -- silently wrong, and valid enough (min < max) to store.
    const irt = { id: "e1", name: "NR", statisticalModels: [{ type: "irt", active: true }] };
    const ctt = { id: "e2", name: "CT", statisticalModels: [{ type: "ctt", active: true }] };

    it("suggests logits for IRT", () => {
        const scale = difficultyScaleFor({ primaryEvidenceModelId: "e1" }, [irt, ctt]);
        expect(scale).toMatchObject({ min: -3, max: 3, label: "logits" });
    });

    it("suggests proportion correct for CTT", () => {
        const scale = difficultyScaleFor({ primaryEvidenceModelId: "e2" }, [irt, ctt]);
        expect(scale).toMatchObject({ min: 0, max: 1 });
    });

    it("declines to guess when nothing is bound or active", () => {
        expect(difficultyScaleFor({}, [irt])).toBeNull();
        expect(
            difficultyScaleFor({ primaryEvidenceModelId: "e3" }, [
                { id: "e3", statisticalModels: [{ type: "irt", active: false }] },
            ])
        ).toBeNull();
    });
});

describe("operational readiness mirrors the activation gate", () => {
    // Kept in step with server/utils/lifecycleValidation.js: a rule enforced
    // there and missing here is an activation refused with no prior warning
    // anywhere in the wizard.
    const confirmedItem = { taskModelId: "tm1", taskModelVersion: 1, status: "confirmed" };
    const liveEvidence = [{ id: "em1", name: "EM One", status: "operational" }];

    it("counts only items instantiating this exact version", () => {
        expect(itemsInstantiating(makeTaskModel(), [confirmedItem])).toHaveLength(1);
        expect(
            itemsInstantiating(makeTaskModel({ versionNumber: 2 }), [confirmedItem])
        ).toHaveLength(0);
    });

    it("flags an empty item bank", () => {
        const check = operationalReadiness(makeTaskModel(), [], liveEvidence).find(
            (c) => c.key === "items"
        );
        expect(check.valid).toBe(false);
        expect(check.detail).toMatch(/No Item references version 1/);
    });

    it("distinguishes 'none confirmed' from 'none at all'", () => {
        const check = operationalReadiness(
            makeTaskModel(),
            [{ ...confirmedItem, status: "draft" }],
            liveEvidence
        ).find((c) => c.key === "items");

        expect(check.valid).toBe(false);
        expect(check.detail).toMatch(/none is confirmed/);
    });

    it("passes once one confirmed item exists", () => {
        const check = operationalReadiness(makeTaskModel(), [confirmedItem], liveEvidence).find(
            (c) => c.key === "items"
        );
        expect(check.valid).toBe(true);
    });

    it("flags a bound Evidence Model that is not live", () => {
        const check = operationalReadiness(makeTaskModel(), [confirmedItem], [
            { id: "em1", name: "EM One", status: "confirmed" },
        ]).find((c) => c.key === "evidenceLive");

        expect(check.valid).toBe(false);
        expect(check.detail).toMatch(/EM One \(confirmed\)/);
    });

    it("lists the evidence gate before the item gate, matching activation order", () => {
        const keys = operationalReadiness(makeTaskModel(), [], []).map((c) => c.key);
        expect(keys.indexOf("evidenceLive")).toBeLessThan(keys.indexOf("items"));
    });
});

describe("the Activate button's disabled state matches the server's refusal", () => {
    // The button is disabled from activationBlockers(); the server refuses
    // from validateTaskModelLifecycle(). If those two ever disagree the UI
    // either blocks something legal or offers something certain to fail —
    // and the explanation shown to the user would be describing a different
    // rule from the one being enforced.

    const evidence = (status) => ({ id: "em1", name: "EM One", status });
    const item = (overrides = {}) => ({
        taskModelId: "tm1",
        taskModelVersion: 1,
        status: "confirmed",
        ...overrides,
    });
    const activating = (overrides = {}) =>
        makeTaskModel({ status: "operational", ...overrides });

    it("agrees with the server on every combination of the four preconditions", () => {
        const cases = [];
        for (const emStatus of ["operational", "confirmed", "suspended"]) {
            for (const itemState of ["confirmed", "draft", "none", "wrong-version"]) {
                for (const access of [true, false]) {
                    for (const equiv of [true, false]) {
                        cases.push({ emStatus, itemState, access, equiv });
                    }
                }
            }
        }

        const disagreements = cases.filter((c) => {
            const items =
                c.itemState === "none"
                    ? []
                    : c.itemState === "wrong-version"
                        ? [item({ taskModelVersion: 2 })]
                        : [item({ status: c.itemState })];

            const model = activating({
                accessibilityAssumptions: c.access ? { languageLoad: "low" } : {},
                equivalenceGroupId: c.equiv ? "grp-1" : "",
            });

            const evidenceModels = [evidence(c.emStatus)];

            const clientBlocked =
                activationBlockers(model, items, evidenceModels).length > 0;
            const serverBlocked =
                validateTaskModelLifecycle(model, { items, evidenceModels }).length > 0;

            return clientBlocked !== serverBlocked;
        });

        expect(disagreements).toEqual([]);
        expect(cases).toHaveLength(48);
    });

    it("reports every unmet condition, each with a label and an explanation", () => {
        const blockers = activationBlockers(
            activating({ accessibilityAssumptions: {}, equivalenceGroupId: "" }),
            [],
            [evidence("confirmed")]
        );

        expect(blockers).toHaveLength(4);
        // A disabled button whose tooltip says only "not ready" is no better
        // than no tooltip.
        blockers.forEach((b) => {
            expect(b.label).toBeTruthy();
            expect(b.detail).toBeTruthy();
        });
        expect(blockers[0].key).toBe("evidenceLive");
    });

    it("names only what is actually missing", () => {
        const blockers = activationBlockers(
            activating({ equivalenceGroupId: "" }),
            [item()],
            [evidence("operational")]
        );

        expect(blockers.map((b) => b.key)).toEqual(["equivalence"]);
    });

    it("is empty for a model that is ready, so the button enables", () => {
        expect(
            activationBlockers(activating(), [item()], [evidence("operational")])
        ).toEqual([]);
    });
});
