// src/components/itemBank/ItemWizard/steps/Step2Blueprint.jsx
// ------------------------------------------------------------
// Step 2 — Blueprint & Alignment (read-only)
//
// Two things the author has to read before authoring anything, and which
// used to be split across steps 2 and 7 with the alignment audit in step
// 7 recomputing a subset of the checks and reporting them a second time:
//
//   1. THE INTERPRETIVE CHAIN — claim, warrant, observable, evidence
//      rule, statistical model, decision rule. What the item's responses
//      will be taken to mean.
//   2. THE BLUEPRINT CONTRACT — what the bound Task Model permits. The
//      interaction and scoring whitelists, the difficulty target and the
//      exposure policy are constraints on this item, and an author who
//      does not see them until a red toast on step 5 has wasted the work
//      in between.
// ------------------------------------------------------------

import React from "react";
import { AlertTriangle, Info } from "lucide-react";
import { useItemWizard } from "../ItemWizardContext";
import { interactionLabel, scoringLabel } from "../../itemConstants";

function Panel({ title, children, subtitle }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
      {subtitle && <p className="mt-1 text-xs text-slate-500">{subtitle}</p>}
      <div className="mt-3 space-y-2">{children}</div>
    </section>
  );
}

function Line({ label, children }) {
  return (
    <div className="text-sm">
      <span className="font-medium text-slate-900">{label}:</span>{" "}
      <span className="break-words text-slate-700">{children ?? "—"}</span>
    </div>
  );
}

