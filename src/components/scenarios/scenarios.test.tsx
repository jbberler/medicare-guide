// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import type { ScenarioResults, ScenarioResult } from "@/lib/engine";
import { RecommendationPanel } from "./RecommendationPanel";
import { ComparisonTable } from "./ComparisonTable";
import { ScenarioTabs } from "./ScenarioTabs";

// ─── Fixture ─────────────────────────────────────────────────────────────────

function makeScenario(
  id: "A" | "B" | "C",
  overrides: Partial<ScenarioResult> = {}
): ScenarioResult {
  return {
    id,
    label: `Scenario ${id} Label`,
    monthlyTotal: 300,
    annualTotal: 3600,
    tag: null,
    tagReason: null,
    partBMonthly: 185,
    partAMonthly: 0,
    medigapMonthly: null,
    medigapUnavailable: false,
    partDMonthly: 30,
    employerPremiumMonthly: 0,
    maMonthlyPremium: 0,
    irmaaImpact: "No IRMAA",
    doctorFreedom: "Any provider",
    penaltyRisk: "Low",
    bestWhen: "Always",
    personalizedFit: "Good for you",
    ...overrides,
  };
}

function makeResults(overrides: Partial<ScenarioResults> = {}): ScenarioResults {
  return {
    scenarios: [
      makeScenario("A"),
      makeScenario("B"),
      makeScenario("C"),
    ],
    cobraAcaWarning: false,
    cobraAcaMessage: null,
    noTargetPersonaRedirect: false,
    noTargetPersonaMessage: null,
    recommended: "A",
    ...overrides,
  };
}

// ─── RecommendationPanel ─────────────────────────────────────────────────────

describe("RecommendationPanel", () => {
  it("shows recommended scenario when recommended is set", () => {
    const results = makeResults({
      recommended: "B",
      scenarios: [
        makeScenario("A"),
        makeScenario("B", { tag: "best_fit", tagReason: "Best for your situation" }),
        makeScenario("C"),
      ],
    });
    render(<RecommendationPanel results={results} />);
    expect(screen.getByText(/Recommended: Scenario B/)).toBeInTheDocument();
    expect(screen.getByText("Best for your situation")).toBeInTheDocument();
  });

  it("shows trade-offs message when no recommended scenario", () => {
    const results = makeResults({ recommended: null });
    render(<RecommendationPanel results={results} />);
    expect(screen.getByText(/trade-offs in multiple directions/)).toBeInTheDocument();
  });

  it("shows COBRA/ACA warning banner when cobraAcaWarning is true", () => {
    const results = makeResults({
      cobraAcaWarning: true,
      cobraAcaMessage: "COBRA may provide better coverage.",
    });
    render(<RecommendationPanel results={results} />);
    expect(screen.getByText("COBRA may provide better coverage.")).toBeInTheDocument();
  });

  it("hides COBRA/ACA banner when cobraAcaWarning is false", () => {
    const results = makeResults({
      cobraAcaWarning: false,
      cobraAcaMessage: null,
    });
    render(<RecommendationPanel results={results} />);
    expect(screen.queryByText(/COBRA/)).not.toBeInTheDocument();
  });

  it("shows recommended without tagReason when tagReason is null", () => {
    const results = makeResults({
      recommended: "C",
      scenarios: [
        makeScenario("A"),
        makeScenario("B"),
        makeScenario("C", { tagReason: null }),
      ],
    });
    render(<RecommendationPanel results={results} />);
    expect(screen.getByText(/Recommended: Scenario C/)).toBeInTheDocument();
  });
});

// ─── ScenarioTabs ─────────────────────────────────────────────────────────────

