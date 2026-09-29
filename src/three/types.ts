export type Point2 = [number, number];
export type Polygon = { outer: Point2[]; holes: Point2[][] };
export type FloorGeometry = {
  level: number;
  elevation: number;
  wallHeight: number;
  bounds: number[];
  wallPolygons: Polygon[];
  floorPolygons?: { color: number[]; polygons: Polygon[] }[];
  slabPolygons?: Polygon[];
  ceilingPolygons?: Polygon[];
  ceilingHeight?: number;
  facadePolygons: Polygon[];
  exposedRoofPolygons?: Polygon[];
  roofPolygons?: Polygon[] | null;
  roofBaseElevation?: number;
  roofThickness?: number;
  rooms: { label: string; x: number; z: number }[];
  units: { id: string; x: number; z: number }[];
  floorImage?: { url: string; bounds: number[] };
};
export type Architecture = { floors: FloorGeometry[]; [key: string]: unknown };
export type SceneMode = "exterior" | "overview" | "walk";
export type SceneCommand =
  "forward" | "backward" | "left" | "right" | "zoomIn" | "zoomOut" | "reset";
