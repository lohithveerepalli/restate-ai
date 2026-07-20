"use client";

import {
  Eye,
  Sun,
  Sunset,
  Mountain,
  Box,
  Layers,
  CloudSun,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { useStudioStore } from "@/stores/studio-store";
import type { CameraPreset } from "@/types";
import { cn } from "@/lib/utils";

function hourLabel(h: number) {
  const hr = Math.floor(h) % 24;
  const min = Math.round((h - Math.floor(h)) * 60);
  const ampm = hr >= 12 ? "PM" : "AM";
  const display = hr % 12 === 0 ? 12 : hr % 12;
  return `${display}:${min.toString().padStart(2, "0")} ${ampm}`;
}

const PRESETS: { id: CameraPreset; label: string; icon: React.ReactNode }[] = [
  { id: "birds-eye", label: "Bird's eye", icon: <Eye className="h-3.5 w-3.5" /> },
  { id: "ground", label: "Ground", icon: <Mountain className="h-3.5 w-3.5" /> },
  {
    id: "golden-hour",
    label: "Golden hour",
    icon: <Sun className="h-3.5 w-3.5" />,
  },
  {
    id: "dramatic-sunset",
    label: "Sunset",
    icon: <Sunset className="h-3.5 w-3.5" />,
  },
];

export function ViewControls({ className }: { className?: string }) {
  const timeOfDay = useStudioStore((s) => s.timeOfDay);
  const setTimeOfDay = useStudioStore((s) => s.setTimeOfDay);
  const layers = useStudioStore((s) => s.layers);
  const setLayers = useStudioStore((s) => s.setLayers);
  const applyCameraPreset = useStudioStore((s) => s.applyCameraPreset);
  const modelUrl = useStudioStore((s) => s.modelUrl);
  const modelTransform = useStudioStore((s) => s.modelTransform);
  const setModelTransform = useStudioStore((s) => s.setModelTransform);

  return (
    <div
      className={cn(
        "flex w-full max-w-xs flex-col gap-3 rounded-2xl border border-white/10 bg-black/65 p-3 shadow-2xl backdrop-blur-xl",
        className
      )}
    >
      <p className="text-[11px] font-semibold uppercase tracking-wider text-white/45">
        View & light
      </p>

      <div className="grid grid-cols-2 gap-1.5">
        {PRESETS.map((p) => (
          <Button
            key={p.id}
            size="sm"
            variant="secondary"
            className="h-8 justify-start gap-1.5 bg-white/10 text-xs text-white hover:bg-white/20"
            onClick={() => applyCameraPreset(p.id)}
          >
            {p.icon}
            {p.label}
          </Button>
        ))}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-white/70">
          <span className="flex items-center gap-1.5">
            <Sun className="h-3.5 w-3.5 text-amber-300" />
            Time of day
          </span>
          <span className="tabular-nums text-white/90">
            {hourLabel(timeOfDay)}
          </span>
        </div>
        <Slider
          value={[timeOfDay]}
          min={0}
          max={23.99}
          step={0.25}
          onValueChange={(v) => {
            const n = Array.isArray(v) ? v[0] : v;
            setTimeOfDay(typeof n === "number" ? n : 12);
          }}
          className="w-full"
        />
      </div>

      <div className="space-y-2 border-t border-white/10 pt-2">
        <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-white/45">
          <Layers className="h-3 w-3" /> Layers
        </p>
        {(
          [
            ["model", "Generated model", Box],
            ["shadows", "Shadows", CloudSun],
            ["wireframe", "Wireframe", Layers],
            ["polygon", "Selection", Mountain],
            ["labels", "Place labels", Layers],
          ] as const
        ).map(([key, label, Icon]) => (
          <label
            key={key}
            className="flex cursor-pointer items-center justify-between text-xs text-white/80"
          >
            <span className="flex items-center gap-1.5">
              <Icon className="h-3.5 w-3.5 text-white/40" />
              {label}
            </span>
            <Switch
              checked={layers[key]}
              onCheckedChange={(v) => setLayers({ [key]: v })}
            />
          </label>
        ))}
      </div>

      {modelUrl && (
        <div className="space-y-2 border-t border-white/10 pt-2">
          <p className="text-[11px] font-medium uppercase tracking-wider text-white/45">
            Model transform
          </p>
          {(
            [
              {
                label: "Scale",
                key: "scale" as const,
                min: 0.05,
                max: Math.max(20, modelTransform.scale * 2),
                step: 0.05,
                fmt: (n: number) => `${n.toFixed(2)}×`,
              },
              {
                label: "Rotation",
                key: "heading" as const,
                min: 0,
                max: 360,
                step: 1,
                fmt: (n: number) => `${Math.round(n)}°`,
              },
              {
                label: "Height",
                key: "heightOffset" as const,
                min: -50,
                max: 200,
                step: 0.5,
                fmt: (n: number) => `${n.toFixed(1)} m`,
              },
            ] as const
          ).map((row) => (
            <div key={row.key} className="space-y-1">
              <div className="flex justify-between text-[11px] text-white/60">
                <span>{row.label}</span>
                <span className="tabular-nums">
                  {row.fmt(modelTransform[row.key])}
                </span>
              </div>
              <Slider
                value={[modelTransform[row.key]]}
                min={row.min}
                max={row.max}
                step={row.step}
                onValueChange={(v) => {
                  const n = Array.isArray(v) ? v[0] : v;
                  if (typeof n === "number")
                    setModelTransform({ [row.key]: n });
                }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
