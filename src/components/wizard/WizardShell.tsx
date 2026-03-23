"use client";

import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import type { PartialWizardInputs } from "@/lib/schemas";
import {
  saveWizardInputs,
  loadWizardInputs,
  clearWizardInputs,
  isLocalStorageAvailable,
} from "@/lib/storage";

export const TOTAL_STEPS = 8;

// Fields that depend on upstream answers — when an upstream field changes,
// these downstream fields should be cleared to prevent stale state.
const DOWNSTREAM_DEPENDENCIES: Record<string, Array<keyof PartialWizardInputs>> = {
  coverage_type: [
    "employer_holder",
    "employer_size_20_plus",
    "employer_premium",
    "employer_coverage_end_date",
  ],
  retiring_soon: ["retirement_date"],
  marital_status: ["spouse_age"],
};

export type WizardState = {
  currentStep: number;
  inputs: PartialWizardInputs;
  completedSteps: Set<number>;
  showResumeBanner: boolean;
  storageAvailable: boolean;
  // storageCorrupted: reserved for future banner — storage.ts currently handles
  // corruption internally (resets to null). Wire up when the banner UI is built.
  storageCorrupted: boolean;
  isPrivateBrowsing: boolean;
};

type WizardAction =
  | { type: "SET_FIELD"; field: keyof PartialWizardInputs; value: PartialWizardInputs[keyof PartialWizardInputs] }
  | { type: "ADVANCE" }
  | { type: "GO_BACK" }
  | { type: "GO_TO_STEP"; step: number }
  | { type: "RESET" }
  | { type: "HYDRATE_FROM_STORAGE"; inputs: PartialWizardInputs }
  | { type: "DISMISS_RESUME_BANNER" }
  | { type: "SET_STORAGE_STATUS"; available: boolean; isPrivateBrowsing: boolean };

function clearDependentFields(
  inputs: PartialWizardInputs,
  changedField: keyof PartialWizardInputs
): PartialWizardInputs {
  const deps = DOWNSTREAM_DEPENDENCIES[changedField as string];
  if (!deps || deps.length === 0) return inputs;

  const updated = { ...inputs };
  for (const dep of deps) {
    delete updated[dep];
  }
  return updated;
}

function wizardReducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case "SET_FIELD": {
      const updatedInputs = clearDependentFields(
        { ...state.inputs, [action.field]: action.value },
        action.field
      );
      return { ...state, inputs: updatedInputs };
    }

    case "ADVANCE": {
      const nextStep = Math.min(state.currentStep + 1, TOTAL_STEPS);
      const completedSteps = new Set(state.completedSteps);
      completedSteps.add(state.currentStep);
      return { ...state, currentStep: nextStep, completedSteps };
    }

    case "GO_BACK": {
      const prevStep = Math.max(state.currentStep - 1, 1);
      return { ...state, currentStep: prevStep };
    }

    case "GO_TO_STEP": {
      const clampedStep = Math.max(1, Math.min(action.step, TOTAL_STEPS));
      return { ...state, currentStep: clampedStep };
    }

    case "RESET": {
      return {
        ...initialState,
        storageAvailable: state.storageAvailable,
        isPrivateBrowsing: state.isPrivateBrowsing,
      };
    }

    case "HYDRATE_FROM_STORAGE": {
      return {
        ...state,
        inputs: action.inputs,
        showResumeBanner: true,
      };
    }

    case "DISMISS_RESUME_BANNER": {
      return { ...state, showResumeBanner: false };
    }

    case "SET_STORAGE_STATUS": {
      return {
        ...state,
        storageAvailable: action.available,
        isPrivateBrowsing: action.isPrivateBrowsing,
      };
    }

    default:
      return state;
  }
}

const initialState: WizardState = {
  currentStep: 1,
  inputs: {},
  completedSteps: new Set(),
  showResumeBanner: false,
  storageAvailable: true,
  storageCorrupted: false,
  isPrivateBrowsing: false,
};

type WizardContextValue = {
  state: WizardState;
  setField: (field: keyof PartialWizardInputs, value: PartialWizardInputs[keyof PartialWizardInputs]) => void;
  advance: () => void;
  goBack: () => void;
  goToStep: (step: number) => void;
  reset: () => void;
  dismissResumeBanner: () => void;
  clearAndReset: () => void;
};

const WizardContext = createContext<WizardContextValue | null>(null);

export function useWizard(): WizardContextValue {
  const ctx = useContext(WizardContext);
  if (!ctx) {
    throw new Error("useWizard must be used within a WizardShell");
  }
  return ctx;
}

type WizardShellProps = {
  children: ReactNode;
};

export function WizardShell({ children }: WizardShellProps) {
  const [state, dispatch] = useReducer(wizardReducer, initialState);

  // On mount: check localStorage availability and hydrate saved state
  useEffect(() => {
    const available = isLocalStorageAvailable();
    // Heuristic: if localStorage is unavailable, assume private browsing mode.
    // True private-browsing detection (navigator.storage quota) is a v2 improvement.
    const isPrivateBrowsing = !available;

    dispatch({
      type: "SET_STORAGE_STATUS",
      available,
      isPrivateBrowsing,
    });

    if (available) {
      const saved = loadWizardInputs();
      if (saved && Object.keys(saved).length > 0) {
        dispatch({ type: "HYDRATE_FROM_STORAGE", inputs: saved });
      }
    }
  }, []);

  // Auto-save inputs to localStorage on every state change
  useEffect(() => {
    if (state.storageAvailable && Object.keys(state.inputs).length > 0) {
      saveWizardInputs(state.inputs);
    }
  }, [state.inputs, state.storageAvailable]);

  const setField = useCallback(
    (
      field: keyof PartialWizardInputs,
      value: PartialWizardInputs[keyof PartialWizardInputs]
    ) => {
      dispatch({ type: "SET_FIELD", field, value });
    },
    []
  );

  const advance = useCallback(() => dispatch({ type: "ADVANCE" }), []);
  const goBack = useCallback(() => dispatch({ type: "GO_BACK" }), []);
  const goToStep = useCallback(
    (step: number) => dispatch({ type: "GO_TO_STEP", step }),
    []
  );
  const reset = useCallback(() => dispatch({ type: "RESET" }), []);
  const dismissResumeBanner = useCallback(
    () => dispatch({ type: "DISMISS_RESUME_BANNER" }),
    []
  );

  const clearAndReset = useCallback(() => {
    clearWizardInputs();
    dispatch({ type: "RESET" });
  }, []);

  return (
    <WizardContext.Provider
      value={{
        state,
        setField,
        advance,
        goBack,
        goToStep,
        reset,
        dismissResumeBanner,
        clearAndReset,
      }}
    >
      {children}
    </WizardContext.Provider>
  );
}
