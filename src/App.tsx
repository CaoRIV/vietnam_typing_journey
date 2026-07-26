import { useCallback, useEffect, useState } from "react";

import { VietnamJourneyMap } from "./components/VietnamJourneyMap";
import { VietnamJourneySelector } from "./components/VietnamJourneySelector";
import { availableJourneys, journeyBySlug } from "./data/journeys";
import {
  loadJourneyProgress,
  mergeJourneyProgress,
  saveJourneyProgress,
  type JourneyProgressUpdate,
} from "./journey/progress";

const MAP_PATH = "/ban-do";

const getJourneySlug = (pathname: string) => {
  const match = pathname.match(/^\/hanh-trinh\/([^/]+)\/?$/);
  return match?.[1] ? decodeURIComponent(match[1]) : null;
};

export default function App() {
  const [pathname, setPathname] = useState(() => window.location.pathname);
  const [progress, setProgress] = useState(loadJourneyProgress);

  useEffect(() => {
    const handlePopState = () => setPathname(window.location.pathname);
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const navigate = useCallback((nextPath: string) => {
    if (window.location.pathname !== nextPath) {
      window.history.pushState({}, "", nextPath);
    }
    setPathname(nextPath);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, []);

  const handleProgressChange = useCallback(
    (update: JourneyProgressUpdate) => {
      setProgress((current) => {
        const next = mergeJourneyProgress(current, update);
        if (next !== current) saveJourneyProgress(next);
        return next;
      });
    },
    [],
  );

  const journeySlug = getJourneySlug(pathname);
  const journey = journeySlug ? journeyBySlug.get(journeySlug) : undefined;

  if (journey) {
    return (
      <VietnamJourneyMap
        journey={journey}
        onExit={() => navigate(MAP_PATH)}
        onProgressChange={handleProgressChange}
      />
    );
  }

  return (
    <VietnamJourneySelector
      journeys={availableJourneys}
      progress={progress}
      onOpenJourney={(slug) => navigate(`/hanh-trinh/${slug}`)}
    />
  );
}
