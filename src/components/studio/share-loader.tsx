"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";
import { useStudioStore } from "@/stores/studio-store";
import type { ModelTransform, PolygonPoint } from "@/types";
import { Loader2 } from "lucide-react";

const CesiumViewer = dynamic(
  () => import("@/components/studio/cesium-viewer"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-dvh items-center justify-center bg-[#050a14]">
        <Loader2 className="h-8 w-8 animate-spin text-sky-400" />
      </div>
    ),
  }
);

interface Props {
  polygon: PolygonPoint[];
  centroid: { lat: number; lng: number };
  modelUrl: string | null;
  modelTransform: ModelTransform;
  prompt: string;
  shareId: string;
  areaAcres: number;
}

export function ShareStudioLoader({
  polygon,
  centroid,
  modelUrl,
  modelTransform,
  prompt,
  shareId,
  areaAcres,
}: Props) {
  const setPolygon = useStudioStore((s) => s.setPolygon);
  const setModelUrl = useStudioStore((s) => s.setModelUrl);
  const setModelTransform = useStudioStore((s) => s.setModelTransform);
  const setPrompt = useStudioStore((s) => s.setPrompt);
  const setActiveGeneration = useStudioStore((s) => s.setActiveGeneration);
  const mapReady = useStudioStore((s) => s.mapReady);
  const requestFlyTo = useStudioStore((s) => s.requestFlyTo);

  useEffect(() => {
    setPolygon(polygon, true);
    setPrompt(prompt);
    setModelTransform(modelTransform);
    setActiveGeneration({
      id: shareId,
      user_id: "shared",
      prompt,
      share_id: shareId,
      polygon,
      centroid,
      area_acres: areaAcres,
      model_url: modelUrl,
      thumbnail_url: null,
      meshy_task_id: null,
      status: "completed",
      model_transform: modelTransform,
      location_name: null,
      error_message: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }, [
    polygon,
    centroid,
    modelUrl,
    modelTransform,
    prompt,
    shareId,
    areaAcres,
    setPolygon,
    setPrompt,
    setModelTransform,
    setActiveGeneration,
  ]);

  useEffect(() => {
    if (!mapReady || !modelUrl) return;
    setModelUrl(modelUrl);
    requestFlyTo(centroid.lng, centroid.lat, 1400);
  }, [mapReady, modelUrl, centroid, setModelUrl, requestFlyTo]);

  return (
    <div className="relative h-dvh w-full">
      <CesiumViewer />
    </div>
  );
}
