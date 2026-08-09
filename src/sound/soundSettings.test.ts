import { describe, expect, it, beforeEach } from "vitest";
import {
  loadSoundMuted,
  saveSoundMuted,
  SOUND_SETTINGS_STORAGE_KEY,
} from "./soundSettings";

class MemoryStorage implements Storage {
  private store = new Map<string, string>();
  get length() {
    return this.store.size;
  }
  clear() {
    this.store.clear();
  }
  getItem(key: string) {
    return this.store.get(key) ?? null;
  }
  key(index: number) {
    return Array.from(this.store.keys())[index] ?? null;
  }
  removeItem(key: string) {
    this.store.delete(key);
  }
  setItem(key: string, value: string) {
    this.store.set(key, value);
  }
}

describe("soundSettings", () => {
  let memoryStorage: MemoryStorage;

  beforeEach(() => {
    memoryStorage = new MemoryStorage();
  });

  it("defaults to false (unmuted) when no value is stored", () => {
    expect(loadSoundMuted(memoryStorage)).toBe(false);
  });

  it("loads true when storage contains 'true'", () => {
    memoryStorage.setItem(SOUND_SETTINGS_STORAGE_KEY, "true");
    expect(loadSoundMuted(memoryStorage)).toBe(true);
  });

  it("loads false when storage contains 'false'", () => {
    memoryStorage.setItem(SOUND_SETTINGS_STORAGE_KEY, "false");
    expect(loadSoundMuted(memoryStorage)).toBe(false);
  });

  it("saves sound muted state to storage correctly", () => {
    saveSoundMuted(true, memoryStorage);
    expect(memoryStorage.getItem(SOUND_SETTINGS_STORAGE_KEY)).toBe("true");

    saveSoundMuted(false, memoryStorage);
    expect(memoryStorage.getItem(SOUND_SETTINGS_STORAGE_KEY)).toBe("false");
  });
});
