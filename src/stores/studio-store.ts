"use client";

import { create } from "zustand";
import type {
  StudioMode,
  LayerToggles,
  PolygonPoint,
  ModelTransform,
  Generation,
  Profile,
  CameraPreset,
  BasemapStyle,
} from "@/types";
import { calculateAreaAcres, calculateCentroid } from "@/lib/geo";
import { DEFAULT_CAMERA } from "@/types";

interface StudioState {
  profile: Profile | null;
  isAuthenticated: boolean;
  isDemoMode: boolean;

  mode: StudioMode;
  polygon: PolygonPoint[];
  isPolygonClosed: boolean;
  areaAcres: number;
  centroid: { lat: number; lng: number } | null;
  measurePoints: PolygonPoint[];
  measureDistanceM: number;
  /** Live camera look-at center for acre presets */
  cameraCenter: { lat: number; lng: number; height: number };

  prompt: string;
  isGenerating: boolean;
  generationProgress: number;
  generationStatus: string;
  activeGeneration: Generation | null;
  generations: Generation[];
  modelTransform: ModelTransform;
  modelUrl: string | null;
  /** Auto-run generate after surprise prep */
  pendingAutoGenerate: boolean;

  timeOfDay: number;
  layers: LayerToggles;
  basemap: BasemapStyle;
  showTour: boolean;
  tourStep: number;
  showLimitModal: boolean;
  showHistory: boolean;
  showAuthModal: boolean;
  authModalMode: "login" | "signup";
  locationLabel: string;
  mapReady: boolean;

  setProfile: (profile: Profile | null) => void;
  setAuthenticated: (v: boolean) => void;
  setDemoMode: (v: boolean) => void;
  setMode: (mode: StudioMode) => void;
  setPolygon: (points: PolygonPoint[], closed?: boolean) => void;
  addPolygonPoint: (point: PolygonPoint) => void;
  undoPolygonPoint: () => void;
  closePolygon: () => void;
  clearPolygon: () => void;
  setPrompt: (prompt: string) => void;
  setGenerating: (v: boolean) => void;
  setGenerationProgress: (n: number, status?: string) => void;
  setActiveGeneration: (g: Generation | null) => void;
  setGenerations: (g: Generation[]) => void;
  setModelTransform: (t: Partial<ModelTransform>) => void;
  setModelUrl: (url: string | null) => void;
  setPendingAutoGenerate: (v: boolean) => void;
  setTimeOfDay: (h: number) => void;
  setLayers: (partial: Partial<LayerToggles>) => void;
  setBasemap: (b: BasemapStyle) => void;
  setShowTour: (v: boolean) => void;
  setTourStep: (n: number) => void;
  setShowLimitModal: (v: boolean) => void;
  setShowHistory: (v: boolean) => void;
  setShowAuthModal: (v: boolean, mode?: "login" | "signup") => void;
  setLocationLabel: (label: string) => void;
  setMapReady: (v: boolean) => void;
  setCameraCenter: (c: { lat: number; lng: number; height: number }) => void;
  setMeasurePoints: (pts: PolygonPoint[]) => void;
  addMeasurePoint: (pt: PolygonPoint) => void;
  clearMeasure: () => void;
  applyCameraPreset: (preset: CameraPreset) => void;
  pendingCameraPreset: CameraPreset | null;
  clearCameraPreset: () => void;
  flyToRequest: {
    lng: number;
    lat: number;
    height?: number;
    heading?: number;
    pitch?: number;
  } | null;
  requestFlyTo: (
    lng: number,
    lat: number,
    height?: number,
    opts?: { heading?: number; pitch?: number }
  ) => void;
  clearFlyTo: () => void;
  navAction: "zoom-in" | "zoom-out" | "home" | "north" | "selection" | null;
  requestNav: (
    a: "zoom-in" | "zoom-out" | "home" | "north" | "selection"
  ) => void;
  clearNav: () => void;
}

const defaultLayers: LayerToggles = {
  model: true,
  shadows: true,
  wireframe: false,
  terrainDetails: true,
  polygon: true,
  labels: true,
};

