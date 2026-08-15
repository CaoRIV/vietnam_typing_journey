import type { ProvinceJourney } from "../journey/types";
import { daNangProvince } from "./daNangProvince";
import { hueProvince } from "./hueProvince";

export const availableJourneys: readonly ProvinceJourney[] = [
  hueProvince,
  daNangProvince,
];

export const journeyBySlug = new Map(
  availableJourneys.map((journey) => [journey.slug, journey]),
);
