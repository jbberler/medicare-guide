// Mock localStorage for tests
const localStorageData: Record<string, string> = {};

const localStorageMock = {
  getItem: (key: string): string | null => localStorageData[key] ?? null,
  setItem: (key: string, value: string): void => { localStorageData[key] = value; },
  removeItem: (key: string): void => { delete localStorageData[key]; },
  clear: (): void => { Object.keys(localStorageData).forEach((k) => delete localStorageData[k]); },
  get length(): number { return Object.keys(localStorageData).length; },
  key: (index: number): string | null => Object.keys(localStorageData)[index] ?? null,
};

Object.defineProperty(global, "localStorage", {
  value: localStorageMock,
  writable: true,
});