export const useStudioStore = create<StudioState>((set, get) => ({
  profile: null,
  isAuthenticated: false,
  isDemoMode: false,

  mode: "navigate",
  polygon: [],
  isPolygonClosed: false,
  areaAcres: 0,
  centroid: null,
  measurePoints: [],
  measureDistanceM: 0,
  cameraCenter: {
    lat: DEFAULT_CAMERA.latitude,
    lng: DEFAULT_CAMERA.longitude,
    height: DEFAULT_CAMERA.height,
  },

  prompt: "",
  isGenerating: false,
  generationProgress: 0,
  generationStatus: "",
  activeGeneration: null,
  generations: [],
  modelTransform: { scale: 1, heading: 0, heightOffset: 0 },
  modelUrl: null,
  pendingAutoGenerate: false,

  timeOfDay: 14,
  layers: defaultLayers,
  basemap: "hybrid",
  showTour: false,
  tourStep: 0,
  showLimitModal: false,
  showHistory: false,
  showAuthModal: false,
  authModalMode: "login",
  locationLabel: "Texas Hill Country",
  mapReady: false,
  pendingCameraPreset: null,
  flyToRequest: null,
  navAction: null,

  setProfile: (profile) => set({ profile }),
  setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
  setDemoMode: (isDemoMode) => set({ isDemoMode }),
  setMode: (mode) => set({ mode }),

  setPolygon: (points, closed = false) => {
    const areaAcres =
      closed || points.length >= 3 ? calculateAreaAcres(points) : 0;
    const centroid =
      closed || points.length >= 3 ? calculateCentroid(points) : null;
    set({
      polygon: points,
      isPolygonClosed: closed,
      areaAcres,
      centroid,
    });
  },

  addPolygonPoint: (point) => {
    const { polygon, isPolygonClosed } = get();
    if (isPolygonClosed) return;
    const next = [...polygon, point];
    set({
      polygon: next,
      areaAcres: next.length >= 3 ? calculateAreaAcres(next) : 0,
      centroid: next.length >= 3 ? calculateCentroid(next) : null,
    });
  },

  undoPolygonPoint: () => {
    const { polygon, isPolygonClosed } = get();
    if (isPolygonClosed) {
      set({ isPolygonClosed: false });
      return;
    }
    if (polygon.length === 0) return;
    const next = polygon.slice(0, -1);
    set({
      polygon: next,
      areaAcres: next.length >= 3 ? calculateAreaAcres(next) : 0,
      centroid: next.length >= 3 ? calculateCentroid(next) : null,
    });
  },

  closePolygon: () => {
    const { polygon } = get();
    if (polygon.length < 3) return;
    set({
      isPolygonClosed: true,
      areaAcres: calculateAreaAcres(polygon),
      centroid: calculateCentroid(polygon),
      mode: "navigate",
    });
  },

  clearPolygon: () =>
    set({
      polygon: [],
      isPolygonClosed: false,
      areaAcres: 0,
      centroid: null,
    }),

  setPrompt: (prompt) => set({ prompt }),
  setGenerating: (isGenerating) => set({ isGenerating }),
  setGenerationProgress: (generationProgress, generationStatus) =>
    set({
      generationProgress,
      ...(generationStatus !== undefined ? { generationStatus } : {}),
    }),
  setActiveGeneration: (activeGeneration) => set({ activeGeneration }),
  setGenerations: (generations) => set({ generations }),
  setModelTransform: (partial) =>
    set((s) => ({ modelTransform: { ...s.modelTransform, ...partial } })),
  setModelUrl: (modelUrl) => set({ modelUrl }),
  setPendingAutoGenerate: (pendingAutoGenerate) => set({ pendingAutoGenerate }),
  setTimeOfDay: (timeOfDay) => set({ timeOfDay }),
  setLayers: (partial) =>
    set((s) => ({ layers: { ...s.layers, ...partial } })),
  setBasemap: (basemap) => set({ basemap }),
  setShowTour: (showTour) => set({ showTour }),
  setTourStep: (tourStep) => set({ tourStep }),
  setShowLimitModal: (showLimitModal) => set({ showLimitModal }),
  setShowHistory: (showHistory) => set({ showHistory }),
  setShowAuthModal: (showAuthModal, mode) =>
    set({
      showAuthModal,
      ...(mode ? { authModalMode: mode } : {}),
    }),
  setLocationLabel: (locationLabel) => set({ locationLabel }),
  setMapReady: (mapReady) => set({ mapReady }),
  setCameraCenter: (cameraCenter) => set({ cameraCenter }),

  setMeasurePoints: (measurePoints) => set({ measurePoints }),
  addMeasurePoint: (pt) => {
    const current = get().measurePoints;
    if (current.length >= 2) {
      set({ measurePoints: [pt], measureDistanceM: 0 });
      return;
    }
    const next = [...current, pt];
    set({ measurePoints: next });
  },
  clearMeasure: () => set({ measurePoints: [], measureDistanceM: 0 }),

  applyCameraPreset: (pendingCameraPreset) => set({ pendingCameraPreset }),
  clearCameraPreset: () => set({ pendingCameraPreset: null }),
  requestFlyTo: (lng, lat, height, opts) =>
    set({
      flyToRequest: {
        lng,
        lat,
        height,
        heading: opts?.heading,
        pitch: opts?.pitch,
      },
    }),
  clearFlyTo: () => set({ flyToRequest: null }),
  requestNav: (navAction) => set({ navAction }),
  clearNav: () => set({ navAction: null }),
}));
