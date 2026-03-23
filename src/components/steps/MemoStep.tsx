"use client";

import { useState, useEffect, useRef } from "react";
import { useWizard } from "@/components/wizard/WizardShell";
import { computeScenarios } from "@/lib/engine";
import type { ScenarioResults } from "@/lib/engine";
import { WizardInputsSchema } from "@/lib/schemas";
import type { WizardInputs } from "@/lib/schemas";
import irmaaData from "@/data/irmaa-2026.json";

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmt(n: number): string {
  return `$${Math.round(n).toLocaleString()}`;
}

function formatDate(): string {
  return new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function irmaaLabel(bracketId: string): string {
  const entry = irmaaData.brackets.find((b) => b.id === bracketId);
  return entry?.label ?? bracketId;
}

function coverageLabel(inputs: WizardInputs): string {
  switch (inputs.coverage_type) {
    case "employer_group":
      return `employer group coverage${inputs.employer_size_20_plus ? " (employer 20+ employees)" : " (employer under 20 employees)"}`;
    case "cobra":
      return "COBRA continuation coverage";
    case "aca":
      return "ACA marketplace coverage";
    case "none":
      return "no current coverage";
    default: {
      // Exhaustiveness guard — catches new COVERAGE_TYPES values at compile time
      const _exhaustive: never = inputs.coverage_type;
      return String(_exhaustive);
    }
  }
}

function situationSummary(inputs: WizardInputs): string {
  const age = `age ${inputs.age}`;
  const state = inputs.state;
  const coverage = coverageLabel(inputs);
  const income = irmaaLabel(inputs.irmaa_bracket);
  const retiring = inputs.retiring_within_12_months
    ? " planning to retire within 12 months"
    : " not planning to retire soon";

  return `You are ${age}, residing in ${state}, currently on ${coverage}. Your 2024 household income falls in the ${income} range. You are ${retiring}.`;
}

function generateActionItems(
  inputs: WizardInputs,
  results: ScenarioResults
): string[] {
  const items: string[] = [];

  // COBRA/ACA requires immediate action regardless of recommendation
  if (results.cobraAcaWarning) {
    items.push(
      "Enroll in Part B immediately — your COBRA/ACA coverage does NOT protect you from late-enrollment penalties (10% surcharge per year of delay)."
    );
  }

  switch (results.recommended) {
    case "A":
      items.push(
        "Enroll in Part A at ssa.gov — it is premium-free with 40 or more work credits."
      );
      items.push(
        "Request a Certificate of Creditable Coverage from your employer and keep it on file."
      );
      items.push(
        "Mark your calendar: you have a Special Enrollment Period of 8 months after employer coverage ends to enroll in Part B without penalty."
      );
      items.push(
        "Review your employer plan's Summary of Benefits annually — costs and coverage change each year."
      );
      break;

    case "B":
      items.push(
        "Enroll in Parts A & B at ssa.gov or your local Social Security office."
      );
      items.push(
        `Contact 3–5 Medigap Plan G insurers in ${inputs.state} for quotes — premiums vary significantly by insurer.`
      );
      items.push(
        "Enroll in a Part D prescription drug plan at medicare.gov/plan-compare."
      );
      if (inputs.coverage_type !== "none") {
        items.push(
          "Request a Certificate of Creditable Coverage from your current insurer."
        );
      }
      items.push(
        "Confirm your specific doctors accept Medicare at medicare.gov/care-compare."
      );
      break;

    case "C":
      items.push("Enroll in Parts A & B at ssa.gov.");
      items.push(
        "Compare Medicare Advantage plans in your county at medicare.gov/plan-compare."
      );
      items.push(
        "Verify your specific doctors are in-network before selecting a plan — networks change annually."
      );
      if (inputs.coverage_type !== "none") {
        items.push(
          "Request a Certificate of Creditable Coverage from your current insurer."
        );
      }
      break;

    default:
      items.push(
        "Enroll in Parts A & B at ssa.gov during your Initial Enrollment Period."
      );
      break;
  }

  items.push(
    "Bring this memo to your free SHIP counselor for a 15-minute review. Find yours at shiphelp.org."
  );

  return items;
}

const WHAT_YOU_LEARNED = [
  "Why Medicare timing matters — missing your enrollment window results in permanent late-enrollment penalties.",
  "How IRMAA works — Medicare uses your tax return from 2 years ago, and higher income means higher Part B and Part D premiums.",
  "The Medicare Secondary Payer rules — employer size determines whether employer insurance or Medicare pays first.",
  "The difference between Original Medicare + Medigap (nationwide access, predictable costs) and Medicare Advantage (lower premiums, network restrictions).",
  "The 8-month Special Enrollment Period window after employer coverage ends — and why COBRA/ACA do not provide the same protection.",
];

// ── Printable Memo ─────────────────────────────────────────────────────────────

type MemoProps = {
  inputs: WizardInputs;
  results: ScenarioResults;
};

function PrintableMemo({ inputs, results }: MemoProps) {
  const rec = results.recommended
    ? results.scenarios.find((s) => s.id === results.recommended)
    : null;
  const actionItems = generateActionItems(inputs, results);
  const memoTitle = inputs.name
    ? `Medicare Decision Memo — Prepared for ${inputs.name}`
    : "Your Medicare Decision Memo";

  // IEP dates depend on birthday, which we don't collect.
  // Show the general rule so they can apply it to their situation.
  const iepNote =
    "Your Initial Enrollment Period runs from 3 months before to 3 months after the month you turn 65 (7 months total).";
  const sepNote = inputs.retiring_within_12_months
    ? "Special Enrollment Period: up to 8 months after employer coverage ends. Enroll in Part B before this window closes to avoid a permanent penalty."
    : null;

  return (
    // This section is hidden on screen and only visible when printing.
    // Track A print styles (globals.css) handle the layout for the full page.
    <div className="hidden print:block print-memo">
      {/* ── Header ── */}
      <div className="border-b-2 border-gray-800 pb-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{memoTitle}</h1>
        <p className="text-gray-500 text-sm mt-1">{formatDate()}</p>
      </div>

      {/* ── 1. Situation summary ── */}
      <section className="mb-6">
        <h2 className="text-base font-semibold text-gray-900 uppercase tracking-wide mb-2">
          Your Situation
        </h2>
        <p className="text-gray-700 text-sm leading-relaxed">
          {situationSummary(inputs)}
          {inputs.has_specific_doctors
            ? " You have specific doctors you want to keep."
            : ""}
          {inputs.has_40_credits
            ? " You qualify for premium-free Part A."
            : " You may owe a Part A premium — verify your work credits with SSA."}
        </p>
      </section>

      {/* ── 2. Recommendation ── */}
      <section className="mb-6">
        <h2 className="text-base font-semibold text-gray-900 uppercase tracking-wide mb-2">
          Recommendation
        </h2>
        {rec ? (
          <div className="border-l-4 border-gray-800 pl-4">
            <p className="font-semibold text-gray-900 text-sm">
              Scenario {rec.id}: {rec.label}
            </p>
            {rec.tagReason && (
              <p className="text-gray-700 text-sm mt-1">{rec.tagReason}</p>
            )}
          </div>
        ) : (
          <p className="text-gray-700 text-sm">
            Your situation has trade-offs in multiple directions. Review all
            three scenarios with your SHIP counselor.
          </p>
        )}
        {results.cobraAcaWarning && results.cobraAcaMessage && (
          <p className="mt-3 text-sm font-semibold text-gray-900">
            ⚠ {results.cobraAcaMessage}
          </p>
        )}
      </section>

      {/* ── 3. Cost comparison table ── */}
      <section className="mb-6">
        <h2 className="text-base font-semibold text-gray-900 uppercase tracking-wide mb-2">
          Cost Comparison
        </h2>
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="border-b border-gray-400">
              <th className="text-left py-1.5 pr-3 text-gray-600 font-medium w-28" />
              {results.scenarios.map((s) => (
                <th
                  key={s.id}
                  className={`text-left py-1.5 px-2 font-semibold ${
                    s.id === results.recommended ? "underline" : ""
                  }`}
                >
                  {s.id}: {s.label}
                  {s.id === results.recommended ? " ★" : ""}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              {
                label: "Monthly",
                render: (s: typeof results.scenarios[0]) => fmt(s.monthlyTotal),
              },
              {
                label: "Annual",
                render: (s: typeof results.scenarios[0]) => fmt(s.annualTotal),
              },
              {
                label: "IRMAA",
                render: (s: typeof results.scenarios[0]) => s.irmaaImpact,
              },
              {
                label: "Doctors",
                render: (s: typeof results.scenarios[0]) => s.doctorFreedom,
              },
            ].map((row) => (
              <tr key={row.label} className="border-b border-gray-200">
                <td className="py-1.5 pr-3 text-gray-500 font-medium text-xs uppercase tracking-wide">
                  {row.label}
                </td>
                {results.scenarios.map((s) => (
                  <td
                    key={s.id}
                    className={`py-1.5 px-2 text-xs ${
                      s.id === results.recommended ? "font-medium" : ""
                    }`}
                  >
                    {row.render(s)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {results.scenarios.find((s) => s.id === "B")?.medigapUnavailable && (
          <p className="text-xs text-gray-500 mt-2">
            * Medigap estimate not available for your state. Contact a SHIP
            counselor or insurer for a quote.
          </p>
        )}
        <p className="text-xs text-gray-400 mt-2">
          Medigap figures are state median estimates; actual quotes may vary
          20-40%. IRMAA premiums based on 2026 CMS tables.
        </p>
      </section>

      {/* ── 4. Action items ── */}
      <section className="mb-6">
        <h2 className="text-base font-semibold text-gray-900 uppercase tracking-wide mb-2">
          Action Items
        </h2>
        <ol className="space-y-2">
          {actionItems.map((item, i) => (
            <li key={i} className="flex gap-3 text-sm text-gray-800">
              <span className="mt-0.5 flex-shrink-0 w-5 h-5 border border-gray-400 rounded text-xs flex items-center justify-center text-gray-400">
                {i + 1}
              </span>
              {item}
            </li>
          ))}
        </ol>
      </section>

      {/* ── 5. Key deadlines ── */}
      <section className="mb-6">
        <h2 className="text-base font-semibold text-gray-900 uppercase tracking-wide mb-2">
          Key Deadlines
        </h2>
        <ul className="space-y-1.5 text-sm text-gray-700">
          <li>• {iepNote}</li>
          {sepNote && <li>• {sepNote}</li>}
          <li>
            • IRMAA appeal (SSA-44 form): if your income drops due to
            retirement or a qualifying life event, you can appeal to lower your
            2026 premiums.
          </li>
        </ul>
      </section>

      {/* ── 6. What you learned ── */}
      <section className="mb-6">
        <h2 className="text-base font-semibold text-gray-900 uppercase tracking-wide mb-2">
          What You Learned
        </h2>
        <ul className="space-y-1.5 text-sm text-gray-700">
          {WHAT_YOU_LEARNED.map((item, i) => (
            <li key={i}>• {item}</li>
          ))}
        </ul>
      </section>

      {/* ── Footer ── */}
      <div className="border-t border-gray-300 pt-4 mt-8">
        <p className="text-sm text-gray-600">
          <span className="font-semibold">
            Bring this memo to your SHIP counselor for a free 15-minute review.
          </span>{" "}
          SHIP (State Health Insurance Assistance Program) counselors are free,
          unbiased, and available in every state. Find yours at{" "}
          <span className="font-medium">shiphelp.org</span>.
        </p>
        <p className="text-xs text-gray-400 mt-2">
          Generated by Medicare Guidepost · Rates current for 2026 · All data
          stays in your browser — nothing was sent to any server.
        </p>
      </div>
    </div>
  );
}

// ── Main step component ────────────────────────────────────────────────────────

type ReadyState =
  | { phase: "loading" }
  | { phase: "ready"; inputs: WizardInputs; results: ScenarioResults }
  | { phase: "error"; message: string };

export function MemoStep() {
  const { state, goBack, clearAndReset } = useWizard();
  const [readyState, setReadyState] = useState<ReadyState>({ phase: "loading" });
  const [showFallback, setShowFallback] = useState(false);
  const [printed, setPrinted] = useState(false);
  // afterprint fires on both print completion AND dialog cancellation — we can't
  // distinguish them. Show a confirmation instead of auto-clearing, so a user who
  // cancels doesn't silently lose 8 steps of input.
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);
  // Ref to the afterprint listener so we can remove it on unmount if the
  // component is navigated away from before the print dialog opens.
  const afterPrintListenerRef = useRef<(() => void) | null>(null);

  // Clean up any dangling afterprint listener when component unmounts
  useEffect(() => {
    return () => {
      if (afterPrintListenerRef.current) {
        window.removeEventListener("afterprint", afterPrintListenerRef.current);
        afterPrintListenerRef.current = null;
      }
    };
  }, []);

  // 1-second "Preparing your memo..." interstitial, then compute results
  useEffect(() => {
    const timer = setTimeout(() => {
      const parsed = WizardInputsSchema.safeParse(state.inputs);
      if (!parsed.success) {
        setReadyState({
          phase: "error",
          message:
            "Some required information is missing. Please go back and complete all steps.",
        });
        return;
      }

      try {
        const results = computeScenarios(parsed.data);
        setReadyState({ phase: "ready", inputs: parsed.data, results });
      } catch {
        setReadyState({
          phase: "error",
          message:
            "Something went wrong generating your memo. Your data is saved — try refreshing.",
        });
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [state.inputs]);

  const handlePrint = () => {
    if (typeof window === "undefined") return;

    // afterprint fires on both print success AND dialog cancellation — we can't
    // distinguish the two. Show a confirmation instead of auto-clearing.
    // window.print() never throws in browsers, so no try/catch needed here.
    const onAfterPrint = () => {
      afterPrintListenerRef.current = null;
      setAwaitingConfirmation(true);
    };
    afterPrintListenerRef.current = onAfterPrint;
    window.addEventListener("afterprint", onAfterPrint, { once: true });
    window.print();
  };

  const handleConfirmPrinted = () => {
    setPrinted(true);
    clearAndReset();
  };

  if (readyState.phase === "loading") {
    return (
      <div className="flex flex-col items-center justify-center min-h-64 gap-6">
        <div
          className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"
          role="status"
          aria-label="Preparing your memo"
        />
        <div className="text-center space-y-1">
          <h2 className="text-xl font-semibold text-gray-900">
            Preparing your memo...
          </h2>
          <p className="text-gray-500 text-sm">
            Assembling your personalized decision summary.
          </p>
        </div>
      </div>
    );
  }

  if (readyState.phase === "error") {
    return (
      <div className="space-y-6">
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
          {readyState.message}
        </div>
        <button
          onClick={() => goBack()}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          ← Go back
        </button>
      </div>
    );
  }

  if (awaitingConfirmation) {
    return (
      <div className="flex flex-col items-center justify-center min-h-64 gap-5 text-center">
        <h2 className="text-xl font-semibold text-gray-900">
          Did you save your memo?
        </h2>
        <p className="text-gray-500 text-sm max-w-xs">
          If you printed or saved the PDF, we&apos;ll clear your local data to
          protect your privacy.
        </p>
        <div className="flex gap-3">
          <button
            onClick={handleConfirmPrinted}
            className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Yes, I saved it
          </button>
          <button
            onClick={() => setAwaitingConfirmation(false)}
            className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            No, go back
          </button>
        </div>
      </div>
    );
  }

  if (printed) {
    return (
      <div className="flex flex-col items-center justify-center min-h-64 gap-4 text-center">
        <span className="text-4xl" aria-hidden="true">✓</span>
        <h2 className="text-xl font-semibold text-gray-900">Memo saved!</h2>
        <p className="text-gray-600 text-sm max-w-xs">
          Your decision memo has been saved. Your local data has been cleared.
        </p>
        <p className="text-gray-500 text-sm">
          You can close this tab or start over with a new question.
        </p>
      </div>
    );
  }

  const { inputs, results } = readyState;
  const rec = results.recommended
    ? results.scenarios.find((s) => s.id === results.recommended)
    : null;

  return (
    <>
      {/* ── Screen view — hidden when printing ── */}
      <div className="print:hidden space-y-6">
        {/* "Your memo is ready" transitional screen */}
        <div className="flex flex-col items-start gap-1">
          <span className="text-green-600 font-semibold text-sm uppercase tracking-wide">
            Your memo is ready
          </span>
          <h2 className="text-2xl font-semibold text-gray-900">
            {inputs.name
              ? `Here's your plan, ${inputs.name}`
              : "Here's your Medicare decision memo"}
          </h2>
        </div>

        {/* Plain-language summary of the recommendation */}
        <div className="p-5 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
          <p className="text-gray-700 text-sm leading-relaxed">
            {situationSummary(inputs)}
          </p>
          {rec ? (
            <div className="pt-3 border-t border-gray-200">
              <p className="text-sm font-semibold text-gray-900">
                Recommendation: Scenario {rec.id} — {rec.label}
              </p>
              {rec.tagReason && (
                <p className="text-gray-600 text-sm mt-1">{rec.tagReason}</p>
              )}
            </div>
          ) : (
            <div className="pt-3 border-t border-gray-200">
              <p className="text-sm text-gray-700">
                Your situation has trade-offs. The memo includes all three
                scenarios for you to review with a SHIP counselor.
              </p>
            </div>
          )}
        </div>

        {/* What's in the memo */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2">
            Your memo includes:
          </h3>
          <ul className="space-y-1.5 text-sm text-gray-600">
            {[
              "Your situation summary",
              "Recommended scenario with rationale",
              "Side-by-side cost comparison (all 3 options)",
              "Personalized action items with next steps",
              "Key enrollment deadlines",
              "SHIP counselor referral",
            ].map((item) => (
              <li key={item} className="flex items-center gap-2">
                <span className="text-green-500 text-xs">✓</span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Print / download actions */}
        <div className="flex flex-col gap-3">
          <button
            onClick={handlePrint}
            className="flex items-center justify-center gap-2 px-6 py-3 text-base font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors"
          >
            <span aria-hidden="true">🖨</span>
            Print / Save as PDF
          </button>

          {showFallback && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-900">
              <p className="font-semibold">Printing may be blocked.</p>
              <p className="mt-1">
                Your browser may have blocked the print dialog. Try using{" "}
                <kbd className="px-1.5 py-0.5 bg-white border border-gray-300 rounded text-xs font-mono">
                  Ctrl+P
                </kbd>{" "}
                (or{" "}
                <kbd className="px-1.5 py-0.5 bg-white border border-gray-300 rounded text-xs font-mono">
                  ⌘P
                </kbd>
                ) to open the print dialog directly, then choose{" "}
                <strong>Save as PDF</strong> as the destination.
              </p>
            </div>
          )}

          {!showFallback && (
            <button
              onClick={() => setShowFallback(true)}
              className="text-sm text-gray-400 hover:text-gray-600 transition-colors text-center"
            >
              Can&apos;t print?
            </button>
          )}
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <button
            onClick={() => goBack()}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            ← Back to scenarios
          </button>
        </div>
      </div>

      {/* ── Printable memo — hidden on screen, visible only when printing ── */}
      <PrintableMemo inputs={inputs} results={results} />
    </>
  );
}
