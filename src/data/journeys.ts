import type { ProvinceJourney } from "../journey/types";
import { hueProvince } from "./hueProvince";

export const availableJourneys: readonly ProvinceJourney[] = [hueProvince];

export const journeyBySlug = new Map(
  availableJourneys.map((journey) => [journey.slug, journey]),
);
