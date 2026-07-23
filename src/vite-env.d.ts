/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_MAPBOX_ACCESS_TOKEN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface Window {
  render_game_to_text?: () => string;
  advanceTime?: (elapsedMs: number) => void;
  setJourneyProgress?: (progress: number) => void;
  setMapZoom?: (zoom: number) => void;
  resetMapView?: () => void;
  typeJourneyText?: (value: string) => void;
  resetJourneyGame?: () => void;
}
