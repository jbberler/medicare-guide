import { WizardInputsBaseSchema } from "./schemas";
import type { PartialWizardInputs } from "./schemas";

const STORAGE_KEY = "medicare_guidepost_wizard";
const EXPIRY_DAYS = 30;
const EXPIRY_MS = EXPIRY_DAYS * 24 * 60 * 60 * 1000;

type StoredData = {
  inputs: PartialWizardInputs;
  savedAt: number;
};

export function saveWizardInputs(inputs: PartialWizardInputs): void {
  try {
    const data: StoredData = {
      inputs,
      savedAt: Date.now(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    // Quota exceeded — free space by removing the existing entry, then retry with
    // the real inputs. Only fall back to no-op if the retry also fails.
    try {
      localStorage.removeItem(STORAGE_KEY);
      const data: StoredData = { inputs, savedAt: Date.now() };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      console.error("localStorage: quota exceeded, progress cannot be saved", err);
    }
  }
}

export function loadWizardInputs(): PartialWizardInputs | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    let parsed: StoredData;
    try {
      parsed = JSON.parse(raw) as StoredData;
    } catch (parseErr) {
      // Corrupted JSON — reset to fresh state
      console.error("localStorage: corrupted wizard data, clearing", parseErr);
      clearWizardInputs();
      return null;
    }

    if (!parsed.savedAt || !parsed.inputs) {
      clearWizardInputs();
      return null;
    }

    // Check expiry
    if (Date.now() - parsed.savedAt > EXPIRY_MS) {
      clearWizardInputs();
      return null;
    }

    // Validate loaded data against the schema to prevent NaN propagation
    // from tampered/stale localStorage entries (e.g., type coercion errors).
    // We use the partial schema — all fields are optional at load time.
    const validated = WizardInputsBaseSchema.partial().safeParse(parsed.inputs);
    if (!validated.success) {
      console.error("localStorage: stored wizard data failed validation, clearing", validated.error);
      clearWizardInputs();
      return null;
    }

    return validated.data;
  } catch (err) {
    // localStorage unavailable (private browsing, disabled, etc.)
    console.error("localStorage: unavailable", err);
    return null;
  }
}

export function clearWizardInputs(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error("localStorage: could not clear wizard data", err);
  }
}

export function isLocalStorageAvailable(): boolean {
  try {
    const testKey = "__medicare_ls_test__";
    localStorage.setItem(testKey, "1");
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}
