import * as turf from "@turf/turf";
import type { PolygonPoint, LatLng } from "@/types";
import { METERS_PER_ACRE_SIDE } from "@/lib/constants";

const SQ_METERS_PER_ACRE = 4046.8564224;

export function polygonToGeoJSON(points: PolygonPoint[]) {
  if (points.length < 3) return null;
  const coords = points.map((p) => [p.longitude, p.latitude] as [number, number]);
  // Close the ring
  const first = coords[0];
  const last = coords[coords.length - 1];
  if (first[0] !== last[0] || first[1] !== last[1]) {
    coords.push([first[0], first[1]]);
  }
  return turf.polygon([coords]);
}

export function calculateAreaAcres(points: PolygonPoint[]): number {
  const poly = polygonToGeoJSON(points);
  if (!poly) return 0;
  const sqMeters = turf.area(poly);
  return sqMeters / SQ_METERS_PER_ACRE;
}

export function calculateCentroid(points: PolygonPoint[]): LatLng | null {
  const poly = polygonToGeoJSON(points);
  if (!poly) {
    if (points.length === 0) return null;
    const avgLon =
      points.reduce((s, p) => s + p.longitude, 0) / points.length;
    const avgLat =
      points.reduce((s, p) => s + p.latitude, 0) / points.length;
    return { lng: avgLon, lat: avgLat };
  }
  const c = turf.centroid(poly);
  const [lng, lat] = c.geometry.coordinates;
  return { lng, lat };
}

export function calculatePerimeterMeters(points: PolygonPoint[]): number {
  if (points.length < 2) return 0;
  const coords = points.map(
    (p) => [p.longitude, p.latitude] as [number, number]
  );
  const first = coords[0];
  const last = coords[coords.length - 1];
  if (first[0] !== last[0] || first[1] !== last[1]) {
    coords.push([first[0], first[1]]);
  }
  const line = turf.lineString(coords);
  return turf.length(line, { units: "meters" });
}

/** Create a roughly square polygon of `acres` centered on a lon/lat. */
export function createSquarePolygon(
  centerLng: number,
  centerLat: number,
  acres: number
): PolygonPoint[] {
  const sideMeters = Math.sqrt(acres * SQ_METERS_PER_ACRE);
  const half = sideMeters / 2;
  const center = turf.point([centerLng, centerLat]);

  const north = turf.destination(center, half, 0, { units: "meters" });
  const south = turf.destination(center, half, 180, { units: "meters" });
  const east = turf.destination(center, half, 90, { units: "meters" });
  const west = turf.destination(center, half, -90, { units: "meters" });

  const n = north.geometry.coordinates[1];
  const s = south.geometry.coordinates[1];
  const e = east.geometry.coordinates[0];
  const w = west.geometry.coordinates[0];

  return [
    { longitude: w, latitude: s },
    { longitude: e, latitude: s },
    { longitude: e, latitude: n },
    { longitude: w, latitude: n },
  ];
}

/**
 * Estimate a uniform model scale so the footprint roughly matches acreage.
 * Assumes a reference model is ~50m wide at scale 1.
 */
export function estimateModelScale(
  acres: number,
  referenceWidthMeters = 50
): number {
  const side = Math.sqrt(acres * SQ_METERS_PER_ACRE);
  return Math.max(0.1, side / referenceWidthMeters);
}

export function haversineDistanceMeters(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): number {
  return turf.distance(
    turf.point([a.lng, a.lat]),
    turf.point([b.lng, b.lat]),
    { units: "meters" }
  );
}

export function formatAcres(acres: number): string {
  if (acres < 0.01) return "< 0.01 ac";
  if (acres < 10) return `${acres.toFixed(2)} ac`;
  if (acres < 100) return `${acres.toFixed(1)} ac`;
  return `${Math.round(acres).toLocaleString()} ac`;
}

export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(2)} km`;
}

export function randomNearbyPoint(
  lng: number,
  lat: number,
  radiusKm = 15
): { lng: number; lat: number } {
  const bearing = Math.random() * 360;
  const distance = Math.random() * radiusKm;
  const pt = turf.destination(turf.point([lng, lat]), distance, bearing, {
    units: "kilometers",
  });
  return {
    lng: pt.geometry.coordinates[0],
    lat: pt.geometry.coordinates[1],
  };
}

export { METERS_PER_ACRE_SIDE, SQ_METERS_PER_ACRE };
