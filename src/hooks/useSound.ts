import { useCallback, useState } from "react";
import {
  playErrorSound,
  playJourneyCompletedSound,
  playKeypressSound,
  playStopCompletedSound,
} from "../sound/audioSynthesizer";
import { loadSoundMuted, saveSoundMuted } from "../sound/soundSettings";

export function useSound(storage?: Pick<Storage, "getItem" | "setItem">) {
  const [isMuted, setIsMuted] = useState(() => loadSoundMuted(storage));

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      saveSoundMuted(next, storage);
      return next;
    });
  }, [storage]);

  const playKeypress = useCallback(() => {
    if (!isMuted) {
      playKeypressSound();
    }
  }, [isMuted]);

  const playError = useCallback(() => {
    if (!isMuted) {
      playErrorSound();
    }
  }, [isMuted]);

  const playStopCompleted = useCallback(() => {
    if (!isMuted) {
      playStopCompletedSound();
    }
  }, [isMuted]);

  const playJourneyCompleted = useCallback(() => {
    if (!isMuted) {
      playJourneyCompletedSound();
    }
  }, [isMuted]);

  return {
    isMuted,
    toggleMute,
    playKeypress,
    playError,
    playStopCompleted,
    playJourneyCompleted,
  };
}
