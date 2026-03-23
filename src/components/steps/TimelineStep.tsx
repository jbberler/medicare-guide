"use client";

import { useState } from "react";
import { useWizard } from "@/components/wizard/WizardShell";
import { DeadlineStrip } from "@/components/education/DeadlineStrip";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

const VALIDATION_MSG =
  "We need this to calculate your options — it stays in your browser.";

const TIMELINE_EVENTS = [
  { date: "Month 0", label: "Coverage ends" },
  { date: "Month 1–8", label: "Special Enrollment Period — enroll in Part B" },
  {
    date: "Month 9+",
    label: "Late enrollment penalty begins",
    risk: true,
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
        <DeadlineStrip events={TIMELINE_EVENTS} />
        <p className="text-xs text-gray-500 mt-1">
          The Special Enrollment Period (SEP) starts when employer coverage
          ends. Missing it means a permanent 10% penalty per year delayed.
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">
            Are you planning to retire within the next 12 months?
          </label>
          <div className="flex gap-6 mt-1">
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
        </div>

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
          debounce
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
