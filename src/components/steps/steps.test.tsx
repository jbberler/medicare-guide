// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import "@testing-library/jest-dom";

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("@/components/wizard/WizardShell", () => ({
  useWizard: vi.fn(),
}));

vi.mock("@/lib/engine", () => ({
  computeScenarios: vi.fn(),
  LookupError: class LookupError extends Error {
    constructor(msg: string) {
      super(msg);
      this.name = "LookupError";
    }
  },
}));

vi.mock("@/lib/schemas", () => ({
  WizardInputsSchema: {
    safeParse: vi.fn(),
  },
}));

vi.mock("@/components/scenarios/ComparisonTable", () => ({
  ComparisonTable: () => <div data-testid="comparison-table" />,
}));

vi.mock("@/components/scenarios/ScenarioTabs", () => ({
  ScenarioTabs: () => <div data-testid="scenario-tabs" />,
}));

vi.mock("@/components/scenarios/RecommendationPanel", () => ({
  RecommendationPanel: () => <div data-testid="recommendation-panel" />,
}));

vi.mock("@/lib/storage", () => ({
  clearWizardState: vi.fn(),
}));

import { useWizard } from "@/components/wizard/WizardShell";
import { computeScenarios, LookupError } from "@/lib/engine";
import { WizardInputsSchema } from "@/lib/schemas";
import { ScenariosStep } from "./ScenariosStep";
import { MemoStep } from "./MemoStep";

const mockUseWizard = vi.mocked(useWizard);
const mockComputeScenarios = vi.mocked(computeScenarios);
const mockSafeParse = vi.mocked(WizardInputsSchema.safeParse);

// Minimal valid ScenarioResults fixture
function makeResults() {
  const scenario = {
    id: "A" as const,
    label: "Employer",
    monthlyTotal: 300,
    annualTotal: 3600,
    tag: null,
    tagReason: null,
    partBMonthly: 185,
    partAMonthly: 0,
    medigapMonthly: null,
    medigapUnavailable: false,
    partDMonthly: 30,
    employerPremiumMonthly: 300,
    maMonthlyPremium: 0,
    irmaaImpact: "None",
    doctorFreedom: "Any",
    penaltyRisk: "Low",
    bestWhen: "Always",
    personalizedFit: "Good",
  };
  return {
    scenarios: [
      scenario,
      { ...scenario, id: "B" as const, label: "Med + Medigap" },
      { ...scenario, id: "C" as const, label: "Advantage" },
    ] as unknown as [typeof scenario, typeof scenario, typeof scenario],
    cobraAcaWarning: false,
    cobraAcaMessage: null,
    noTargetPersonaRedirect: false,
    noTargetPersonaMessage: null,
    recommended: "A" as const,
  };
}

// ─── ScenariosStep ────────────────────────────────────────────────────────────

