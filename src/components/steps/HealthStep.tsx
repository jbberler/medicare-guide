"use client";

import { useState } from "react";
import { useWizard } from "@/components/wizard/WizardShell";
import {
  HEALTH_STATUS_OPTIONS,
  MEDICATIONS_LEVEL_OPTIONS,
  type HealthStatus,
  type MedicationsLevel,
} from "@/lib/schemas";
import { ComparisonSnippet } from "@/components/education/ComparisonSnippet";
import { Button } from "@/components/ui/Button";

const VALIDATION_MSG =
  "We need this to calculate your options — it stays in your browser.";

const HEALTH_STATUS_LABELS: Record<HealthStatus, string> = {
  healthy: "Generally healthy",
  managing_conditions: "Managing one or more conditions",
  frequent_care: "Frequent medical care",
};

const MEDICATIONS_LEVEL_LABELS: Record<MedicationsLevel, string> = {
  none: "No regular medications",
  few_generics: "A few generics",
  specialty: "Specialty or brand-name drugs",
};

const COMPARISON_ROWS = [
  {
    label: "Doctor access",
    a: "Any Medicare-accepting doctor nationwide",
    b: "Plan network only",
  },
  {
    label: "Cost predictability",
    a: "Varies (Medigap fills gaps)",
    b: "Fixed copays, OOP cap",
  },
];

export function HealthStep() {
  const { state, setField, advance, goBack } = useWizard();
  const inputs = state.inputs;

  const [healthStatus, setHealthStatus] = useState<string>(
    inputs.health_status ?? ""
  );
  const [medicationsLevel, setMedicationsLevel] = useState<string>(
    inputs.medications_level ?? ""
  );
  const [hasSpecificDoctors, setHasSpecificDoctors] = useState<string>(
    inputs.has_specific_doctors !== undefined
      ? String(inputs.has_specific_doctors)
      : ""
  );

  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!healthStatus) errs.health_status = VALIDATION_MSG;
    if (!medicationsLevel) errs.medications_level = VALIDATION_MSG;
    if (hasSpecificDoctors === "") errs.has_specific_doctors = VALIDATION_MSG;
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleContinue() {
    if (!validate()) return;

    setField("health_status", healthStatus as HealthStatus);
    setField("medications_level", medicationsLevel as MedicationsLevel);
    setField("has_specific_doctors", hasSpecificDoctors === "true");
    advance();
  }

  const canContinue =
    healthStatus !== "" &&
    medicationsLevel !== "" &&
    hasSpecificDoctors !== "";

  return (
    <div className="space-y-6">
      <ComparisonSnippet
        headers={["Original Medicare", "Medicare Advantage"]}
        rows={COMPARISON_ROWS}
      />

      <div className="space-y-5">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-700">
            How would you describe your overall health?
          </label>
          <div className="flex flex-col gap-2">
            {HEALTH_STATUS_OPTIONS.map((status) => (
              <label
                key={status}
                className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-gray-50 transition-colors"
                style={{
                  borderColor:
                    healthStatus === status ? "#4f46e5" : "#d1d5db",
                  backgroundColor:
                    healthStatus === status ? "#eef2ff" : undefined,
                }}
              >
                <input
                  type="radio"
                  name="health_status"
                  value={status}
                  checked={healthStatus === status}
                  onChange={() => {
                    setHealthStatus(status);
                    setErrors((prev) => ({ ...prev, health_status: "" }));
                  }}
                  className="accent-indigo-600"
                />
                <span className="text-sm text-gray-800">
                  {HEALTH_STATUS_LABELS[status]}
                </span>
              </label>
            ))}
          </div>
          {errors.health_status && (
            <p className="text-xs text-red-600" role="alert">
              {errors.health_status}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-700">
            What best describes your medication use?
          </label>
          <div className="flex flex-col gap-2">
            {MEDICATIONS_LEVEL_OPTIONS.map((level) => (
              <label
                key={level}
                className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-gray-50 transition-colors"
                style={{
                  borderColor:
                    medicationsLevel === level ? "#4f46e5" : "#d1d5db",
                  backgroundColor:
                    medicationsLevel === level ? "#eef2ff" : undefined,
                }}
              >
                <input
                  type="radio"
                  name="medications_level"
                  value={level}
                  checked={medicationsLevel === level}
                  onChange={() => {
                    setMedicationsLevel(level);
                    setErrors((prev) => ({
                      ...prev,
                      medications_level: "",
                    }));
                  }}
                  className="accent-indigo-600"
                />
                <span className="text-sm text-gray-800">
                  {MEDICATIONS_LEVEL_LABELS[level]}
                </span>
              </label>
            ))}
          </div>
          {errors.medications_level && (
            <p className="text-xs text-red-600" role="alert">
              {errors.medications_level}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">
            Are specific doctors or specialists important to you?
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
                  name="has_specific_doctors"
                  value={opt.value}
                  checked={hasSpecificDoctors === opt.value}
                  onChange={() => {
                    setHasSpecificDoctors(opt.value);
                    setErrors((prev) => ({
                      ...prev,
                      has_specific_doctors: "",
                    }));
                  }}
                  className="accent-indigo-600"
                />
                <span className="text-sm text-gray-700">{opt.label}</span>
              </label>
            ))}
          </div>
          {errors.has_specific_doctors && (
            <p className="text-xs text-red-600" role="alert">
              {errors.has_specific_doctors}
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
