import { generatedMapGeometry } from "./mapGeometry.generated";

export const vietnamMapGeometry = {
  source: generatedMapGeometry.source,
  viewBox: generatedMapGeometry.viewBox,
  fitExtent: generatedMapGeometry.fitExtent,
  projection: generatedMapGeometry.projection,
  path: generatedMapGeometry.mapPath,
  archipelagos: generatedMapGeometry.archipelagos,
} as const;
