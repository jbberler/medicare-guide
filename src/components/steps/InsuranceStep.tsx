"use client";

import { useState } from "react";
import { useWizard } from "@/components/wizard/WizardShell";
import {
  COVERAGE_TYPES,
  EMPLOYER_HOLDER_TYPES,
  type CoverageType,
  type EmployerHolder,
} from "@/lib/schemas";
import { RuleSummary } from "@/components/education/RuleSummary";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";

const VALIDATION_MSG =
  "We need this to calculate your options — it stays in your browser.";

const COVERAGE_TYPE_LABELS: Record<CoverageType, string> = {
  employer_group: "Employer group plan",
  cobra: "COBRA continuation coverage",
  aca: "ACA marketplace plan",
  none: "No current coverage",
};

const EMPLOYER_HOLDER_OPTIONS = EMPLOYER_HOLDER_TYPES.map((h) => ({
  value: h,
  label: h === "me" ? "Me" : h === "spouse" ? "My spouse" : "Both of us",
}));

export function InsuranceStep() {
  const { state, setField, advance, goBack } = useWizard();
  const inputs = state.inputs;

  const [coverageType, setCoverageType] = useState<string>(
    inputs.coverage_type ?? ""
  );
  const [employerHolder, setEmployerHolder] = useState<string>(
    inputs.employer_holder ?? ""
  );
  const [employerSize20Plus, setEmployerSize20Plus] = useState<string>(
    inputs.employer_size_20_plus !== undefined
      ? String(inputs.employer_size_20_plus)
      : ""
  );
  const [employerPremium, setEmployerPremium] = useState<string>(
    inputs.employer_premium !== undefined
      ? String(inputs.employer_premium)
      : ""
  );

  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEmployerGroup = coverageType === "employer_group";

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!coverageType) errs.coverage_type = VALIDATION_MSG;
    if (isEmployerGroup) {
      if (!employerHolder) errs.employer_holder = VALIDATION_MSG;
      if (employerSize20Plus === "") errs.employer_size_20_plus = VALIDATION_MSG;
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleContinue() {
    if (!validate()) return;

    setField("coverage_type", coverageType as CoverageType);

    if (isEmployerGroup) {
      setField("employer_holder", employerHolder as EmployerHolder);
      setField("employer_size_20_plus", employerSize20Plus === "true");
      const premiumTrimmed = employerPremium.trim();
      if (premiumTrimmed !== "") {
        const parsedPremium = parseFloat(premiumTrimmed);
        if (!isNaN(parsedPremium) && parsedPremium >= 0) {
          setField("employer_premium", parsedPremium);
        }
      }
    }

    advance();
  }

  const canContinue =
    coverageType !== "" &&
    (!isEmployerGroup ||
      (employerHolder !== "" && employerSize20Plus !== ""));

  return (
    <div className="space-y-6">
      <RuleSummary
        rule="The Medicare Secondary Payer rules depend on who holds the employer coverage and how large the employer is"
        whyItMatters="If you or your spouse has employer group coverage from an employer with 20+ employees, that coverage is primary and you can defer Part B penalty-free. COBRA and ACA coverage do NOT protect you from late-enrollment penalties."
      />

      <div className="space-y-4">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-700">
            What type of health coverage do you currently have?
          </label>
          <div className="flex flex-col gap-2">
            {COVERAGE_TYPES.map((type) => (
              <label
                key={type}
                className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-gray-50 transition-colors"
                style={{
                  borderColor:
                    coverageType === type ? "#4f46e5" : "#d1d5db",
                  backgroundColor:
                    coverageType === type ? "#eef2ff" : undefined,
                }}
              >
                <input
                  type="radio"
                  name="coverage_type"
                  value={type}
                  checked={coverageType === type}
                  onChange={() => {
                    setCoverageType(type);
                    setErrors((prev) => ({ ...prev, coverage_type: "" }));
                    // Reset employer fields if switching away
                    if (type !== "employer_group") {
                      setEmployerHolder("");
                      setEmployerSize20Plus("");
                      setEmployerPremium("");
                    }
                  }}
                  className="accent-indigo-600"
                />
                <span className="text-sm text-gray-800">
                  {COVERAGE_TYPE_LABELS[type]}
                </span>
              </label>
            ))}
          </div>
          {errors.coverage_type && (
            <p className="text-xs text-red-600" role="alert">
              {errors.coverage_type}
            </p>
          )}
        </div>

        {isEmployerGroup && (
          <div className="space-y-4 rounded-lg border border-indigo-100 bg-indigo-50 p-4">
            <p className="text-sm font-medium text-indigo-800">
              A few more details about your employer coverage:
            </p>

            <Select
              id="employer_holder"
              label="Who holds the employer coverage?"
              placeholder="Select…"
              options={EMPLOYER_HOLDER_OPTIONS}
              value={employerHolder}
              onChange={(e) => {
                setEmployerHolder(e.target.value);
                setErrors((prev) => ({ ...prev, employer_holder: "" }));
              }}
              error={errors.employer_holder}
            />

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">
                Does the employer have 20 or more employees?
              </label>
              <div className="flex gap-6">
                {[
                  { value: "true", label: "Yes" },
                  { value: "false", label: "No / Not sure" },
                ].map((opt) => (
                  <label
                    key={opt.value}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="employer_size_20_plus"
                      value={opt.value}
                      checked={employerSize20Plus === opt.value}
                      onChange={() => {
                        setEmployerSize20Plus(opt.value);
                        setErrors((prev) => ({
                          ...prev,
                          employer_size_20_plus: "",
                        }));
                      }}
                      className="accent-indigo-600"
                    />
                    <span className="text-sm text-gray-700">{opt.label}</span>
                  </label>
                ))}
              </div>
              {errors.employer_size_20_plus && (
                <p className="text-xs text-red-600" role="alert">
                  {errors.employer_size_20_plus}
                </p>
              )}
            </div>

            <Input
              id="employer_premium"
              label="Monthly premium you pay (optional)"
              type="number"
              min={0}
              step={0.01}
              value={employerPremium}
              onChange={(e) => setEmployerPremium(e.target.value)}
              placeholder="e.g. 250"
            />
          </div>
        )}
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
