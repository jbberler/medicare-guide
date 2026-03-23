"use client";

import { useState } from "react";
import { useWizard } from "@/components/wizard/WizardShell";
import { DeadlineStrip } from "@/components/education/DeadlineStrip";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

const VALIDATION_MSG =
  "We need this to calculate your options — it stays in your browser.";

const TIMELINE_MILESTONES = [
  { label: "Month 0", description: "Coverage ends" },
  { label: "Month 1–8", description: "Special Enrollment Period — enroll in Part B" },
  {
    label: "Month 9+",
    description: "Late enrollment penalty begins",
    isWarning: true,
  },
];

export function TimelineStep() {
  const { state, setField, advance, goBack } = useWizard();
  const inputs = state.inputs;

  const [retiringSoon, setRetiringSoon] = useState<string>(
    inputs.retiring_soon !== undefined ? String(inputs.retiring_soon) : ""
  );
  const [retirementDate, setRetirementDate] = useState<string>(
    inputs.retirement_date ?? ""
  );
  const [employerCoverageEndDate, setEmployerCoverageEndDate] = useState<string>(
    inputs.employer_coverage_end_date ?? ""
  );

  const [errors, setErrors] = useState<Record<string, string>>({});

  const isRetiringSoon = retiringSoon === "true";

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (retiringSoon === "") errs.retiring_soon = VALIDATION_MSG;
    if (isRetiringSoon && !retirementDate) {
      errs.retirement_date = VALIDATION_MSG;
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleContinue() {
    if (!validate()) return;

    setField("retiring_soon", retiringSoon === "true");
    if (isRetiringSoon && retirementDate) {
      setField("retirement_date", retirementDate);
    }
    if (employerCoverageEndDate) {
      setField("employer_coverage_end_date", employerCoverageEndDate);
    }

    advance();
  }

  const canContinue =
    retiringSoon !== "" && (!isRetiringSoon || retirementDate !== "");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold text-gray-800 mb-2">
          Understanding your enrollment window
        </h2>
        <DeadlineStrip
          heading="Your Part B enrollment window after employer coverage ends"
          milestones={TIMELINE_MILESTONES}
          warningNote="Missing the 8-month SEP means a permanent 10% penalty per year of delay."
        />
        <p className="text-xs text-gray-500 mt-1">
          The Special Enrollment Period (SEP) starts when employer coverage
          ends. Missing it means a permanent 10% penalty per year delayed.
        </p>
      </div>

      <div className="space-y-4">
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
                  name="retiring_soon"
                  value={opt.value}
                  checked={retiringSoon === opt.value}
                  onChange={() => {
                    setRetiringSoon(opt.value);
                    setErrors((prev) => ({ ...prev, retiring_soon: "" }));
                    if (opt.value === "false") {
                      setRetirementDate("");
                    }
                  }}
                  className="accent-indigo-600"
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

        {isRetiringSoon && (
          <Input
            id="retirement_date"
            label="Expected retirement date"
            type="date"
            value={retirementDate}
            onChange={(e) => {
              setRetirementDate(e.target.value);
              setErrors((prev) => ({ ...prev, retirement_date: "" }));
            }}
            error={errors.retirement_date}
          />
        )}

        <Input
          id="employer_coverage_end_date"
          label="When does your employer coverage end? (optional)"
          type="date"
          value={employerCoverageEndDate}
          onChange={(e) => setEmployerCoverageEndDate(e.target.value)}
        />
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
