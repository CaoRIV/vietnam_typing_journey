import { useCallback, useEffect, useState } from "react";

import { VietnamJourneyMap } from "./components/VietnamJourneyMap";
import { VietnamJourneySelector } from "./components/VietnamJourneySelector";
import { availableJourneys, journeyBySlug } from "./data/journeys";

const MAP_PATH = "/ban-do";

const getJourneySlug = (pathname: string) => {
  const match = pathname.match(/^\/hanh-trinh\/([^/]+)\/?$/);
  return match?.[1] ? decodeURIComponent(match[1]) : null;
};

export default function App() {
  const [pathname, setPathname] = useState(() => window.location.pathname);

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

  const journeySlug = getJourneySlug(pathname);
  const journey = journeySlug ? journeyBySlug.get(journeySlug) : undefined;

  if (journey) {
    return (
      <VietnamJourneyMap
        journey={journey}
        onExit={() => navigate(MAP_PATH)}
      />
    );
  }

  return (
    <VietnamJourneySelector
      journeys={availableJourneys}
      onOpenJourney={(slug) => navigate(`/hanh-trinh/${slug}`)}
    />
  );
}
