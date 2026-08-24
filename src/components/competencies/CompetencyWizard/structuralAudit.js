// CompetencyWizard/structuralAudit.js
// 🧠 Shared Structural Audit — single source of truth
// -----------------------------------------------------------------------------
// This logic used to live only inside StructuralAuditChecklist.jsx (Step 8's
// display component), which explicitly promises the user "Final confirmation
// will be blocked if any rule fails." But CompetencyWizardContext's
// stepValidity[8] never actually read this checklist's result -- it only
// checked `competencies.length > 0`, so a model with every red X on this
// checklist still let Next / Lock & Confirm proceed right up to the backend
// rejecting it (the backend's own /models/:id/confirm route does enforce all
// of this via schema.js's strict validateEntity). That's the wizard visually
// "wrapping up" on an incomplete form: the audit step shows failures but
// doesn't stop you from clicking past it.
//
// Extracted here so the checklist component (what the user sees) and the
// context (what actually gates Next/Confirm) can never silently disagree --
// exactly the two-engines-disagree failure mode already fixed once in the
// Evidence Wizard's coverage heatmap.

function buildPrerequisiteGraph(competencies) {
    const graph = {};

    competencies.forEach((c) => {
        graph[c.id] = (c.relationships || [])
            .filter((r) => r.type === "prerequisite")
            .map((r) => r.targetCompetencyId);
    });

    return graph;
}

function hasCycle(graph) {
    const visited = new Set();
    const stack = new Set();

    function dfs(node) {
        if (stack.has(node)) return true;
        if (visited.has(node)) return false;

        visited.add(node);
        stack.add(node);

        for (const neighbor of graph[node] || []) {
            if (dfs(neighbor)) return true;
        }

        stack.delete(node);
        return false;
    }

    return Object.keys(graph).some((node) => dfs(node));
}

function isCompetencyStructurallyValid(c) {
    if (!c.name || c.name.trim().length < 3) return false;
    if (!c.description || c.description.trim().length < 8) return false;
    if (!c.variableType) return false;

    if (c.variableType === "binary") {
        return c.states?.length === 2;
    }

    if (c.variableType === "ordinal") {
        return c.states?.length >= 2;
    }

    if (c.variableType === "categorical") {
        return c.states?.length >= 2;
    }

    if (c.variableType === "continuous") {
        return (
            typeof c.scale?.min === "number" &&
            typeof c.scale?.max === "number" &&
            c.scale.min < c.scale.max
        );
    }

    return false;
}

/**
 * Computes the full Step 8 structural audit checklist. Returns
 * { checks: [{label, passed}], allPassed } -- `checks` is what
 * StructuralAuditChecklist renders, `allPassed` is what
 * CompetencyWizardContext's stepValidity[8] gates on.
 */
export function computeStructuralAudit({ model, competencies = [] }) {
    const checks = [];

    checks.push({
        label: "Model name defined (min 5 chars)",
        passed: !!model?.name && model.name.trim().length >= 5,
    });

    checks.push({
        label: "Model description defined (min 10 chars)",
        passed: !!model?.description && model.description.trim().length >= 10,
    });

    checks.push({
        label: "Measurement intent selected",
        passed: ["unidimensional", "multidimensional"].includes(
            model?.measurementIntent
        ),
    });

    checks.push({
        label: "At least one competency defined",
        passed: competencies.length > 0,
    });

    const allCompetenciesValid = competencies.every(isCompetencyStructurallyValid);

    checks.push({
        label: "All competencies structurally valid",
        passed: allCompetenciesValid,
    });

    if (model?.measurementIntent === "unidimensional") {
        checks.push({
            label: "Unidimensional constraint satisfied (exactly 1 variable)",
            passed: competencies.length === 1,
        });
    }

    const noSelfRefs = competencies.every((c) =>
        (c.relationships || []).every((r) => r.targetCompetencyId !== c.id)
    );

    checks.push({
        label: "No self-referential relationships",
        passed: noSelfRefs,
    });

    const graph = buildPrerequisiteGraph(competencies);
    const cycleExists = hasCycle(graph);

    checks.push({
        label: "No prerequisite cycles",
        passed: !cycleExists,
    });

    return {
        checks,
        allPassed: checks.every((c) => c.passed),
    };
}
