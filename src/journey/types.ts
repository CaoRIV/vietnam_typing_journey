export type RoutePoint = {
  x: number;
  y: number;
};

export type GeoCoordinates = readonly [
  longitude: number,
  latitude: number,
];

export type JourneyStop = {
  id: string;
  name: string;
  coordinates: GeoCoordinates;
  pointIndex: number;
  label: {
    x: number;
    y: number;
    anchor: "start" | "end";
  };
};

export type JourneyRoute = {
  id: string;
  name: string;
  region: string;
  geoPoints: readonly GeoCoordinates[];
  points: readonly RoutePoint[];
  stops: readonly JourneyStop[];
};

export type ContentSource = {
  label: string;
  url: string;
};

export type PlaceImage = {
  src: string;
  alt: string;
  author: string;
  license: string;
  licenseUrl: string;
  sourceUrl: string;
};

export type TourismPlace = {
  id: string;
  name: string;
  acceptedAnswers: readonly string[];
  coordinates: GeoCoordinates;
  shortDescription: string;
  image: PlaceImage;
  contentSources: readonly ContentSource[];
};

export type ProvinceJourney = {
  id: string;
  slug: string;
  name: string;
  shortName: string;
  description: string;
  center: GeoCoordinates;
  route: JourneyRoute;
  places: readonly TourismPlace[];
};
