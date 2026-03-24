"use client";

import { useWizard } from "./WizardShell";
import { ProgressRail } from "./ProgressRail";
import { MobileProgress } from "./MobileProgress";

interface WizardAppShellProps {
  children: React.ReactNode;
}

/**
 * Inner layout rendered inside WizardShell.
 *
 * Step 1 (Welcome): full-width, no rail, no mobile header.
 * Steps 2–8: two-zone desktop layout (280px rail + fluid main) and
 *            mobile sticky header + pull-up summary sheet.
 */
export function WizardAppShell({ children }: WizardAppShellProps) {
  const { state } = useWizard();
  const showShell = state.currentStep > 1;

  if (!showShell) {
    return <>{children}</>;
  }

  return (
    <>
      <MobileProgress />
      <div className="flex flex-1 min-h-0">
        {/* Left rail — desktop only, hidden on mobile and in print */}
        <aside className="hidden md:flex w-[280px] shrink-0 flex-col border-r border-gray-200 bg-gray-50 print:hidden">
          <ProgressRail />
        </aside>

        {/* Main content pane */}
        <main className="flex-1 min-w-0 overflow-y-auto" id="wizard-main">
          <div className="max-w-2xl mx-auto px-8 py-8">
            {children}
          </div>
        </main>
      </div>
    </>
  );
}
