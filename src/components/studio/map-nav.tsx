"use client";

import {
  Plus,
  Minus,
  Compass,
  Home,
  Focus,
  Map as MapIcon,
  Satellite,
  Layers,
} from "lucide-react";
import { useStudioStore } from "@/stores/studio-store";
import { CITY_PRESETS } from "@/types";
import { cn } from "@/lib/utils";
import type { BasemapStyle } from "@/types";

const BASEMAPS: { id: BasemapStyle; label: string; icon: React.ReactNode }[] = [
  { id: "hybrid", label: "Hybrid", icon: <Layers className="h-3.5 w-3.5" /> },
  {
    id: "streets",
    label: "Streets",
    icon: <MapIcon className="h-3.5 w-3.5" />,
  },
  {
    id: "satellite",
    label: "Satellite",
    icon: <Satellite className="h-3.5 w-3.5" />,
  },
];

export function MapNav({ className }: { className?: string }) {
  const requestNav = useStudioStore((s) => s.requestNav);
  const requestFlyTo = useStudioStore((s) => s.requestFlyTo);
  const setLocationLabel = useStudioStore((s) => s.setLocationLabel);
  const basemap = useStudioStore((s) => s.basemap);
  const setBasemap = useStudioStore((s) => s.setBasemap);
  const layers = useStudioStore((s) => s.layers);
  const setLayers = useStudioStore((s) => s.setLayers);
  const cameraCenter = useStudioStore((s) => s.cameraCenter);

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {/* Zoom / home / north */}
      <div className="flex flex-col overflow-hidden rounded-xl border border-white/10 bg-black/60 shadow-2xl backdrop-blur-xl">
        <NavBtn
          title="Zoom in"
          onClick={() => requestNav("zoom-in")}
          icon={<Plus className="h-4 w-4" />}
        />
        <div className="h-px bg-white/10" />
        <NavBtn
          title="Zoom out"
          onClick={() => requestNav("zoom-out")}
          icon={<Minus className="h-4 w-4" />}
        />
        <div className="h-px bg-white/10" />
        <NavBtn
          title="Reset north"
          onClick={() => requestNav("north")}
          icon={<Compass className="h-4 w-4" />}
        />
        <div className="h-px bg-white/10" />
        <NavBtn
          title="Home view"
          onClick={() => requestNav("home")}
          icon={<Home className="h-4 w-4" />}
        />
        <div className="h-px bg-white/10" />
        <NavBtn
          title="Frame selection"
          onClick={() => requestNav("selection")}
          icon={<Focus className="h-4 w-4" />}
        />
      </div>

      {/* Basemap switcher */}
      <div className="overflow-hidden rounded-xl border border-white/10 bg-black/60 p-1 shadow-2xl backdrop-blur-xl">
        <p className="px-2 pb-1 pt-1 text-[10px] font-medium uppercase tracking-wider text-white/40">
          Map style
        </p>
        {BASEMAPS.map((b) => (
          <button
            key={b.id}
            type="button"
            onClick={() => setBasemap(b.id)}
            className={cn(
              "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs transition",
              basemap === b.id
                ? "bg-sky-500/25 text-sky-100"
                : "text-white/70 hover:bg-white/10 hover:text-white"
            )}
          >
            {b.icon}
            {b.label}
          </button>
        ))}
        <label className="mt-1 flex cursor-pointer items-center justify-between gap-2 border-t border-white/10 px-2 py-2 text-[11px] text-white/65">
          Place labels
          <input
            type="checkbox"
            checked={layers.labels}
            onChange={(e) => setLayers({ labels: e.target.checked })}
            className="accent-sky-400"
          />
        </label>
      </div>

      {/* Coords HUD */}
      <div className="rounded-xl border border-white/10 bg-black/55 px-2.5 py-2 font-mono text-[10px] leading-relaxed text-white/55 backdrop-blur-xl">
        <div>{cameraCenter.lat.toFixed(4)}°N</div>
        <div>{cameraCenter.lng.toFixed(4)}°E</div>
        <div>
          {cameraCenter.height > 1000
            ? `${(cameraCenter.height / 1000).toFixed(1)} km`
            : `${Math.round(cameraCenter.height)} m`}{" "}
          alt
        </div>
      </div>
    </div>
  );
}

function NavBtn({
  title,
  onClick,
  icon,
}: {
  title: string;
  onClick: () => void;
  icon: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className="flex h-10 w-10 items-center justify-center text-white/80 transition hover:bg-white/10 hover:text-white"
    >
      {icon}
    </button>
  );
}

export function CityChips({ className }: { className?: string }) {
  const requestFlyTo = useStudioStore((s) => s.requestFlyTo);
  const setLocationLabel = useStudioStore((s) => s.setLocationLabel);

  return (
    <div
      className={cn(
        "flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none",
        className
      )}
    >
      {CITY_PRESETS.map((c) => (
        <button
          key={c.name}
          type="button"
          onClick={() => {
            requestFlyTo(c.lng, c.lat, c.height, {
              heading: 15,
              pitch: -45,
            });
            setLocationLabel(c.name);
          }}
          className="shrink-0 rounded-full border border-white/10 bg-black/50 px-3 py-1 text-[11px] font-medium text-white/75 backdrop-blur-xl transition hover:border-sky-400/40 hover:bg-sky-500/15 hover:text-white"
        >
          {c.name}
        </button>
      ))}
    </div>
  );
}
