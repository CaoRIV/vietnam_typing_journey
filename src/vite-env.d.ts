/// <reference types="vite/client" />

interface Window {
  render_game_to_text?: () => string;
  advanceTime?: (elapsedMs: number) => void;
  setJourneyProgress?: (progress: number) => void;
  setMapZoom?: (zoom: number) => void;
  resetMapView?: () => void;
}