describe("ScenariosStep", () => {
  const mockAdvance = vi.fn();
  const mockGoBack = vi.fn();

  beforeEach(() => {
    vi.useFakeTimers();
    mockUseWizard.mockReturnValue({
      state: { inputs: { some: "data" } },
      advance: mockAdvance,
      goBack: mockGoBack,
      dispatch: vi.fn(),
      step: 6,
    } as any);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("shows loading state immediately on render", () => {
    mockSafeParse.mockReturnValue({ success: true, data: {} } as any);
    mockComputeScenarios.mockReturnValue(makeResults() as any);

    render(<ScenariosStep />);
    expect(screen.getByText(/Analyzing your situation/)).toBeInTheDocument();
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("shows success state after 2s timer fires", async () => {
    mockSafeParse.mockReturnValue({ success: true, data: {} } as any);
    mockComputeScenarios.mockReturnValue(makeResults() as any);

    render(<ScenariosStep />);

    await act(async () => {
      vi.advanceTimersByTime(2000);
    });

    expect(screen.getByText("Your scenarios")).toBeInTheDocument();
    expect(screen.getByTestId("recommendation-panel")).toBeInTheDocument();
  });

  it("shows error state when schema validation fails", async () => {
    mockSafeParse.mockReturnValue({ success: false, error: {} } as any);

    render(<ScenariosStep />);

    await act(async () => {
      vi.advanceTimersByTime(2000);
    });

    expect(screen.getByText(/required information is missing/)).toBeInTheDocument();
    expect(screen.getByText("← Go back")).toBeInTheDocument();
  });

  it("shows LookupError message on LookupError from engine", async () => {
    mockSafeParse.mockReturnValue({ success: true, data: {} } as any);
    mockComputeScenarios.mockImplementation(() => {
      throw new LookupError("bracket not found");
    });

    render(<ScenariosStep />);

    await act(async () => {
      vi.advanceTimersByTime(2000);
    });

    expect(screen.getByText(/Something went wrong processing/)).toBeInTheDocument();
  });

  it("shows generic error message on unexpected error", async () => {
    mockSafeParse.mockReturnValue({ success: true, data: {} } as any);
    mockComputeScenarios.mockImplementation(() => {
      throw new Error("random failure");
    });

    render(<ScenariosStep />);

    await act(async () => {
      vi.advanceTimersByTime(2000);
    });

    expect(screen.getByText(/An unexpected error occurred/)).toBeInTheDocument();
  });

  it("does not show results before 2s timer fires", async () => {
    mockSafeParse.mockReturnValue({ success: true, data: {} } as any);
    mockComputeScenarios.mockReturnValue(makeResults() as any);

    render(<ScenariosStep />);

    // Advance only 1s — still in loading
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    expect(screen.queryByText("Your scenarios")).not.toBeInTheDocument();
    expect(screen.getByText(/Analyzing your situation/)).toBeInTheDocument();
  });
});

// ─── MemoStep ─────────────────────────────────────────────────────────────────

describe("MemoStep", () => {
  const mockAdvance = vi.fn();
  const mockGoBack = vi.fn();

  beforeEach(() => {
    vi.useFakeTimers();
    mockUseWizard.mockReturnValue({
      state: { inputs: { some: "data" } },
      advance: mockAdvance,
      goBack: mockGoBack,
      dispatch: vi.fn(),
      step: 7,
    } as any);
    mockSafeParse.mockReturnValue({ success: true, data: {} } as any);
    mockComputeScenarios.mockReturnValue(makeResults() as any);
    // Mock window.print
    Object.defineProperty(window, "print", {
      value: vi.fn(),
      writable: true,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("shows loading interstitial immediately on render", () => {
    render(<MemoStep />);
    expect(screen.getByText(/Preparing your memo/)).toBeInTheDocument();
  });

  it("shows memo view after 1s timer fires", async () => {
    render(<MemoStep />);

    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    expect(screen.getByText(/Print \/ Save as PDF/)).toBeInTheDocument();
  });

  it("shows error state when schema parse fails in MemoStep", async () => {
    mockSafeParse.mockReturnValue({ success: false, error: {} } as any);

    render(<MemoStep />);

    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    expect(screen.getByText(/required information is missing/)).toBeInTheDocument();
  });

  it("calls window.print when print button is clicked", async () => {
    render(<MemoStep />);

    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    const printButton = screen.getByText(/Print \/ Save as PDF/);
    await act(async () => {
      printButton.click();
    });

    expect(window.print).toHaveBeenCalled();
  });

  it("shows confirmation screen after afterprint fires", async () => {
    render(<MemoStep />);

    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    const printButton = screen.getByText(/Print \/ Save as PDF/);
    await act(async () => {
      printButton.click();
    });

    // Fire the afterprint event
    await act(async () => {
      window.dispatchEvent(new Event("afterprint"));
    });

    expect(screen.getByText(/Did you save your memo/)).toBeInTheDocument();
    expect(screen.getByText(/Yes, I saved it/)).toBeInTheDocument();
    expect(screen.getByText(/No, go back/)).toBeInTheDocument();
  });

  it("returns to memo view when No is clicked on confirmation screen", async () => {
    render(<MemoStep />);

    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    const printButton = screen.getByText(/Print \/ Save as PDF/);
    await act(async () => {
      printButton.click();
    });

    await act(async () => {
      window.dispatchEvent(new Event("afterprint"));
    });

    const noButton = screen.getByText(/No, go back/);
    await act(async () => {
      noButton.click();
    });

    // Back to memo view
    expect(screen.getByText(/Print \/ Save as PDF/)).toBeInTheDocument();
    expect(screen.queryByText(/Did you save your memo/)).not.toBeInTheDocument();
  });
});
