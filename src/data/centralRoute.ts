export type RoutePoint = {
  x: number;
  y: number;
};

export type JourneyStop = {
  id: string;
  name: string;
  pointIndex: number;
  label: {
    x: number;
    y: number;
    anchor: "start" | "end";
  };
};

export const centralRoutePoints: readonly RoutePoint[] = [
  { x: 178, y: 300 },
  { x: 177, y: 328 },
  { x: 189, y: 346 },
  { x: 191, y: 370 },
  { x: 174, y: 390 },
  { x: 181, y: 421 },
  { x: 190, y: 452 },
  { x: 202, y: 483 },
  { x: 214, y: 516 },
  { x: 225, y: 548 },
] as const;

export const centralRouteStops: readonly JourneyStop[] = [
  {
    id: "hue",
    name: "Huế",
    pointIndex: 0,
    label: { x: 157, y: 288, anchor: "end" },
  },
  {
    id: "hai-van",
    name: "Hải Vân",
    pointIndex: 1,
    label: { x: 158, y: 326, anchor: "end" },
  },
  {
    id: "da-nang",
    name: "Đà Nẵng",
    pointIndex: 2,
    label: { x: 210, y: 347, anchor: "start" },
  },
  {
    id: "hoi-an",
    name: "Hội An",
    pointIndex: 3,
    label: { x: 212, y: 376, anchor: "start" },
  },
  {
    id: "my-son",
    name: "Mỹ Sơn",
    pointIndex: 4,
    label: { x: 155, y: 401, anchor: "end" },
  },
  {
    id: "nha-trang",
    name: "Nha Trang",
    pointIndex: 9,
    label: { x: 246, y: 555, anchor: "start" },
  },
] as const;

export const centralRoute = {
  id: "central-heritage-prototype",
  name: "Con đường di sản",
  region: "Miền Trung",
  points: centralRoutePoints,
  stops: centralRouteStops,
} as const;