function DirectionBadge({ direction }) {
  const colors = {
    supports: "bg-emerald-100 text-emerald-700",
    weakens: "bg-red-100 text-red-700",
    neutral: "bg-slate-100 text-slate-600",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${
        colors[direction] || "bg-slate-100 text-slate-600"
      }`}
    >
      {direction || "unspecified"}
    </span>
  );
}

export default function Step2Blueprint() {
  const { item, ctx, evidenceModel, taskModel, chainLoading } = useItemWizard();

  if (!item.taskModelId || !item.observationId) {
    return (
      <div className="flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-600">
        <Info size={16} strokeWidth={2.25} className="mt-0.5 shrink-0" />
        Complete the instantiation step first — the chain shown here is derived
        from it.
      </div>
    );
  }

  if (chainLoading) {
    return <div className="text-sm text-slate-500">Loading the evidence chain…</div>;
  }

  const { observable, warrant, activeStatisticalModel, blueprint } = ctx;
  const decisionRule = evidenceModel?.decisionRule;

  const hasDecisionRule = !!decisionRule &&
    ["type", "threshold", "direction", "justification"].some(
      (k) => String(decisionRule[k] ?? "").trim().length > 0
    );

  const hasBlueprint =
    blueprint &&
    (blueprint.allowedInteractionTypes?.length ||
      blueprint.allowedScoringMethods?.length ||
      blueprint.difficultyRange ||
      blueprint.exposurePolicy ||
      blueprint.cognitiveDemand ||
      blueprint.domainAlignment);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">
          Blueprint &amp; Alignment
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          What this item's responses will be taken to mean, and what its Task
          Model permits it to be. Both are read-only here — they are authored
          on the Evidence Model and the Task Model.
        </p>
      </div>

      <Panel
        title="Claim"
        subtitle="The inference the whole chain exists to support."
      >
        <p className="text-sm text-slate-700">
          {evidenceModel?.claimStatement || "No claim statement recorded."}
        </p>
      </Panel>

      <Panel
        title="Warrant"
        subtitle="Why the observable licenses the claim."
      >
        <p className="text-sm text-slate-700">
          {warrant?.reasoningStatement || "No warrant resolved for this observable."}
        </p>
        <Line label="Cognitive attribute">{warrant?.cognitiveAttribute}</Line>
        <Line label="Performance condition">{warrant?.performanceCondition}</Line>
        <Line label="Limitation">{warrant?.limitationClause}</Line>
      </Panel>

      <Panel
        title="Observable"
        subtitle="What this item must elicit."
      >
        <p className="text-sm text-slate-700">{observable?.statement || "—"}</p>

        <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
          <DirectionBadge direction={observable?.evidenceRule?.direction} />
          <span className="text-slate-500">
            Strength level: {observable?.evidenceRule?.strengthLevel ?? "—"}
          </span>
          <span className="font-mono text-slate-500">
            Response mode: {observable?.type || "—"}
          </span>
        </div>

        <Line label="Activation condition">
          {observable?.evidenceRule?.activationCondition}
        </Line>
        <Line label="Justification">
          {observable?.evidenceRule?.justification}
        </Line>
      </Panel>

      <Panel
        title="Statistical model"
        subtitle="Scoring vocabulary is derived from the ACTIVE model — not chosen freely."
      >
        {activeStatisticalModel ? (
          <>
            <Line label="Type">
              {activeStatisticalModel.type}
              {activeStatisticalModel.subtype
                ? ` (${activeStatisticalModel.subtype})`
                : ""}
            </Line>
            <Line label="Permits scoring methods">
              {ctx.allowedScoringMethods.map(scoringLabel).join(", ") || "none"}
            </Line>
          </>
        ) : (
          <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <AlertTriangle size={16} strokeWidth={2.25} className="mt-0.5 shrink-0" />
            This Evidence Model has no active statistical model, so no scoring
            method can be derived for this item. Activate one on the Evidence
            Model.
          </div>
        )}
      </Panel>

      <Panel title="Decision rule">
        {/* An Evidence Model can legitimately have no decision rule yet.
            Rendering the four fields regardless produced
            "Type: — Threshold: — Direction: — Justification: —", which
            reads like four broken lookups rather than one absent record. */}
        {hasDecisionRule ? (
          <>
            <Line label="Type">{decisionRule.type}</Line>
            <Line label="Threshold">{decisionRule.threshold}</Line>
            <Line label="Direction">{decisionRule.direction}</Line>
            <Line label="Justification">{decisionRule.justification}</Line>
          </>
        ) : (
          <p className="text-sm text-slate-500">
            This Evidence Model has not authored a decision rule. Responses to
            this item will still be scored, but nothing yet converts the
            resulting evidence into a classification.
          </p>
        )}
      </Panel>

      <Panel
        title="Task Model blueprint"
        subtitle={`Constraints '${
          taskModel?.name || item.taskModelId
        }' imposes on every item that instantiates it.`}
      >
        {!hasBlueprint && (
          <p className="text-sm text-slate-500">
            This Task Model declares no blueprint constraints, so only the
            observable's own response mode limits this item.
          </p>
        )}

        {hasBlueprint && (
          <>
            <Line label="Allowed interactions">
              {blueprint.allowedInteractionTypes?.length
                ? blueprint.allowedInteractionTypes.map(interactionLabel).join(", ")
                : "unconstrained"}
            </Line>
            <Line label="Allowed scoring methods">
              {blueprint.allowedScoringMethods?.length
                ? blueprint.allowedScoringMethods.map(scoringLabel).join(", ")
                : "unconstrained"}
            </Line>
            <Line label="Target difficulty">
              {typeof blueprint.difficultyRange?.min === "number"
                ? `${blueprint.difficultyRange.min} to ${blueprint.difficultyRange.max}`
                : "unconstrained"}
            </Line>
            <Line label="Cognitive demand">
              {[
                blueprint.cognitiveDemand?.bloomLevel,
                blueprint.cognitiveDemand?.reasoningType,
              ]
                .filter(Boolean)
                .join(" · ") || "unconstrained"}
            </Line>
            <Line label="Domain">
              {[
                blueprint.domainAlignment?.subject,
                blueprint.domainAlignment?.gradeBand,
              ]
                .filter(Boolean)
                .join(" · ") || "unconstrained"}
            </Line>
            <Line label="Exposure policy">
              {blueprint.exposurePolicy?.maxUses
                ? `max ${blueprint.exposurePolicy.maxUses} uses${
                    blueprint.exposurePolicy.cooldownPolicy
                      ? ` · ${blueprint.exposurePolicy.cooldownPolicy}`
                      : ""
                  }`
                : "unconstrained"}
            </Line>
          </>
        )}

        {/* The net effect of observable AND blueprint together. Stating it
            here means the interaction step is never the first time the
            author learns the two disagree. */}
        <div className="mt-3 rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
          <div className="font-medium text-slate-900">
            Net effect on this item
          </div>
          <div className="mt-1">
            Interaction:{" "}
            {ctx.allowedInteractionTypes.length
              ? ctx.allowedInteractionTypes.map(interactionLabel).join(", ")
              : "nothing available"}
          </div>
          <div>
            Scoring:{" "}
            {ctx.allowedScoringMethods.length
              ? ctx.allowedScoringMethods.map(scoringLabel).join(", ")
              : "nothing available"}
          </div>
        </div>

        {(ctx.interactionBlockedByBlueprint || ctx.scoringBlockedByBlueprint) && (
          <div className="mt-3 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertTriangle size={16} strokeWidth={2.25} className="mt-0.5 shrink-0" />
            <span>
              The blueprint and the observation contradict each other — the
              whitelist permits nothing that can elicit this observable. One of
              them has to change on the Task Model; no item can satisfy both.
            </span>
          </div>
        )}
      </Panel>
    </div>
  );
}
