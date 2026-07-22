import fs from "node:fs";
import path from "node:path";

const SOURCE_URL =
  "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_admin_0_countries_vnm.geojson";
const OUTPUT_PATH = path.resolve("src/data/vietnam-boundary.geo.json");

const response = await fetch(SOURCE_URL);
if (!response.ok) {
  throw new Error(`Natural Earth download failed: ${response.status} ${response.statusText}`);
}

const collection = await response.json();
const feature = collection.features.find((candidate) => {
  const properties = candidate.properties ?? {};
  return (
    properties.ADM0_A3 === "VNM" ||
    properties.SOV_A3 === "VNM" ||
    properties.ISO_A3 === "VNM" ||
    properties.NAME_EN === "Vietnam" ||
    properties.ADMIN === "Vietnam"
  );
});

if (!feature) {
  throw new Error("Vietnam feature was not found in Natural Earth countries_vnm.");
}

const output = {
  type: "Feature",
  properties: {
    name: "Vietnam",
    source: "Natural Earth 1:10m Admin 0 Countries, Vietnam point of view",
    sourceUrl: SOURCE_URL,
    license: "Public domain",
  },
  geometry: feature.geometry,
};

fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
fs.writeFileSync(OUTPUT_PATH, `${JSON.stringify(output)}\n`);
console.log(`Saved ${feature.geometry.type} geometry to ${OUTPUT_PATH}`);