describe("ScenarioTabs", () => {
  it("defaults to the recommended tab on initial render", () => {
    const results = makeResults({ recommended: "C" });
    render(<ScenarioTabs results={results} />);
    // The recommended tab should be selected (aria-selected)
    const tabC = screen.getByRole("tab", { name: /C: Advantage/ });
    expect(tabC).toHaveAttribute("aria-selected", "true");
  });

  it("defaults to tab A when recommended is null", () => {
    const results = makeResults({ recommended: null });
    render(<ScenarioTabs results={results} />);
    const tabA = screen.getByRole("tab", { name: /A: Employer/ });
    expect(tabA).toHaveAttribute("aria-selected", "true");
  });

  it("switches active tab when a different tab is clicked", () => {
    const results = makeResults({ recommended: "A" });
    render(<ScenarioTabs results={results} />);

    const tabB = screen.getByRole("tab", { name: /B: Med \+ Medigap/ });
    fireEvent.click(tabB);
    expect(tabB).toHaveAttribute("aria-selected", "true");

    const tabA = screen.getByRole("tab", { name: /A: Employer/ });
    expect(tabA).toHaveAttribute("aria-selected", "false");
  });

  it("shows dot indicator only on the recommended tab", () => {
    const results = makeResults({ recommended: "B" });
    render(<ScenarioTabs results={results} />);
    // Tab B button should contain the dot span (aria-hidden)
    const tabB = screen.getByRole("tab", { name: /B: Med \+ Medigap/ });
    // The dot is aria-hidden, so we query within the tab
    const dot = tabB.querySelector('span[aria-hidden="true"]');
    expect(dot).toBeInTheDocument();

    // Tab A should not have a dot
    const tabA = screen.getByRole("tab", { name: /A: Employer/ });
    const dotA = tabA.querySelector('span[aria-hidden="true"]');
    expect(dotA).not.toBeInTheDocument();
  });

  it("shows medigap unavailable notice when medigapUnavailable is true on Scenario B", () => {
    const results = makeResults({
      scenarios: [
        makeScenario("A"),
        makeScenario("B", { medigapUnavailable: true }),
        makeScenario("C"),
      ],
      recommended: "B",
    });
    render(<ScenarioTabs results={results} />);
    expect(screen.getByText(/Medigap estimates are not available/)).toBeInTheDocument();
  });

  it("does not show medigap notice on non-B scenarios even if medigapUnavailable", () => {
    const results = makeResults({
      scenarios: [
        makeScenario("A", { medigapUnavailable: true }),
        makeScenario("B"),
        makeScenario("C"),
      ],
      recommended: "A",
    });
    render(<ScenarioTabs results={results} />);
    expect(screen.queryByText(/Medigap estimates are not available/)).not.toBeInTheDocument();
  });

  it("updates panel content when a new tab is clicked", () => {
    const results = makeResults({
      scenarios: [
        makeScenario("A", { personalizedFit: "Good for A" }),
        makeScenario("B", { personalizedFit: "Good for B" }),
        makeScenario("C", { personalizedFit: "Good for C" }),
      ],
      recommended: "A",
    });
    render(<ScenarioTabs results={results} />);

    // Initially shows A's content
    expect(screen.getByText("Good for A")).toBeInTheDocument();

    // Click B
    const tabB = screen.getByRole("tab", { name: /B: Med \+ Medigap/ });
    fireEvent.click(tabB);
    expect(screen.getByText("Good for B")).toBeInTheDocument();
  });

  it("shows tag badge for the active scenario when tag is set", () => {
    const results = makeResults({
      scenarios: [
        makeScenario("A", { tag: "best_fit_overall", tagReason: "Best all around" }),
        makeScenario("B"),
        makeScenario("C"),
      ],
      recommended: "A",
    });
    render(<ScenarioTabs results={results} />);
    expect(screen.getByText("Best overall")).toBeInTheDocument();
  });
});

// ─── ComparisonTable ──────────────────────────────────────────────────────────

describe("ComparisonTable", () => {
  it("renders all three scenario columns", () => {
    const results = makeResults();
    render(<ComparisonTable results={results} />);
    expect(screen.getByText("Scenario A")).toBeInTheDocument();
    expect(screen.getByText("Scenario B")).toBeInTheDocument();
    expect(screen.getByText("Scenario C")).toBeInTheDocument();
  });

  it("shows Best value badge for best_fit_cost tag", () => {
    const results = makeResults({
      scenarios: [
        makeScenario("A"),
        makeScenario("B", { tag: "best_fit_cost" }),
        makeScenario("C"),
      ],
    });
    render(<ComparisonTable results={results} />);
    expect(screen.getByText("Best value")).toBeInTheDocument();
  });

  it("shows Best fit badge for best_fit tag", () => {
    const results = makeResults({
      scenarios: [
        makeScenario("A", { tag: "best_fit" }),
        makeScenario("B"),
        makeScenario("C"),
      ],
    });
    render(<ComparisonTable results={results} />);
    expect(screen.getByText("Best fit")).toBeInTheDocument();
  });

  it("shows medigap unavailable notice inline for Scenario B", () => {
    const results = makeResults({
      scenarios: [
        makeScenario("A"),
        makeScenario("B", { medigapUnavailable: true }),
        makeScenario("C"),
      ],
    });
    render(<ComparisonTable results={results} />);
    expect(screen.getByText(/estimates unavailable for your state/)).toBeInTheDocument();
  });
});
