"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/Button";

// 300ms debounce on nav buttons prevents accidental double-advances
const NAV_DEBOUNCE_MS = 300;

export interface StepNavProps {
  onContinue: () => void;
  onBack?: () => void;
  canContinue?: boolean;
  continueLabel?: string;
  backLabel?: string;
  /** Set to true on the final step to change button label */
  isLastStep?: boolean;
}

export function StepNav({
  onContinue,
  onBack,
  canContinue = true,
  continueLabel,
  backLabel = "Back",
  isLastStep = false,
}: StepNavProps) {
  const defaultContinueLabel = isLastStep ? "Finish" : "Continue";
  const resolvedContinueLabel = continueLabel ?? defaultContinueLabel;

  // Keep stable refs so the keydown handler never stales
  const continueRef = useRef(onContinue);
  continueRef.current = onContinue;
  const canContinueRef = useRef(canContinue);
  canContinueRef.current = canContinue;
  const backRef = useRef(onBack);
  backRef.current = onBack;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't hijack keyboard when focused inside an input/select/textarea
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === "input" || tag === "select" || tag === "textarea") return;

      if (e.key === "Enter" && canContinueRef.current) {
        e.preventDefault();
        continueRef.current();
      }
      if (e.key === "Escape" && backRef.current) {
        e.preventDefault();
        backRef.current();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  return (
    <div className="flex items-center gap-3 pt-6 mt-2 border-t border-gray-100">
      {onBack && (
        <Button
          variant="secondary"
          onClick={onBack}
          debounce={NAV_DEBOUNCE_MS}
          aria-label={backLabel}
        >
          ← {backLabel}
        </Button>
      )}
      <Button
        variant="primary"
        onClick={onContinue}
        disabled={!canContinue}
        debounce={NAV_DEBOUNCE_MS}
        className="ml-auto"
      >
        {isLastStep ? resolvedContinueLabel : `${resolvedContinueLabel} →`}
      </Button>
    </div>
  );
}
