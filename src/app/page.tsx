"use client";

import { useWizard } from "@/components/wizard/WizardShell";
import { WelcomeStep } from "@/components/steps/WelcomeStep";
import { HouseholdStep } from "@/components/steps/HouseholdStep";
import { InsuranceStep } from "@/components/steps/InsuranceStep";
import { IncomeStep } from "@/components/steps/IncomeStep";
import { HealthStep } from "@/components/steps/HealthStep";
import { TimelineStep } from "@/components/steps/TimelineStep";
import { ScenariosStep } from "@/components/steps/ScenariosStep";
import { MemoStep } from "@/components/steps/MemoStep";

/**
 * Root page — routes to the correct wizard step based on WizardShell state.
 * All navigation is client-side; there are no URL-based step routes.
 */
export default function Home() {
  const { state } = useWizard();

  switch (state.currentStep) {
    case 1:
      return <WelcomeStep />;
    case 2:
      return <HouseholdStep />;
    case 3:
      return <InsuranceStep />;
    case 4:
      return <IncomeStep />;
    case 5:
      return <HealthStep />;
    case 6:
      return <TimelineStep />;
    case 7:
      return <ScenariosStep />;
    case 8:
      return <MemoStep />;
    default:
      return <WelcomeStep />;
  }
}
