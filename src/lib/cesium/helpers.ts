import type { PolygonPoint } from "@/types";
import { DEFAULT_CAMERA } from "@/types";

/** Apply Julian date from hour-of-day (0–24) using today's date. */
export function setTimeFromHours(
  Cesium: typeof import("cesium"),
  clock: import("cesium").Clock,
  hours: number
) {
  const now = new Date();
  const h = Math.floor(hours);
  const m = Math.floor((hours - h) * 60);
  const s = Math.floor(((hours - h) * 60 - m) * 60);
  const d = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), h, m, s)
  );
  const julian = Cesium.JulianDate.fromDate(d);
  clock.currentTime = julian;
  clock.shouldAnimate = false;
}

export function polygonHierarchy(
  Cesium: typeof import("cesium"),
  points: PolygonPoint[]
) {
  const positions = points.map((p) =>
    Cesium.Cartesian3.fromDegrees(p.longitude, p.latitude, p.height ?? 0)
  );
  return new Cesium.PolygonHierarchy(positions);
}

export async function sampleTerrainHeight(
  Cesium: typeof import("cesium"),
  scene: import("cesium").Scene,
  lng: number,
  lat: number
): Promise<number> {
  try {
    const carto = Cesium.Cartographic.fromDegrees(lng, lat);
    // Prefer globe height sampling for photorealistic tiles
    const height = scene.sampleHeight(carto);
    if (height !== undefined && !Number.isNaN(height)) return height;

    const positions = [carto];
    if (scene.globe && scene.globe.terrainProvider) {
      const updated = await Cesium.sampleTerrainMostDetailed(
        scene.globe.terrainProvider,
        positions
      );
      return updated[0]?.height ?? 0;
    }
  } catch {
    // ignore
  }
  return 0;
}

export function defaultViewRectangle(Cesium: typeof import("cesium")) {
  return Cesium.Rectangle.fromDegrees(
    DEFAULT_CAMERA.longitude - 0.05,
    DEFAULT_CAMERA.latitude - 0.04,
    DEFAULT_CAMERA.longitude + 0.05,
    DEFAULT_CAMERA.latitude + 0.04
  );
}
