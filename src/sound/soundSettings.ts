export const SOUND_SETTINGS_STORAGE_KEY = "go-xuyen-viet.sound-settings.v1";

export function loadSoundMuted(
  storage?: Pick<Storage, "getItem">,
): boolean {
  try {
    const targetStorage =
      storage ??
      (typeof window !== "undefined" && window.localStorage
        ? window.localStorage
        : null);
    if (!targetStorage) return false;
    const value = targetStorage.getItem(SOUND_SETTINGS_STORAGE_KEY);
    return value === "true";
  } catch {
    return false;
  }
}

export function saveSoundMuted(
  isMuted: boolean,
  storage?: Pick<Storage, "setItem">,
): void {
  try {
    const targetStorage =
      storage ??
      (typeof window !== "undefined" && window.localStorage
        ? window.localStorage
        : null);
    if (!targetStorage) return;
    targetStorage.setItem(SOUND_SETTINGS_STORAGE_KEY, String(isMuted));
  } catch {
    // Ignore storage write errors in restricted environments
  }
}
