import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, beforeEach } from "vitest";
import { useSound } from "./useSound";
import { SOUND_SETTINGS_STORAGE_KEY } from "../sound/soundSettings";

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

describe("useSound", () => {
  let memoryStorage: MemoryStorage;

  beforeEach(() => {
    memoryStorage = new MemoryStorage();
  });

  it("initializes with unmuted state by default and allows toggling", () => {
    const { result } = renderHook(() => useSound(memoryStorage));

    expect(result.current.isMuted).toBe(false);

    act(() => {
      result.current.toggleMute();
    });

    expect(result.current.isMuted).toBe(true);
    expect(memoryStorage.getItem(SOUND_SETTINGS_STORAGE_KEY)).toBe("true");

    act(() => {
      result.current.toggleMute();
    });

    expect(result.current.isMuted).toBe(false);
    expect(memoryStorage.getItem(SOUND_SETTINGS_STORAGE_KEY)).toBe("false");
  });

  it("safely invokes sound playback functions without error when unmuted or muted", () => {
    const { result } = renderHook(() => useSound(memoryStorage));

    expect(() => {
      result.current.playKeypress();
      result.current.playError();
      result.current.playStopCompleted();
      result.current.playJourneyCompleted();
    }).not.toThrow();

    act(() => {
      result.current.toggleMute();
    });

    expect(() => {
      result.current.playKeypress();
      result.current.playError();
      result.current.playStopCompleted();
      result.current.playJourneyCompleted();
    }).not.toThrow();
  });
});
