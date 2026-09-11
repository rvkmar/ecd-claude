// src/components/assemblyModels/AssemblyModelWizard/AssemblyModelWizard.jsx
// D54 (built, NOT test-verified this session).
// ------------------------------------------------------------
// 5-step Assembly Model wizard controller, following CompetencyWizard.jsx's
// shape: STEP_CONFIG + goNext/goBack + renderStep(), on the shared
// WizardSidebar/WizardStepContainer shell. Per UI spec §2.3:
//   1. Identity
//   2. Targets by SMV
//   3. Stopping rules
//   4. Selection algorithm
//   5. Review
// ------------------------------------------------------------

import React from "react";
import toast from "react-hot-toast";
import { useAssemblyModelWizard } from "./AssemblyModelWizardContext";
import WizardSidebar from "@/components/wizard/WizardSidebar";
import WizardStepContainer from "@/components/wizard/WizardStepContainer";
import ErrorBoundary from "@/components/ui/ErrorBoundary";

import Step1Identity from "./steps/Step1Identity";
import Step2Targets from "./steps/Step2Targets";
import Step3StoppingRules from "./steps/Step3StoppingRules";
import Step4SelectionAlgorithm from "./steps/Step4SelectionAlgorithm";
import Step5Review from "./steps/Step5Review";

const STEP_CONFIG = [
  { id: 1, label: "Identity" },
  { id: 2, label: "Targets by SMV" },
  { id: 3, label: "Stopping Rules" },
  { id: 4, label: "Selection Algorithm" },
  { id: 5, label: "Review" },
];

export default function AssemblyModelWizard({ onCancel }) {
  const {
    draft,
    loading,
    currentStep,
    setCurrentStep,
    canProceed,
    saveDraft,
    saveAndReview,
    confirmModel,
    returnToDraft,
    isDirty,
  } = useAssemblyModelWizard();

  // Same auto-save-on-Next convention as CompetencyWizard.jsx: the very
  // first Next (leaving step 1) just advances since nothing is complete
  // enough to persist yet on a brand-new draft; every Next after that
  // silently saves first. A locked (confirmed+) record skips the save --
  // paging through it is read-only review, not editing.
  async function goNext() {
    if (!draft?.locked && !canProceed(currentStep)) {
      toast.error("Complete required fields before proceeding.");
      return;
    }

    if (currentStep < STEP_CONFIG.length) {
      if (currentStep > 1 && !draft?.locked) {
        const ok = await saveDraft();
        if (!ok) return;
      }
      setCurrentStep(currentStep + 1);
    }
  }

  function goBack() {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  }

  function renderStep() {
    switch (currentStep) {
      case 1:
        return <Step1Identity />;
      case 2:
        return <Step2Targets />;
      case 3:
        return <Step3StoppingRules />;
      case 4:
        return <Step4SelectionAlgorithm />;
      case 5:
        return <Step5Review />;
      default:
        return null;
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-slate-600">
        Loading Assembly Model...
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-100">
      <WizardSidebar
        steps={STEP_CONFIG}
        currentStepIndex={currentStep - 1}
        onStepClick={(index) => {
          const stepId = index + 1;
          if (stepId <= currentStep || canProceed(currentStep)) {
            setCurrentStep(stepId);
          }
        }}
        locked={draft?.locked}
        status={draft?.status}
        title="Assembly Model Wizard"
        brandInitial="A"
        footerLabel="Assembly Layer"
      />

      <div className="flex-1 flex flex-col min-w-0">
        <WizardStepContainer
          step={currentStep}
          totalSteps={STEP_CONFIG.length}
          onNext={goNext}
          onBack={goBack}
          onCancel={onCancel}
          canProceed={canProceed(currentStep)}
          isLast={currentStep === STEP_CONFIG.length}
          locked={draft?.locked}
          status={draft?.status}
          isDirty={isDirty}
          onSaveDraft={saveDraft}
          onSaveAndReview={saveAndReview}
          onConfirm={confirmModel}
          onReturnToDraft={returnToDraft}
          modelLabel="Assembly Model"
        >
          <ErrorBoundary resetKey={currentStep} label={STEP_CONFIG[currentStep - 1]?.label}>
            {renderStep()}
          </ErrorBoundary>
        </WizardStepContainer>
      </div>
    </div>
  );
}
