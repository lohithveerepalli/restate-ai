"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useStudioStore } from "@/stores/studio-store";
import {
  createSquarePolygon,
  estimateModelScale,
} from "@/lib/geo";
import { DEFAULT_CAMERA } from "@/types";
import { DEMO_MODEL_URL, TOUR_STORAGE_KEY } from "@/lib/constants";
import {
  Map as MapIcon,
  Pentagon,
  Sparkles,
  Sun,
  MousePointer2,
  X,
} from "lucide-react";

const STEPS = [
  {
    title: "Fly over real land",
    body: "You're looking at photorealistic 3D terrain. Orbit with drag, zoom with scroll, and pan with right-drag — this is your canvas.",
    icon: MapIcon,
  },
  {
    title: "Select a parcel",
    body: "Draw a polygon or tap a quick acre preset. We'll calculate real area in acres on the terrain.",
    icon: Pentagon,
  },
  {
    title: "Generate with AI",
    body: "Describe a theme park, hospital, data center, or community. AI builds a 3D development and places it on your land.",
    icon: Sparkles,
  },
  {
    title: "Shape the light",
    body: "Scrub time of day for golden hour and dramatic sunsets. Toggle shadows, wireframe, and camera presets.",
    icon: Sun,
  },
  {
    title: "You're ready",
    body: "Search any place on Earth, draw land, and generate. Sign in to save history and unlock full Meshy generations.",
    icon: MousePointer2,
  },
] as const;

export function GuidedTour() {
  const showTour = useStudioStore((s) => s.showTour);
  const tourStep = useStudioStore((s) => s.tourStep);
  const setShowTour = useStudioStore((s) => s.setShowTour);
  const setTourStep = useStudioStore((s) => s.setTourStep);
  const setPolygon = useStudioStore((s) => s.setPolygon);
  const setPrompt = useStudioStore((s) => s.setPrompt);
  const setModelUrl = useStudioStore((s) => s.setModelUrl);
  const setModelTransform = useStudioStore((s) => s.setModelTransform);
  const setTimeOfDay = useStudioStore((s) => s.setTimeOfDay);
  const applyCameraPreset = useStudioStore((s) => s.applyCameraPreset);
  const requestFlyTo = useStudioStore((s) => s.requestFlyTo);
  const mapReady = useStudioStore((s) => s.mapReady);

  useEffect(() => {
    if (!showTour || !mapReady) return;

    switch (tourStep) {
      case 0:
        requestFlyTo(
          DEFAULT_CAMERA.longitude,
          DEFAULT_CAMERA.latitude,
          DEFAULT_CAMERA.height
        );
        break;
      case 1: {
        const pts = createSquarePolygon(
          DEFAULT_CAMERA.longitude,
          DEFAULT_CAMERA.latitude,
          25
        );
        setPolygon(pts, true);
        applyCameraPreset("birds-eye");
        break;
      }
      case 2: {
        setPrompt(
          "A vibrant modern theme park with roller coasters, colorful rides, and a castle entrance"
        );
        setModelTransform({
          scale: estimateModelScale(25),
          heading: 15,
          heightOffset: 0,
        });
        setModelUrl(DEMO_MODEL_URL);
        break;
      }
      case 3:
        setTimeOfDay(18);
        applyCameraPreset("golden-hour");
        break;
      case 4:
        applyCameraPreset("dramatic-sunset");
        break;
    }
  }, [
    showTour,
    tourStep,
    mapReady,
    requestFlyTo,
    setPolygon,
    setPrompt,
    setModelUrl,
    setModelTransform,
    setTimeOfDay,
    applyCameraPreset,
  ]);

  const finish = () => {
    setShowTour(false);
    try {
      localStorage.setItem(TOUR_STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }
  };

  const next = () => {
    if (tourStep >= STEPS.length - 1) finish();
    else setTourStep(tourStep + 1);
  };

  const back = () => {
    if (tourStep > 0) setTourStep(tourStep - 1);
  };

  const step = STEPS[tourStep]!;
  const Icon = step.icon;

  return (
    <AnimatePresence>
      {showTour && (
        <motion.div
          className="pointer-events-none fixed inset-0 z-50 flex items-end justify-center p-4 pb-8 sm:items-center sm:pb-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="pointer-events-none absolute inset-0 bg-black/35" />

          <motion.div
            key={tourStep}
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className="pointer-events-auto relative w-full max-w-md overflow-hidden rounded-2xl border border-white/15 bg-zinc-950/90 p-5 shadow-2xl backdrop-blur-2xl"
          >
            <button
              type="button"
              onClick={finish}
              className="absolute right-3 top-3 rounded-lg p-1.5 text-white/40 hover:bg-white/10 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-sky-400 to-violet-500 shadow-lg shadow-sky-500/30">
                <Icon className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wider text-sky-300/80">
                  Step {tourStep + 1} of {STEPS.length}
                </p>
                <h3 className="text-lg font-semibold text-white">{step.title}</h3>
              </div>
            </div>

            <p className="mb-5 text-sm leading-relaxed text-white/70">
              {step.body}
            </p>

            <div className="mb-4 flex gap-1.5">
              {STEPS.map((_, i) => (
                <div
                  key={i}
                  className={`h-1 flex-1 rounded-full transition-colors ${
                    i <= tourStep ? "bg-sky-400" : "bg-white/15"
                  }`}
                />
              ))}
            </div>

            <div className="flex gap-2">
              <Button
                variant="secondary"
                className="bg-white/10 text-white hover:bg-white/20"
                disabled={tourStep === 0}
                onClick={back}
              >
                Back
              </Button>
              <Button
                className="flex-1 bg-gradient-to-r from-sky-500 to-violet-500 text-white hover:from-sky-400 hover:to-violet-400"
                onClick={next}
              >
                {tourStep >= STEPS.length - 1 ? "Start creating" : "Next"}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
