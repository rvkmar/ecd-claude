// EvidenceWizardContext.jsx
// 🔒 Extreme Strict ECD — Evidence Wizard Context
// ✔ Proper model → competency hierarchy
// ✔ Version binding from competencyModels
// ✔ No fake metadata on competency objects
// ✔ Governance-safe

import React, {
    createContext,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";

const EvidenceWizardContext = createContext(null);

/* ==========================================================
   Helper: Create Empty Draft
========================================================== */
function createEmptyDraft() {
    return {
        id: null,
        name: "",
        description: "",
        competencyId: "",
        claimStatement: "",
        warrants: [],
        observables: [],
        evidenceRules: [],
        statisticalModels: [],
        decisionRule: null,
        status: "draft",
        locked: false,
        competencyModelVersion: null,
        versionNumber: 1,
        parentModelId: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };
}

/* ==========================================================
   Provider
========================================================== */
export function EvidenceWizardProvider({
    children,
    initialModel = null,
    competencies = [],
    competencyModels = [],   // 🔥 REQUIRED
}) {

    const [draftModel, setDraftModel] = useState(
        initialModel || createEmptyDraft()
    );

    /* --------------------------------------------------------
       Sync when editing model

       Lazy backfill: older/bulk-uploaded drafts can carry warrants with
       no competencyId at all (the bulk importer didn't default it before
       this fix -- see server/routes/evidenceModels.js). Step 3 requires
       every warrant to target a competency and disables Next with no way
       to fix it from a collapsed card, so a draft missing this field was
       permanently stuck. Default any unbound warrant to the model's own
       competencyId on load, same as a freshly created warrant would get.
    -------------------------------------------------------- */
    useEffect(() => {
        if (initialModel) {
            const warrants = (initialModel.warrants || []).map(w =>
                w.competencyId ? w : { ...w, competencyId: initialModel.competencyId }
            );
            setDraftModel({ ...initialModel, warrants });
        } else {
            setDraftModel(createEmptyDraft());
        }
    }, [initialModel]);

    /* ==========================================================
       LOOKUP MAPS
    ========================================================== */

    const competencyMap = useMemo(() => {
        const map = {};
        competencies.forEach(c => {
            map[c.id] = c;
        });
        return map;
    }, [competencies]);

    const competencyModelMap = useMemo(() => {
        const map = {};
        competencyModels.forEach(m => {
            map[m.id] = m;
        });
        return map;
    }, [competencyModels]);

    /* ==========================================================
       STRUCTURAL DERIVATIONS
    ========================================================== */

    const selectedCompetency = useMemo(() => {
        if (!draftModel?.competencyId) return null;
        return competencyMap[draftModel.competencyId] || null;
    }, [draftModel.competencyId, competencyMap]);

    const selectedCompetencyModel = useMemo(() => {
        if (!selectedCompetency?.modelId) return null;
        return competencyModelMap[selectedCompetency.modelId] || null;
    }, [selectedCompetency, competencyModelMap]);

    const selectedModelMeta = useMemo(() => {
        if (!selectedCompetencyModel) return null;

        return {
            modelId: selectedCompetencyModel.id,
            modelName: selectedCompetencyModel.name,
            versionNumber: selectedCompetencyModel.versionNumber,
            measurementIntent: selectedCompetencyModel.measurementIntent,
            locked: selectedCompetencyModel.locked,
            status: selectedCompetencyModel.status,
        };
    }, [selectedCompetencyModel]);

    /* ==========================================================
       AUTO-BIND competencyModelVersion (Strict Version Lock)
    ========================================================== */

    useEffect(() => {

        if (!selectedCompetencyModel) return;

        const currentVersion =
            selectedCompetencyModel.versionNumber;

        if (
            draftModel.competencyModelVersion !== currentVersion
        ) {
            setDraftModel(prev => ({
                ...prev,
                competencyModelVersion: currentVersion,
                updatedAt: new Date().toISOString(),
            }));
        }

    }, [selectedCompetencyModel]);

    /* ==========================================================
       GENERIC FIELD UPDATES
    ========================================================== */

    const updateField = (field, value) => {
        setDraftModel(prev => ({
            ...prev,
            [field]: value,
            updatedAt: new Date().toISOString(),
        }));
    };

    const replaceField = (field, value) => {
        setDraftModel(prev => ({
            ...prev,
            [field]: value,
            updatedAt: new Date().toISOString(),
        }));
    };

    /* ==========================================================
       WARRANT MANAGEMENT
    ========================================================== */

    const addWarrant = (warrant) => {
        setDraftModel(prev => ({
            ...prev,
            warrants: [...(prev.warrants || []), warrant],
            updatedAt: new Date().toISOString(),
        }));
    };

    const updateWarrant = (id, updates) => {
        setDraftModel(prev => ({
            ...prev,
            warrants: prev.warrants.map(w =>
                w.id === id ? { ...w, ...updates } : w
            ),
            updatedAt: new Date().toISOString(),
        }));
    };

    const removeWarrant = (id) => {
        setDraftModel(prev => ({
            ...prev,
            warrants: prev.warrants.filter(w => w.id !== id),
            updatedAt: new Date().toISOString(),
        }));
    };

    /* ==========================================================
       OBSERVABLE MANAGEMENT
    ========================================================== */

    const addObservable = (observable) => {
        setDraftModel(prev => ({
            ...prev,
            observables: [...(prev.observables || []), observable],
            updatedAt: new Date().toISOString(),
        }));
    };

    const updateObservable = (id, updates) => {
        setDraftModel(prev => ({
            ...prev,
            observables: prev.observables.map(o =>
                o.id === id ? { ...o, ...updates } : o
            ),
            updatedAt: new Date().toISOString(),
        }));
    };

    const removeObservable = (id) => {
        setDraftModel(prev => ({
            ...prev,
            observables: prev.observables.filter(o => o.id !== id),
            updatedAt: new Date().toISOString(),
        }));
    };

    /*  ======================================================
        EVIDENCE RULE MANAGEMENT

        `evidenceRules[]` (keyed by observableId) is what the wizard UI
        reads (Step5EvidenceRules, Step6StatisticalModel, Step8Confirmation),
        but a lot of other code — schema.js's validateEntity, the diagnostics
        engine, and several evidence-model panels — reads an embedded
        `observable.evidenceRule` object instead. The two used to drift out
        of sync (the array got written, the embedded field never did), which
        is what caused Step 6/7 to report an observable "missing
        evidenceRule" right next to a green "compatible with selected model"
        banner that was only checking the array. Mirror every change onto
        the matching observable so both shapes stay consistent.
        ====================================================== */
    const addEvidenceRule = (rule) => {
        setDraftModel(prev => ({
            ...prev,
            evidenceRules: [...(prev.evidenceRules || []), rule],
            observables: (prev.observables || []).map(o =>
                o.id === rule.observableId ? { ...o, evidenceRule: rule } : o
            ),
            updatedAt: new Date().toISOString(),
        }));
    };

    const updateEvidenceRule = (id, updates) => {
        setDraftModel(prev => {
            const evidenceRules = (prev.evidenceRules || []).map(r =>
                r.id === id ? { ...r, ...updates } : r
            );
            const updatedRule = evidenceRules.find(r => r.id === id);
            const observables = updatedRule
                ? (prev.observables || []).map(o =>
                    o.id === updatedRule.observableId
                        ? { ...o, evidenceRule: updatedRule }
                        : o
                )
                : prev.observables;
            return {
                ...prev,
                evidenceRules,
                observables,
                updatedAt: new Date().toISOString(),
            };
        });
    };

    const removeEvidenceRule = (id) => {
        setDraftModel(prev => {
            const removedRule = (prev.evidenceRules || []).find(r => r.id === id);
            const observables = removedRule
                ? (prev.observables || []).map(o =>
                    o.id === removedRule.observableId
                        ? { ...o, evidenceRule: undefined }
                        : o
                )
                : prev.observables;
            return {
                ...prev,
                evidenceRules: (prev.evidenceRules || []).filter(r => r.id !== id),
                observables,
                updatedAt: new Date().toISOString(),
            };
        });
    };


    /* ==========================================================
       STATISTICAL MODEL MANAGEMENT
    ========================================================== */

    const addStatisticalModel = (model) => {
        setDraftModel(prev => ({
            ...prev,
            statisticalModels: [
                ...(prev.statisticalModels || []),
                model
            ],
            updatedAt: new Date().toISOString(),
        }));
    };

    const updateStatisticalModel = (id, updates) => {
        setDraftModel(prev => ({
            ...prev,
            statisticalModels: prev.statisticalModels.map(m =>
                m.id === id ? { ...m, ...updates } : m
            ),
            updatedAt: new Date().toISOString(),
        }));
    };

    const removeStatisticalModel = (id) => {
        setDraftModel(prev => ({
            ...prev,
            statisticalModels:
                prev.statisticalModels.filter(m => m.id !== id),
            updatedAt: new Date().toISOString(),
        }));
    };

    /* ==========================================================
       CONTEXT VALUE
    ========================================================== */

    const value = {
        draftModel,
        competencies,
        competencyModels,

        selectedCompetency,
        selectedCompetencyModel,
        selectedModelMeta,

        setDraftModel,
        updateField,
        replaceField,

        addWarrant,
        updateWarrant,
        removeWarrant,

        addObservable,
        updateObservable,
        removeObservable,

        addEvidenceRule,
        updateEvidenceRule,
        removeEvidenceRule,

        addStatisticalModel,
        updateStatisticalModel,
        removeStatisticalModel,
    };

    return (
        <EvidenceWizardContext.Provider value={value}>
            {children}
        </EvidenceWizardContext.Provider>
    );
}

/* ==========================================================
   Hook
========================================================== */

export function useEvidenceWizardContext() {
    const context = useContext(EvidenceWizardContext);
    if (!context) {
        throw new Error(
            "useEvidenceWizardContext must be used within EvidenceWizardProvider"
        );
    }
    return context;
}