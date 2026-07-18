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
} from "@/types";
import { calculateAreaAcres, calculateCentroid } from "@/lib/geo";

interface StudioState {
  // Auth / profile
  profile: Profile | null;
  isAuthenticated: boolean;
  isDemoMode: boolean;

  // Map interaction
  mode: StudioMode;
  polygon: PolygonPoint[];
  isPolygonClosed: boolean;
  areaAcres: number;
  centroid: { lat: number; lng: number } | null;
  measurePoints: PolygonPoint[];
  measureDistanceM: number;

  // Generation
  prompt: string;
  isGenerating: boolean;
  generationProgress: number;
  generationStatus: string;
  activeGeneration: Generation | null;
  generations: Generation[];
  modelTransform: ModelTransform;
  modelUrl: string | null;

  // Visualization
  timeOfDay: number; // 0–24 hours
  layers: LayerToggles;
  showTour: boolean;
  tourStep: number;
  showLimitModal: boolean;
  showHistory: boolean;
  showAuthModal: boolean;
  authModalMode: "login" | "signup";
  locationLabel: string;
  mapReady: boolean;

  // Actions
  setProfile: (profile: Profile | null) => void;
  setAuthenticated: (v: boolean) => void;
  setDemoMode: (v: boolean) => void;
  setMode: (mode: StudioMode) => void;
  setPolygon: (points: PolygonPoint[], closed?: boolean) => void;
  addPolygonPoint: (point: PolygonPoint) => void;
  closePolygon: () => void;
  clearPolygon: () => void;
  setPrompt: (prompt: string) => void;
  setGenerating: (v: boolean) => void;
  setGenerationProgress: (n: number, status?: string) => void;
  setActiveGeneration: (g: Generation | null) => void;
  setGenerations: (g: Generation[]) => void;
  setModelTransform: (t: Partial<ModelTransform>) => void;
  setModelUrl: (url: string | null) => void;
  setTimeOfDay: (h: number) => void;
  setLayers: (partial: Partial<LayerToggles>) => void;
  setShowTour: (v: boolean) => void;
  setTourStep: (n: number) => void;
  setShowLimitModal: (v: boolean) => void;
  setShowHistory: (v: boolean) => void;
  setShowAuthModal: (v: boolean, mode?: "login" | "signup") => void;
  setLocationLabel: (label: string) => void;
  setMapReady: (v: boolean) => void;
  setMeasurePoints: (pts: PolygonPoint[]) => void;
  addMeasurePoint: (pt: PolygonPoint) => void;
  clearMeasure: () => void;
  applyCameraPreset: (preset: CameraPreset) => void;
  pendingCameraPreset: CameraPreset | null;
  clearCameraPreset: () => void;
  flyToRequest: { lng: number; lat: number; height?: number } | null;
  requestFlyTo: (lng: number, lat: number, height?: number) => void;
  clearFlyTo: () => void;
}

const defaultLayers: LayerToggles = {
  model: true,
  shadows: true,
  wireframe: false,
  terrainDetails: true,
  polygon: true,
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

  prompt: "",
  isGenerating: false,
  generationProgress: 0,
  generationStatus: "",
  activeGeneration: null,
  generations: [],
  modelTransform: { scale: 1, heading: 0, heightOffset: 0 },
  modelUrl: null,

  timeOfDay: 14,
  layers: defaultLayers,
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

  setProfile: (profile) => set({ profile }),
  setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
  setDemoMode: (isDemoMode) => set({ isDemoMode }),
  setMode: (mode) => set({ mode }),

  setPolygon: (points, closed = false) => {
    const areaAcres = closed || points.length >= 3 ? calculateAreaAcres(points) : 0;
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
  setTimeOfDay: (timeOfDay) => set({ timeOfDay }),
  setLayers: (partial) =>
    set((s) => ({ layers: { ...s.layers, ...partial } })),
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

  setMeasurePoints: (measurePoints) => set({ measurePoints }),
  addMeasurePoint: (pt) => {
    const next = [...get().measurePoints, pt];
    let measureDistanceM = 0;
    if (next.length >= 2) {
      // lazy import avoided — compute simply with haversine via dynamic later in component
      measureDistanceM = get().measureDistanceM;
    }
    set({ measurePoints: next, measureDistanceM });
  },
  clearMeasure: () => set({ measurePoints: [], measureDistanceM: 0 }),

  applyCameraPreset: (pendingCameraPreset) => set({ pendingCameraPreset }),
  clearCameraPreset: () => set({ pendingCameraPreset: null }),
  requestFlyTo: (lng, lat, height) =>
    set({ flyToRequest: { lng, lat, height } }),
  clearFlyTo: () => set({ flyToRequest: null }),
}));
