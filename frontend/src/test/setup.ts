import { afterEach, beforeEach } from "vitest";
import { resetProfileManagerForTests } from "../data/profileManager";

const memory = new Map<string, string>();

const storage = {
  get length() {
    return memory.size;
  },
  clear() {
    memory.clear();
  },
  getItem(key: string) {
    return memory.has(key) ? memory.get(key)! : null;
  },
  setItem(key: string, value: string) {
    memory.set(key, value);
  },
  removeItem(key: string) {
    memory.delete(key);
  },
  key(index: number) {
    return [...memory.keys()][index] ?? null;
  },
};

Object.defineProperty(globalThis, "localStorage", {
  value: storage,
  configurable: true,
});

beforeEach(() => {
  memory.clear();
  resetProfileManagerForTests();
});

afterEach(() => {
  memory.clear();
  resetProfileManagerForTests();
});
