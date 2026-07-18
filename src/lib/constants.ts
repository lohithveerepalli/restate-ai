export const APP_NAME = "Restate.ai";
export const APP_TAGLINE = "Land Development Studio";
export const APP_DESCRIPTION =
  "Select real land on a high-definition 3D map and let AI instantly design and visualize large developments — theme parks, hospitals, data centers, communities, and more.";

export const CESIUM_BASE_URL = "/cesium/";

export const MESHY_API_BASE = "https://api.meshy.ai/openapi/v2";

/** Rough meters per acre for square side length approximation */
export const METERS_PER_ACRE_SIDE = Math.sqrt(4046.8564224);

/** Demo GLB (public sample) used when Meshy is unavailable or demo mode is on */
export const DEMO_MODEL_URL =
  "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Building/glTF-Binary/Building.glb";

export const TOUR_STORAGE_KEY = "restate-tour-completed";
export const DEMO_MODE_KEY = "restate-demo-mode";
