"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Sparkles,
  Wand2,
  Loader2,
  Share2,
  Check,
  LogIn,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useStudioStore } from "@/stores/studio-store";
import { useAuth } from "@/components/providers/auth-provider";
import {
  PROMPT_EXAMPLES,
  SURPRISE_PROMPTS,
  ACRE_PRESETS,
  DEFAULT_CAMERA,
} from "@/types";
import {
  createSquarePolygon,
  formatAcres,
  randomNearbyPoint,
  estimateModelScale,
} from "@/lib/geo";
import { getShareUrl } from "@/lib/share";
import {
  canGenerateLocally,
  consumeLocalGeneration,
  getLocalQuota,
} from "@/lib/local-quota";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function GenerationPanel({ className }: { className?: string }) {
  const prompt = useStudioStore((s) => s.prompt);
  const setPrompt = useStudioStore((s) => s.setPrompt);
  const polygon = useStudioStore((s) => s.polygon);
  const isPolygonClosed = useStudioStore((s) => s.isPolygonClosed);
  const areaAcres = useStudioStore((s) => s.areaAcres);
  const centroid = useStudioStore((s) => s.centroid);
  const setPolygon = useStudioStore((s) => s.setPolygon);
  const setMode = useStudioStore((s) => s.setMode);
  const isGenerating = useStudioStore((s) => s.isGenerating);
  const setGenerating = useStudioStore((s) => s.setGenerating);
  const generationProgress = useStudioStore((s) => s.generationProgress);
  const generationStatus = useStudioStore((s) => s.generationStatus);
  const setGenerationProgress = useStudioStore((s) => s.setGenerationProgress);
  const setModelUrl = useStudioStore((s) => s.setModelUrl);
  const setModelTransform = useStudioStore((s) => s.setModelTransform);
  const setActiveGeneration = useStudioStore((s) => s.setActiveGeneration);
  const modelUrl = useStudioStore((s) => s.modelUrl);
  const activeGeneration = useStudioStore((s) => s.activeGeneration);
  const locationLabel = useStudioStore((s) => s.locationLabel);
  const isAuthenticated = useStudioStore((s) => s.isAuthenticated);
  const profile = useStudioStore((s) => s.profile);
  const setShowLimitModal = useStudioStore((s) => s.setShowLimitModal);
  const setShowAuthModal = useStudioStore((s) => s.setShowAuthModal);
  const requestFlyTo = useStudioStore((s) => s.requestFlyTo);
  const setLocationLabel = useStudioStore((s) => s.setLocationLabel);
  const cameraCenter = useStudioStore((s) => s.cameraCenter);
  const pendingAutoGenerate = useStudioStore((s) => s.pendingAutoGenerate);
  const setPendingAutoGenerate = useStudioStore(
    (s) => s.setPendingAutoGenerate
  );
  const mapReady = useStudioStore((s) => s.mapReady);

  const { refreshProfile } = useAuth();
  const [copied, setCopied] = useState(false);
  const [localRemaining, setLocalRemaining] = useState(
    () => getLocalQuota().remaining
  );

  const remaining = isAuthenticated
    ? (profile?.free_generations_remaining ?? 3) +
      (profile?.credit_balance ?? 0)
    : localRemaining;

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
          return data as { modelUrl: string; thumbnailUrl?: string };
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

  const generate = useCallback(async () => {
    if (!prompt.trim()) {
      toast.error("Describe what you want to build");
      return;
    }
    if (!isPolygonClosed || polygon.length < 3 || !centroid) {
      toast.error("Select land first — use a quick acre size or Draw");
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
          "Meshy is sculpting your development (often 1–3 min)…"
        );
        const done = await pollStatus(data.meshyTaskId, data.generationId);
        modelUrlResult = done.modelUrl;
      }

      if (!modelUrlResult) throw new Error("No model returned");

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
      toast.success("AI development placed on your land");
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setGenerating(false);
      setGenerationProgress(0, "");
    }
  }, [
    prompt,
    isPolygonClosed,
    polygon,
    centroid,
    isAuthenticated,
    profile,
    remaining,
    areaAcres,
    locationLabel,
    setMode,
    setShowLimitModal,
    setGenerating,
    setGenerationProgress,
    setModelTransform,
    setModelUrl,
    setActiveGeneration,
    pollStatus,
    refreshProfile,
  ]);

  const surpriseMe = useCallback(
    (autoGenerate = true) => {
      const promptPick =
        SURPRISE_PROMPTS[Math.floor(Math.random() * SURPRISE_PROMPTS.length)]!;
      const acres =
        ACRE_PRESETS[Math.floor(Math.random() * ACRE_PRESETS.length)]!;
      const base = {
        lng: cameraCenter.lng || DEFAULT_CAMERA.longitude,
        lat: cameraCenter.lat || DEFAULT_CAMERA.latitude,
      };
      const nearby = randomNearbyPoint(base.lng, base.lat, 25);
      const pts = createSquarePolygon(nearby.lng, nearby.lat, acres);
      setPrompt(promptPick);
      setPolygon(pts, true);
      setLocationLabel("Surprise site");
      requestFlyTo(nearby.lng, nearby.lat, 1600);
      toast.message("Surprise site ready", {
        description: autoGenerate
          ? "Generating with Meshy…"
          : "Hit Generate when ready",
      });
      if (autoGenerate) {
        setPendingAutoGenerate(true);
      }
    },
    [
      cameraCenter,
      setPrompt,
      setPolygon,
      setLocationLabel,
      requestFlyTo,
      setPendingAutoGenerate,
    ]
  );

  // Auto-generate after surprise prep once map + polygon ready
  useEffect(() => {
    if (!pendingAutoGenerate || !mapReady || isGenerating) return;
    if (!isPolygonClosed || !centroid || !prompt.trim()) return;
    setPendingAutoGenerate(false);
    const t = setTimeout(() => {
      void generate();
    }, 900);
    return () => clearTimeout(t);
  }, [
    pendingAutoGenerate,
    mapReady,
    isGenerating,
    isPolygonClosed,
    centroid,
    prompt,
    generate,
    setPendingAutoGenerate,
  ]);

  // Listen for external surprise trigger
  useEffect(() => {
    const handler = () => surpriseMe(true);
    window.addEventListener("restate-surprise", handler);
    return () => window.removeEventListener("restate-surprise", handler);
  }, [surpriseMe]);

  useEffect(() => {
    const handler = () => setLocalRemaining(getLocalQuota().remaining);
    window.addEventListener("restate-quota", handler);
    return () => window.removeEventListener("restate-quota", handler);
  }, []);

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
        "flex w-full flex-col gap-3 rounded-2xl border border-white/10 bg-black/65 p-4 shadow-2xl backdrop-blur-xl",
        className
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-sky-400 to-violet-500 shadow-lg shadow-sky-500/20">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">AI Development</p>
            <p className="text-[11px] text-white/50">
              {remaining} free left
              {!isAuthenticated ? " · guest" : ""} · Meshy live
            </p>
          </div>
        </div>
        {!isAuthenticated && (
          <Button
            size="sm"
            variant="secondary"
            className="h-8 gap-1.5 bg-white/10 text-xs text-white hover:bg-white/20"
            onClick={() => setShowAuthModal(true, "signup")}
          >
            <LogIn className="h-3.5 w-3.5" />
            Sign in
          </Button>
        )}
      </div>

      {isPolygonClosed ? (
        <div className="flex items-center justify-between rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-100">
          <span>Land selected</span>
          <span className="font-semibold tabular-nums">
            {formatAcres(areaAcres)}
          </span>
        </div>
      ) : (
        <div className="rounded-xl border border-amber-400/20 bg-amber-500/10 px-3 py-2 text-[11px] leading-relaxed text-amber-100/90">
          Select land first: use <strong>quick acre</strong> buttons or{" "}
          <strong>Draw</strong> in Land tools (left).
        </div>
      )}

      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        rows={3}
        placeholder="Describe your development… e.g. modern hospital campus with glass towers"
        className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2.5 text-sm text-white placeholder:text-white/35 outline-none ring-sky-400/40 transition focus:ring-2"
      />

      <div className="flex flex-wrap gap-1.5">
        {PROMPT_EXAMPLES.slice(0, 6).map((ex) => (
          <button
            key={ex.label}
            type="button"
            onClick={() => setPrompt(ex.prompt)}
            className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] text-white/75 transition hover:border-sky-400/40 hover:bg-sky-400/10 hover:text-white"
          >
            {ex.label}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <Button
          className="h-11 flex-1 gap-2 bg-gradient-to-r from-sky-500 to-violet-500 text-white shadow-lg shadow-sky-500/25 hover:from-sky-400 hover:to-violet-400"
          disabled={isGenerating}
          onClick={() => void generate()}
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
          className="h-11 gap-1.5 bg-white/10 px-3 text-white hover:bg-white/20"
          disabled={isGenerating}
          onClick={() => surpriseMe(true)}
          title="Random land + prompt + generate"
        >
          <Wand2 className="h-4 w-4" />
          Surprise
        </Button>
      </div>

      {isGenerating && (
        <div className="space-y-1.5">
          <Progress value={generationProgress} className="h-1.5 bg-white/10" />
          <p className="text-[11px] text-white/55">
            {generationStatus || "Working…"}
            {generationProgress > 0
              ? ` · ${Math.round(generationProgress)}%`
              : ""}
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
