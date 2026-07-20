"use client";

import {
  Pentagon,
  Check,
  Undo2,
  Trash2,
  Ruler,
  MousePointer2,
  Square,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useStudioStore } from "@/stores/studio-store";
import { ACRE_PRESETS } from "@/types";
import { createSquarePolygon, formatAcres, formatDistance } from "@/lib/geo";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function DrawToolbar({ className }: { className?: string }) {
  const mode = useStudioStore((s) => s.mode);
  const setMode = useStudioStore((s) => s.setMode);
  const polygon = useStudioStore((s) => s.polygon);
  const isPolygonClosed = useStudioStore((s) => s.isPolygonClosed);
  const areaAcres = useStudioStore((s) => s.areaAcres);
  const closePolygon = useStudioStore((s) => s.closePolygon);
  const undoPolygonPoint = useStudioStore((s) => s.undoPolygonPoint);
  const clearPolygon = useStudioStore((s) => s.clearPolygon);
  const setPolygon = useStudioStore((s) => s.setPolygon);
  const cameraCenter = useStudioStore((s) => s.cameraCenter);
  const centroid = useStudioStore((s) => s.centroid);
  const measureDistanceM = useStudioStore((s) => s.measureDistanceM);
  const clearMeasure = useStudioStore((s) => s.clearMeasure);
  const setModelUrl = useStudioStore((s) => s.setModelUrl);

  const startDraw = () => {
    if (isPolygonClosed) clearPolygon();
    clearMeasure();
    setMode(mode === "draw" ? "navigate" : "draw");
    if (mode !== "draw") {
      toast.message("Draw mode", {
        description:
          "Click corners on the map. Click the green start point or Finish when done.",
      });
    }
  };

  const placeAcres = (acres: number) => {
    const center = {
      lng: cameraCenter.lng,
      lat: cameraCenter.lat,
    };
    const pts = createSquarePolygon(center.lng, center.lat, acres);
    setPolygon(pts, true);
    setMode("navigate");
    clearMeasure();
    toast.success(`Placed ~${acres} acre parcel at map center`);
  };

  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-2xl border border-white/10 bg-black/60 p-3 shadow-2xl backdrop-blur-xl",
        className
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-white/45">
          Land tools
        </p>
        {(isPolygonClosed || polygon.length > 0) && (
          <Badge className="bg-sky-500/20 text-sky-100 hover:bg-sky-500/20">
            {isPolygonClosed
              ? formatAcres(areaAcres)
              : polygon.length >= 3
                ? `~${formatAcres(areaAcres)}`
                : `${polygon.length} pts`}
          </Badge>
        )}
      </div>

      {/* Mode buttons */}
      <div className="grid grid-cols-3 gap-1.5">
        <ToolBtn
          active={mode === "navigate"}
          onClick={() => {
            setMode("navigate");
            clearMeasure();
          }}
          icon={<MousePointer2 className="h-3.5 w-3.5" />}
          label="Navigate"
        />
        <ToolBtn
          active={mode === "draw"}
          onClick={startDraw}
          icon={<Pentagon className="h-3.5 w-3.5" />}
          label="Draw"
        />
        <ToolBtn
          active={mode === "measure"}
          onClick={() => {
            if (mode === "measure") {
              clearMeasure();
              setMode("navigate");
            } else {
              clearMeasure();
              setMode("measure");
              toast.message("Measure", {
                description: "Click two points on the map",
              });
            }
          }}
          icon={<Ruler className="h-3.5 w-3.5" />}
          label="Measure"
        />
      </div>

      {/* Quick parcels at current view center */}
      <div>
        <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-white/40">
          Quick parcel at map center
        </p>
        <div className="grid grid-cols-4 gap-1.5">
          {ACRE_PRESETS.map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => placeAcres(a)}
              className="flex flex-col items-center rounded-lg border border-white/10 bg-white/5 py-2 text-xs text-white/80 transition hover:border-sky-400/40 hover:bg-sky-500/15 hover:text-white"
            >
              <Square className="mb-0.5 h-3 w-3 text-sky-400/80" />
              {a} ac
            </button>
          ))}
        </div>
      </div>

      {/* Draw actions */}
      {mode === "draw" && (
        <div className="space-y-2 rounded-xl border border-sky-400/20 bg-sky-500/10 p-2.5">
          <p className="text-[11px] leading-relaxed text-sky-100/90">
            {polygon.length === 0 &&
              "Click the map to place your first corner."}
            {polygon.length > 0 &&
              polygon.length < 3 &&
              `Corner ${polygon.length} placed — add ${3 - polygon.length} more.`}
            {polygon.length >= 3 &&
              !isPolygonClosed &&
              "Ready! Click the green start point, Finish, or double-click."}
          </p>
          <div className="flex flex-wrap gap-1.5">
            <Button
              size="sm"
              className="h-8 flex-1 gap-1 bg-emerald-500 text-white hover:bg-emerald-400"
              disabled={polygon.length < 3}
              onClick={() => {
                closePolygon();
                toast.success("Parcel closed");
              }}
            >
              <Check className="h-3.5 w-3.5" />
              Finish
            </Button>
            <Button
              size="sm"
              variant="secondary"
              className="h-8 gap-1 bg-white/10 text-white hover:bg-white/20"
              disabled={polygon.length === 0}
              onClick={() => undoPolygonPoint()}
            >
              <Undo2 className="h-3.5 w-3.5" />
              Undo
            </Button>
            <Button
              size="sm"
              variant="secondary"
              className="h-8 gap-1 bg-white/10 text-white hover:bg-white/20"
              disabled={polygon.length === 0}
              onClick={() => {
                clearPolygon();
                setModelUrl(null);
              }}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}

      {isPolygonClosed && mode !== "draw" && (
        <div className="flex items-center justify-between gap-2 rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-100">
          <span>
            Parcel ready
            {centroid
              ? ` · ${centroid.lat.toFixed(3)}, ${centroid.lng.toFixed(3)}`
              : ""}
          </span>
          <button
            type="button"
            className="text-emerald-200/80 underline-offset-2 hover:underline"
            onClick={() => {
              clearPolygon();
              setModelUrl(null);
            }}
          >
            Clear
          </button>
        </div>
      )}

      {mode === "measure" && (
        <div className="rounded-xl border border-amber-400/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
          {measureDistanceM > 0
            ? `Distance: ${formatDistance(measureDistanceM)}`
            : "Click two points on the map…"}
        </div>
      )}

      <p className="text-[10px] leading-relaxed text-white/35">
        Navigate: drag to pan · scroll zoom · right-drag tilt · Ctrl+drag orbit
      </p>
    </div>
  );
}

function ToolBtn({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1 rounded-lg border px-1 py-2 text-[10px] font-medium transition",
        active
          ? "border-sky-400/50 bg-sky-500/25 text-sky-50"
          : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
      )}
    >
      {icon}
      {label}
    </button>
  );
}
