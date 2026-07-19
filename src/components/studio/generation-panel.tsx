"use client";

import { useCallback, useState } from "react";
import {
  Sparkles,
  Wand2,
  Loader2,
  Eraser,
  Pentagon,
  Share2,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useStudioStore } from "@/stores/studio-store";
import { useAuth } from "@/components/providers/auth-provider";
import {
  PROMPT_EXAMPLES,
  SURPRISE_PROMPTS,
  ACRE_PRESETS,
} from "@/types";
import {
  createSquarePolygon,
  formatAcres,
  randomNearbyPoint,
  estimateModelScale,
} from "@/lib/geo";
import { DEFAULT_CAMERA } from "@/types";
import { getShareUrl } from "@/lib/share";
import {
  canGenerateLocally,
  consumeLocalGeneration,
  getLocalQuota,
} from "@/lib/local-quota";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function GenerationPanel({ className }: { className?: string }) {
  const {
    prompt,
    setPrompt,
    polygon,
    isPolygonClosed,
    areaAcres,
    centroid,
    setPolygon,
    clearPolygon,
    setMode,
    mode,
    isGenerating,
    setGenerating,
    generationProgress,
    setGenerationProgress,
    setModelUrl,
    setModelTransform,
    setActiveGeneration,
    modelUrl,
    activeGeneration,
    locationLabel,
    isAuthenticated,
    profile,
    setShowLimitModal,
    setShowAuthModal,
    requestFlyTo,
    setLocationLabel,
  } = useStudioStore();

  const { refreshProfile } = useAuth();
  const [copied, setCopied] = useState(false);
  const [localRemaining, setLocalRemaining] = useState(
    () => getLocalQuota().remaining
  );

  const remaining = isAuthenticated
    ? (profile?.free_generations_remaining ?? 3) +
      (profile?.credit_balance ?? 0)
    : localRemaining;

  const drawPreset = (acres: number) => {
    const center = centroid ?? {
      lat: DEFAULT_CAMERA.latitude,
      lng: DEFAULT_CAMERA.longitude,
    };
    // Prefer current camera center if we had one; store doesn't track it — use centroid or default
    const pts = createSquarePolygon(center.lng, center.lat, acres);
    setPolygon(pts, true);
    setMode("navigate");
    toast.success(`Selected ~${acres} acres`);
  };

  const surpriseMe = () => {
    const promptPick =
      SURPRISE_PROMPTS[Math.floor(Math.random() * SURPRISE_PROMPTS.length)]!;
    const acres =
      ACRE_PRESETS[Math.floor(Math.random() * ACRE_PRESETS.length)]!;
    const base = {
      lng: DEFAULT_CAMERA.longitude,
      lat: DEFAULT_CAMERA.latitude,
    };
    const nearby = randomNearbyPoint(base.lng, base.lat, 40);
    const pts = createSquarePolygon(nearby.lng, nearby.lat, acres);
    setPrompt(promptPick);
    setPolygon(pts, true);
    setLocationLabel("Surprise location");
    requestFlyTo(nearby.lng, nearby.lat, 1600);
    toast.message("Surprise site ready — hit Generate!");
  };

  const pollStatus = useCallback(
    async (taskId: string, generationId: string | null) => {
      const maxAttempts = 120;
      for (let i = 0; i < maxAttempts; i++) {
        const qs = new URLSearchParams({ taskId });
        if (generationId) qs.set("generationId", generationId);
        const res = await fetch(`/api/generate/status?${qs}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Status failed");

        setGenerationProgress(
          data.progress ?? Math.min(95, i * 2),
          data.status
        );

        if (data.status === "SUCCEEDED" || data.status === "completed") {
          return data as {
            modelUrl: string;
            thumbnailUrl?: string;
          };
        }
        if (data.status === "FAILED" || data.status === "failed") {
          throw new Error(data.error || "Generation failed");
        }
        await new Promise((r) => setTimeout(r, 3000));
      }
      throw new Error("Generation timed out");
    },
    [setGenerationProgress]
  );

  const generate = async () => {
    if (!prompt.trim()) {
      toast.error("Describe what you want to build");
      return;
    }
    if (!isPolygonClosed || polygon.length < 3 || !centroid) {
      toast.error("Draw or select a land area first");
      setMode("draw");
      return;
    }

    if (isAuthenticated) {
      if (profile && remaining <= 0) {
        setShowLimitModal(true);
        return;
      }
    } else if (!canGenerateLocally()) {
      setShowLimitModal(true);
      return;
    }

    setGenerating(true);
    setGenerationProgress(5, "Sending prompt to Meshy AI…");

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt.trim(),
          polygon,
          centroid,
          areaAcres,
          locationName: locationLabel,
          // Real Meshy whenever server has MESHY_API_KEY
          demo: false,
        }),
      });
      const data = await res.json();

      if (res.status === 402) {
        setShowLimitModal(true);
        setGenerating(false);
        return;
      }
      if (!res.ok) throw new Error(data.error || "Generation failed");

      let modelUrlResult = data.modelUrl as string | null;
      const transform = data.modelTransform ?? {
        scale: estimateModelScale(areaAcres),
        heading: 0,
        heightOffset: 0,
      };

      if (data.status === "generating" && data.meshyTaskId) {
        setGenerationProgress(
          15,
          data.meshy
            ? "Meshy is sculpting your development (1–3 min)…"
            : "Building model…"
        );
        const done = await pollStatus(data.meshyTaskId, data.generationId);
        modelUrlResult = done.modelUrl;
      }

      if (!modelUrlResult) throw new Error("No model returned");

      // Consume local free gen only after success
      if (!isAuthenticated) {
        const q = consumeLocalGeneration();
        setLocalRemaining(q.remaining);
      }

      setGenerationProgress(100, "Placing on terrain…");
      setModelTransform(transform);
      setModelUrl(modelUrlResult);
      setActiveGeneration({
        id: data.generationId ?? `local-${Date.now()}`,
        user_id: profile?.id ?? "guest",
        prompt: prompt.trim(),
        share_id: data.shareId,
        polygon,
        centroid,
        area_acres: areaAcres,
        model_url: modelUrlResult,
        thumbnail_url: data.thumbnailUrl ?? null,
        meshy_task_id: data.meshyTaskId,
        status: "completed",
        model_transform: transform,
        location_name: locationLabel,
        error_message: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      await refreshProfile();
      toast.success(
        data.meshy || data.demo === false
          ? "AI development placed on the map"
          : "Development placed (demo model)"
      );
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setGenerating(false);
      setGenerationProgress(0, "");
    }
  };

  const share = async () => {
    if (!activeGeneration?.share_id) {
      toast.error("Generate something first to share");
      return;
    }
    const url = getShareUrl(activeGeneration.share_id);
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Share link copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.message(url);
    }
  };

  return (
    <div
      className={cn(
        "flex w-full max-w-md flex-col gap-3 rounded-2xl border border-white/10 bg-black/55 p-4 shadow-2xl backdrop-blur-xl",
        className
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-sky-400 to-violet-500">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">AI Development</p>
            <p className="text-[11px] text-white/50">
              {remaining} free generation{remaining === 1 ? "" : "s"} left
              {!isAuthenticated ? " · guest" : ""}
              {" · "}
              Meshy AI live
            </p>
          </div>
        </div>
        {!isAuthenticated && (
          <Button
            size="sm"
            variant="secondary"
            className="h-8 bg-white/10 text-white hover:bg-white/20"
            onClick={() => setShowAuthModal(true, "signup")}
          >
            Sign in
          </Button>
        )}
      </div>

      {/* Land tools */}
      <div className="flex flex-wrap gap-1.5">
        <Button
          size="sm"
          variant={mode === "draw" ? "default" : "secondary"}
          className={cn(
            "h-8 gap-1.5 text-xs",
            mode === "draw"
              ? "bg-sky-500 text-white hover:bg-sky-400"
              : "bg-white/10 text-white hover:bg-white/20"
          )}
          onClick={() => {
            if (isPolygonClosed) clearPolygon();
            setMode(mode === "draw" ? "navigate" : "draw");
          }}
        >
          <Pentagon className="h-3.5 w-3.5" />
          {mode === "draw" ? "Drawing…" : "Draw land"}
        </Button>
        {ACRE_PRESETS.map((a) => (
          <Button
            key={a}
            size="sm"
            variant="secondary"
            className="h-8 bg-white/10 text-xs text-white hover:bg-white/20"
            onClick={() => drawPreset(a)}
          >
            {a} ac
          </Button>
        ))}
        {(polygon.length > 0 || isPolygonClosed) && (
          <Button
            size="sm"
            variant="secondary"
            className="h-8 gap-1 bg-white/10 text-xs text-white hover:bg-white/20"
            onClick={() => {
              clearPolygon();
              setModelUrl(null);
            }}
          >
            <Eraser className="h-3.5 w-3.5" />
            Clear
          </Button>
        )}
      </div>

      {isPolygonClosed && (
        <div className="flex items-center justify-between rounded-lg bg-sky-500/15 px-3 py-2 text-xs text-sky-100">
          <span>Selected land</span>
          <Badge className="bg-sky-500/30 text-sky-100 hover:bg-sky-500/30">
            {formatAcres(areaAcres)}
          </Badge>
        </div>
      )}

      {mode === "draw" && !isPolygonClosed && (
        <p className="text-[11px] leading-relaxed text-white/55">
          Click the map to place corners. Double-click to close the polygon.
        </p>
      )}

      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        rows={3}
        placeholder="Describe your development… e.g. a modern hospital campus with glass towers and landscaped courtyards"
        className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-white/35 outline-none ring-sky-400/40 focus:ring-2"
      />

      <div className="flex flex-wrap gap-1.5">
        {PROMPT_EXAMPLES.slice(0, 6).map((ex) => (
          <button
            key={ex.label}
            type="button"
            onClick={() => setPrompt(ex.prompt)}
            className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-white/80 transition hover:border-sky-400/40 hover:bg-sky-400/10 hover:text-white"
          >
            {ex.label}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <Button
          className="h-11 flex-1 gap-2 bg-gradient-to-r from-sky-500 to-violet-500 text-white shadow-lg shadow-sky-500/25 hover:from-sky-400 hover:to-violet-400"
          disabled={isGenerating}
          onClick={generate}
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating…
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Generate with AI
            </>
          )}
        </Button>
        <Button
          variant="secondary"
          className="h-11 gap-1.5 bg-white/10 text-white hover:bg-white/20"
          disabled={isGenerating}
          onClick={surpriseMe}
          title="Random prompt + nearby land"
        >
          <Wand2 className="h-4 w-4" />
          Surprise
        </Button>
      </div>

      {isGenerating && (
        <div className="space-y-1.5">
          <Progress value={generationProgress} className="h-1.5 bg-white/10" />
          <p className="text-[11px] text-white/55">
            {useStudioStore.getState().generationStatus || "Working…"}{" "}
            {generationProgress > 0 ? `· ${Math.round(generationProgress)}%` : ""}
          </p>
        </div>
      )}

      {modelUrl && activeGeneration && (
        <Button
          variant="secondary"
          size="sm"
          className="h-9 gap-2 bg-white/10 text-white hover:bg-white/20"
          onClick={share}
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-emerald-400" />
          ) : (
            <Share2 className="h-3.5 w-3.5" />
          )}
          {copied ? "Link copied" : "Share generation"}
        </Button>
      )}
    </div>
  );
}
