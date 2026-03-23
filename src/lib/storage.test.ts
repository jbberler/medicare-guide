import { describe, it, expect, beforeEach, vi } from "vitest";
import { saveWizardInputs, loadWizardInputs, clearWizardInputs } from "./storage";

// jsdom provides localStorage but we need to reset it between tests
beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe("storage helpers", () => {
  it("fresh visit (no localStorage) → returns null", () => {
    const result = loadWizardInputs();
    expect(result).toBeNull();
  });

  it("save + retrieve → returns saved data", () => {
    const inputs = { age: 65, sex: "Male" as const };
    saveWizardInputs(inputs);
    const result = loadWizardInputs();
    expect(result).toEqual(inputs);
  });

  it("data older than 30 days → returns null (expired)", () => {
    const inputs = { age: 65 };
    saveWizardInputs(inputs);

    // Advance time by 31 days
    const thirtyOneDaysMs = 31 * 24 * 60 * 60 * 1000;
    vi.spyOn(Date, "now").mockReturnValue(Date.now() + thirtyOneDaysMs);

    const result = loadWizardInputs();
    expect(result).toBeNull();
  });

  it("localStorage unavailable (mock throw) → graceful fallback, no crash", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("localStorage disabled");
    });

    // Should not throw
    expect(() => loadWizardInputs()).not.toThrow();
    const result = loadWizardInputs();
    expect(result).toBeNull();
  });

  it("localStorage contains corrupted JSON → falls back to fresh state, no crash", () => {
    localStorage.setItem("medicare_guidepost_wizard", "{{not valid json}}");

    expect(() => loadWizardInputs()).not.toThrow();
    const result = loadWizardInputs();
    expect(result).toBeNull();
  });
});
