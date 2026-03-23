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
  const [retiringSoon, setRetiringSoon] = useState<string>(
    inputs.retiring_soon !== undefined ? String(inputs.retiring_soon) : ""
  );

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showRedirectInterstitial, setShowRedirectInterstitial] = useState(false);

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!irmaaBracket) errs.irmaa_bracket = VALIDATION_MSG;
    if (retiringSoon === "") errs.retiring_soon = VALIDATION_MSG;
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function commitAndAdvance() {
    setField("irmaa_bracket", irmaaBracket as IrmaaBracket);
    setField("retiring_soon", retiringSoon === "true");
    advance();
  }

  function handleContinue() {
    if (!validate()) return;

    // Graceful redirect check — only for users who explicitly indicated non-employer coverage.
    // Guard: coverage_type must be set (not undefined from a skipped step).
    const coverageType = inputs.coverage_type;
    if (coverageType && coverageType !== "employer_group" && irmaaBracket === "base") {
      setShowRedirectInterstitial(true);
      return;
    }

    commitAndAdvance();
  }

  const canContinue = irmaaBracket !== "" && retiringSoon !== "";

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
          <Button variant="primary" onClick={commitAndAdvance} debounce={300}>
            Continue anyway →
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <NumberExample
        heading="How IRMAA affects your Medicare premiums"
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
          placeholder="Select your income bracket…"
          options={IRMAA_BRACKET_OPTIONS}
          value={irmaaBracket}
          onChange={(e) => {
            setIrmaaBracket(e.target.value);
            setErrors((prev) => ({ ...prev, irmaa_bracket: "" }));
          }}
          error={errors.irmaa_bracket}
        />

        <fieldset className="flex flex-col gap-1 border-0 p-0 m-0">
          <legend className="text-sm font-medium text-gray-700">
            Are you planning to retire within the next 12 months?
          </legend>
          <div className="flex gap-6 mt-1">
            {[
              { value: "true", label: "Yes" },
              { value: "false", label: "No" },
            ].map((opt) => (
              <label
                key={opt.value}
                className="flex items-center gap-2 cursor-pointer min-h-[44px]"
              >
                <input
                  type="radio"
                  name="retiring_soon_income"
                  value={opt.value}
                  checked={retiringSoon === opt.value}
                  onChange={() => {
                    setRetiringSoon(opt.value);
                    setErrors((prev) => ({ ...prev, retiring_soon: "" }));
                  }}
                  className="accent-indigo-600 focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-1"
                />
                <span className="text-sm text-gray-700">{opt.label}</span>
              </label>
            ))}
          </div>
          {errors.retiring_soon && (
            <p className="text-xs text-red-600" role="alert">
              {errors.retiring_soon}
            </p>
          )}
        </fieldset>
      </div>

      <div className="flex justify-between pt-2">
        <Button variant="ghost" onClick={goBack}>
          Back
        </Button>
        <Button
          variant="primary"
          onClick={handleContinue}
          disabled={!canContinue}
          debounce={300}
        >
          Continue
        </Button>
      </div>
    </div>
  );
}

