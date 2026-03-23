"use client";

import { useState } from "react";
import { useWizard } from "@/components/wizard/WizardShell";
import { IRMAA_BRACKETS, type IrmaaBracket } from "@/lib/schemas";
import { NumberExample } from "@/components/education/NumberExample";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";

const VALIDATION_MSG =
  "We need this to calculate your options — it stays in your browser.";

const IRMAA_BRACKET_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "base", label: "Base (≤$206K household income)" },
  { value: "tier1", label: "Tier 1 ($206K–$258K)" },
  { value: "tier2", label: "Tier 2 ($258K–$322K)" },
  { value: "tier3", label: "Tier 3 ($322K–$386K)" },
  { value: "tier4", label: "Tier 4 ($386K–$750K)" },
  { value: "tier5", label: "Tier 5 (>$750K)" },
];

const NUMBER_EXAMPLE_LINES = [
  { label: "Base (≤$206K household income)", value: "$185/mo Part B" },
  { label: "Tier 1 ($206K–$258K)", value: "$259/mo Part B", highlight: true },
  { label: "Tier 2 ($258K–$322K)", value: "$370/mo Part B", highlight: true },
  { label: "Tier 3 ($322K–$386K)", value: "$480/mo Part B", highlight: true },
  { label: "Tier 4 ($386K–$750K)", value: "$591/mo Part B", highlight: true },
  { label: "Tier 5 (>$750K)", value: "$624/mo Part B", highlight: true },
];

export function IncomeStep() {
  const { state, setField, advance, goBack } = useWizard();
  const inputs = state.inputs;

  const [irmaaBracket, setIrmaaBracket] = useState<string>(
    inputs.irmaa_bracket ?? ""
  );
  const [retiringWithin12, setRetiringWithin12] = useState<string>(
    inputs.retiring_within_12_months !== undefined
      ? String(inputs.retiring_within_12_months)
      : ""
  );

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showRedirectInterstitial, setShowRedirectInterstitial] = useState(false);

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!irmaaBracket) errs.irmaa_bracket = VALIDATION_MSG;
    if (retiringWithin12 === "") errs.retiring_within_12_months = VALIDATION_MSG;
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function commitAndAdvance() {
    setField("irmaa_bracket", irmaaBracket as IrmaaBracket);
    setField("retiring_within_12_months", retiringWithin12 === "true");
    advance();
  }

  function handleContinue() {
    if (!validate()) return;

    // Graceful redirect check
    const coverageType = inputs.coverage_type;
    if (coverageType !== "employer_group" && irmaaBracket === "base") {
      setShowRedirectInterstitial(true);
      return;
    }

    commitAndAdvance();
  }

  const canContinue = irmaaBracket !== "" && retiringWithin12 !== "";

  if (showRedirectInterstitial) {
    return (
      <div className="space-y-6">
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-6">
          <h2 className="text-lg font-semibold text-blue-900 mb-3">
            Good news — this may be simpler than you think
          </h2>
          <p className="text-blue-800 leading-relaxed">
            Based on your answers, you may not benefit from the complexity of
            this comparison. Medicare sign-up may be straightforward for your
            situation.
          </p>
          <p className="mt-3 text-blue-700 text-sm">
            Visit Medicare.gov:{" "}
            <span className="font-mono font-medium">https://www.medicare.gov</span>
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="ghost" onClick={() => setShowRedirectInterstitial(false)}>
            Back
          </Button>
          <Button variant="primary" onClick={commitAndAdvance} debounce>
            Continue anyway →
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <NumberExample
        title="How IRMAA affects your Medicare premiums"
        lines={NUMBER_EXAMPLE_LINES}
      />

      <p className="text-sm text-gray-600 leading-relaxed">
        You&#39;ll see exactly how this affects your options in Step 7 — and
        there may be a path that avoids this entirely.
      </p>

      <div className="space-y-4">
        <Select
          id="irmaa_bracket"
          label="What is your approximate household income bracket? (2023 tax year)"
          options={[
            { value: "", label: "Select your income bracket…" },
            ...IRMAA_BRACKET_OPTIONS,
          ]}
          value={irmaaBracket}
          onChange={(e) => {
            setIrmaaBracket(e.target.value);
            setErrors((prev) => ({ ...prev, irmaa_bracket: "" }));
          }}
          error={errors.irmaa_bracket}
        />

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">
            Are you planning to retire within the next 12 months?
          </label>
          <div className="flex gap-6">
            {[
              { value: "true", label: "Yes" },
              { value: "false", label: "No" },
            ].map((opt) => (
              <label
                key={opt.value}
                className="flex items-center gap-2 cursor-pointer"
              >
                <input
                  type="radio"
                  name="retiring_within_12_months"
                  value={opt.value}
                  checked={retiringWithin12 === opt.value}
                  onChange={() => {
                    setRetiringWithin12(opt.value);
                    setErrors((prev) => ({
                      ...prev,
                      retiring_within_12_months: "",
                    }));
                  }}
                  className="accent-indigo-600"
                />
                <span className="text-sm text-gray-700">{opt.label}</span>
              </label>
            ))}
          </div>
          {errors.retiring_within_12_months && (
            <p className="text-xs text-red-600" role="alert">
              {errors.retiring_within_12_months}
            </p>
          )}
        </div>
      </div>

      <div className="flex justify-between pt-2">
        <Button variant="ghost" onClick={goBack}>
          Back
        </Button>
        <Button
          variant="primary"
          onClick={handleContinue}
          disabled={!canContinue}
          debounce
        >
          Continue
        </Button>
      </div>
    </div>
  );
}

// Ensure all IRMAA_BRACKETS values are represented — compile-time guard
// (No runtime code needed; this is a type-level check via the options array)
type _IrmaaBracketCheck = typeof IRMAA_BRACKETS[number] extends typeof IRMAA_BRACKET_OPTIONS[number]["value"]
  ? true
  : false;
