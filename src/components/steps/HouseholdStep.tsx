"use client";

import { useState } from "react";
import { useWizard } from "@/components/wizard/WizardShell";
import { SEX_OPTIONS, US_STATES } from "@/lib/schemas";
import { RuleSummary } from "@/components/education/RuleSummary";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";

const VALIDATION_MSG = "We need this to calculate your options — it stays in your browser.";

const SEX_SELECT_OPTIONS = SEX_OPTIONS.map((s) => ({ value: s, label: s }));

const STATE_SELECT_OPTIONS = US_STATES.map((s) => ({ value: s, label: s }));

export function HouseholdStep() {
  const { state, setField, advance, goToStep } = useWizard();
  const inputs = state.inputs;

  const [age, setAge] = useState<string>(
    inputs.age !== undefined ? String(inputs.age) : ""
  );
  const [spouseAge, setSpouseAge] = useState<string>(
    inputs.spouse_age !== undefined ? String(inputs.spouse_age) : ""
  );
  const [sex, setSex] = useState<string>(inputs.sex ?? "");
  const [maritalStatus, setMaritalStatus] = useState<string>(
    inputs.marital_status ?? ""
  );
  const [selectedState, setSelectedState] = useState<string>(
    inputs.state ?? ""
  );
  const [has40Credits, setHas40Credits] = useState<string>(
    inputs.has_40_credits !== undefined
      ? String(inputs.has_40_credits)
      : ""
  );

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showAgeGate, setShowAgeGate] = useState(false);

  const ageNum = age !== "" ? parseInt(age, 10) : NaN;
  const isAgeGate = !isNaN(ageNum) && ageNum >= 62 && ageNum <= 64;

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!age || isNaN(parseInt(age, 10))) errs.age = VALIDATION_MSG;
    if (!sex) errs.sex = VALIDATION_MSG;
    if (!maritalStatus) errs.marital_status = VALIDATION_MSG;
    if (!selectedState) errs.state = VALIDATION_MSG;
    if (has40Credits === "") errs.has_40_credits = VALIDATION_MSG;
    if (maritalStatus === "married" && !spouseAge) {
      errs.spouse_age = VALIDATION_MSG;
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function commitFields() {
    setField("age", parseInt(age, 10));
    setField("sex", sex as typeof SEX_OPTIONS[number]);
    setField("marital_status", maritalStatus as "single" | "married");
    setField("state", selectedState as typeof US_STATES[number]);
    setField("has_40_credits", has40Credits === "true");
    if (maritalStatus === "married" && spouseAge) {
      setField("spouse_age", parseInt(spouseAge, 10));
    }
  }

  function handleContinue() {
    if (!validate()) return;

    if (isAgeGate) {
      setShowAgeGate(true);
      return;
    }

    commitFields();
    advance();
  }

  function handleAgeGateContinue() {
    commitFields();
    advance();
  }

  if (showAgeGate) {
    return (
      <div className="space-y-6">
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-6">
          <h2 className="text-lg font-semibold text-yellow-900 mb-3">
            Planning ahead?
          </h2>
          <p className="text-yellow-800 leading-relaxed">
            Medicare eligibility begins at 65. This tool is designed for people
            turning 65 soon. If you&#39;re planning ahead, you can still explore
            — but enrollment actions won&#39;t apply yet.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="ghost" onClick={() => goToStep(1)}>
            Exit
          </Button>
          <Button variant="primary" onClick={handleAgeGateContinue} debounce>
            Continue exploring
          </Button>
        </div>
      </div>
    );
  }

  const canContinue =
    age !== "" &&
    !isNaN(parseInt(age, 10)) &&
    sex !== "" &&
    maritalStatus !== "" &&
    selectedState !== "" &&
    has40Credits !== "" &&
    (maritalStatus !== "married" || spouseAge !== "");

  return (
    <div className="space-y-6">
      <RuleSummary
        rule="Your age and state affect both your Medicare eligibility and Medigap premium estimates"
        whyItMatters="Medicare eligibility starts at 65. Medigap Plan G premiums vary by state and sex, and some states have guaranteed-issue protections."
      />

      <div className="space-y-4">
        <Input
          id="age"
          label="Your age"
          type="number"
          min={62}
          max={70}
          value={age}
          onChange={(e) => {
            setAge(e.target.value);
            setErrors((prev) => ({ ...prev, age: "" }));
          }}
          error={errors.age}
          placeholder="e.g. 64"
        />

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Sex</label>
          <div className="flex flex-wrap gap-3">
            {SEX_SELECT_OPTIONS.map((opt) => (
              <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="sex"
                  value={opt.value}
                  checked={sex === opt.value}
                  onChange={() => {
                    setSex(opt.value);
                    setErrors((prev) => ({ ...prev, sex: "" }));
                  }}
                  className="accent-indigo-600"
                />
                <span className="text-sm text-gray-700">{opt.label}</span>
              </label>
            ))}
          </div>
          {errors.sex && (
            <p className="text-xs text-red-600" role="alert">
              {errors.sex}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">
            Marital status
          </label>
          <div className="flex gap-6">
            {(["single", "married"] as const).map((opt) => (
              <label key={opt} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="marital_status"
                  value={opt}
                  checked={maritalStatus === opt}
                  onChange={() => {
                    setMaritalStatus(opt);
                    setErrors((prev) => ({ ...prev, marital_status: "" }));
                    if (opt === "single") setSpouseAge("");
                  }}
                  className="accent-indigo-600"
                />
                <span className="text-sm text-gray-700 capitalize">{opt}</span>
              </label>
            ))}
          </div>
          {errors.marital_status && (
            <p className="text-xs text-red-600" role="alert">
              {errors.marital_status}
            </p>
          )}
        </div>

        {maritalStatus === "married" && (
          <Input
            id="spouse_age"
            label="Spouse's age"
            type="number"
            min={0}
            max={120}
            value={spouseAge}
            onChange={(e) => {
              setSpouseAge(e.target.value);
              setErrors((prev) => ({ ...prev, spouse_age: "" }));
            }}
            error={errors.spouse_age}
            placeholder="e.g. 63"
          />
        )}

        <Select
          id="state"
          label="State of residence"
          options={[
            { value: "", label: "Select a state…" },
            ...STATE_SELECT_OPTIONS,
          ]}
          value={selectedState}
          onChange={(e) => {
            setSelectedState(e.target.value);
            setErrors((prev) => ({ ...prev, state: "" }));
          }}
          error={errors.state}
        />

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">
            Do you have 40+ quarters of work credits (10+ years working)?
          </label>
          <p className="text-xs text-gray-500">
            Most people do. If you&#39;re not sure, check your Social Security
            statement at ssa.gov.
          </p>
          <div className="flex gap-6 mt-1">
            {[
              { value: "true", label: "Yes" },
              { value: "false", label: "No" },
            ].map((opt) => (
              <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="has_40_credits"
                  value={opt.value}
                  checked={has40Credits === opt.value}
                  onChange={() => {
                    setHas40Credits(opt.value);
                    setErrors((prev) => ({ ...prev, has_40_credits: "" }));
                  }}
                  className="accent-indigo-600"
                />
                <span className="text-sm text-gray-700">{opt.label}</span>
              </label>
            ))}
          </div>
          {errors.has_40_credits && (
            <p className="text-xs text-red-600" role="alert">
              {errors.has_40_credits}
            </p>
          )}
        </div>
      </div>

      <div className="flex justify-between pt-2">
        <Button variant="ghost" onClick={() => goToStep(1)}>
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
