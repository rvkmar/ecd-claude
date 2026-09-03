// Day 44 — shared wizard shell tests.
//
// These cover exactly the behaviors the Day 44 audit found across the
// Competency and Evidence wizards' WizardSidebar/WizardStepContainer pairs
// before merging them: unconditional step-click callback with 0-based
// indices, the two parameterised cosmetic differences (adaptive Cancel/OK
// label, model-specific locked-notice text), and the Next/Save/Lock&Confirm
// button-gating rules both wizards depended on unchanged.
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import WizardSidebar from "../WizardSidebar";
import WizardStepContainer from "../WizardStepContainer";

const STEPS = [
    { id: 1, label: "Identity" },
    { id: 2, label: "Details" },
    { id: 3, label: "Review" },
];

describe("shared WizardSidebar", () => {
    it("calls onStepClick with the 0-based index for the clicked step", () => {
        const onStepClick = vi.fn();
        render(
            <WizardSidebar
                steps={STEPS}
                currentStepIndex={0}
                onStepClick={onStepClick}
                status="draft"
                title="Test Wizard"
                brandInitial="T"
                footerLabel="Test Layer"
            />
        );
        fireEvent.click(screen.getByText("Review"));
        expect(onStepClick).toHaveBeenCalledWith(2);
    });

    it("renders the branding passed in by the caller, not a hardcoded name", () => {
        render(
            <WizardSidebar
                steps={STEPS}
                currentStepIndex={0}
                onStepClick={() => {}}
                status="draft"
                title="Evidence Model Wizard"
                brandInitial="E"
                footerLabel="Evidence Layer"
            />
        );
        expect(screen.getByText("Evidence Model Wizard")).toBeInTheDocument();
        expect(screen.getByText("Evidence Layer")).toBeInTheDocument();
    });

    it("does not gate step clicks itself -- locked models stay navigable", () => {
        const onStepClick = vi.fn();
        render(
            <WizardSidebar
                steps={STEPS}
                currentStepIndex={0}
                onStepClick={onStepClick}
                locked
                status="confirmed"
                title="Test Wizard"
                brandInitial="T"
                footerLabel="Test Layer"
            />
        );
        fireEvent.click(screen.getByText("Review"));
        expect(onStepClick).toHaveBeenCalledWith(2);
    });
});

describe("shared WizardStepContainer", () => {
    const baseProps = {
        step: 1,
        totalSteps: 3,
        onNext: vi.fn(),
        onBack: vi.fn(),
        onCancel: vi.fn(),
        canProceed: true,
        isLast: false,
        locked: false,
        status: "draft",
    };

    it("always shows Cancel + icon when adaptiveCancelLabel is not set (Competency behavior)", () => {
        render(
            <WizardStepContainer {...baseProps} locked status="confirmed">
                <div>content</div>
            </WizardStepContainer>
        );
        expect(screen.getByText("Cancel")).toBeInTheDocument();
    });

    it("swaps Cancel for a bare OK once read-only when adaptiveCancelLabel is set (Evidence behavior)", () => {
        render(
            <WizardStepContainer {...baseProps} locked status="confirmed" adaptiveCancelLabel>
                <div>content</div>
            </WizardStepContainer>
        );
        expect(screen.getByText("OK")).toBeInTheDocument();
        expect(screen.queryByText("Cancel")).not.toBeInTheDocument();
    });

    it("names the model type in the locked notice via modelLabel", () => {
        render(
            <WizardStepContainer {...baseProps} locked status="confirmed" modelLabel="Evidence Model">
                <div>content</div>
            </WizardStepContainer>
        );
        expect(
            screen.getByText(/This Evidence Model is confirmed and locked\./)
        ).toBeInTheDocument();
    });

    it("disables Next while editing when canProceed is false", () => {
        render(
            <WizardStepContainer {...baseProps} canProceed={false}>
                <div>content</div>
            </WizardStepContainer>
        );
        expect(screen.getByText("Next").closest("button")).toBeDisabled();
    });

    it("does not gate Next on canProceed once the model is locked", () => {
        render(
            <WizardStepContainer {...baseProps} canProceed={false} locked status="confirmed">
                <div>content</div>
            </WizardStepContainer>
        );
        expect(screen.getByText("Next").closest("button")).not.toBeDisabled();
    });

    it("shows Save for Review only on the last step while still a draft", () => {
        render(
            <WizardStepContainer {...baseProps} isLast status="draft">
                <div>content</div>
            </WizardStepContainer>
        );
        expect(screen.getByText("Save for Review")).toBeInTheDocument();
    });

    it("shows Lock & Confirm and Return to draft on the last step in review mode", () => {
        render(
            <WizardStepContainer
                {...baseProps}
                isLast
                status="reviewed"
                onReturnToDraft={vi.fn()}
            >
                <div>content</div>
            </WizardStepContainer>
        );
        expect(screen.getByText("Lock & Confirm")).toBeInTheDocument();
        expect(screen.getByText("Return to draft")).toBeInTheDocument();
    });
});
