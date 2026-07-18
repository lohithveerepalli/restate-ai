"use client";

import { useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useStudioStore } from "@/stores/studio-store";
import { formatAcres } from "@/lib/geo";
import { formatDistanceToNow } from "date-fns";
import { History, MapPin, RotateCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Generation } from "@/types";

export function HistoryPanel() {
  const open = useStudioStore((s) => s.showHistory);
  const setOpen = useStudioStore((s) => s.setShowHistory);
  const generations = useStudioStore((s) => s.generations);
  const setGenerations = useStudioStore((s) => s.setGenerations);
  const setPolygon = useStudioStore((s) => s.setPolygon);
  const setModelUrl = useStudioStore((s) => s.setModelUrl);
  const setModelTransform = useStudioStore((s) => s.setModelTransform);
  const setPrompt = useStudioStore((s) => s.setPrompt);
  const setActiveGeneration = useStudioStore((s) => s.setActiveGeneration);
  const requestFlyTo = useStudioStore((s) => s.requestFlyTo);
  const isAuthenticated = useStudioStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (!open || !isAuthenticated) return;
    fetch("/api/generations")
      .then((r) => r.json())
      .then((data) => {
        if (data.generations) setGenerations(data.generations);
      })
      .catch(console.error);
  }, [open, isAuthenticated, setGenerations]);

  const reload = (g: Generation) => {
    if (g.status !== "completed" || !g.model_url) {
      toast.error("This generation is not ready to reload");
      return;
    }
    setPolygon(g.polygon, true);
    setPrompt(g.prompt);
    setModelTransform(g.model_transform ?? { scale: 1, heading: 0, heightOffset: 0 });
    setModelUrl(g.model_url);
    setActiveGeneration(g);
    requestFlyTo(g.centroid.lng, g.centroid.lat, 1200);
    setOpen(false);
    toast.success("Generation reloaded on map");
  };

  const remove = async (id: string) => {
    try {
      const res = await fetch(`/api/generations?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      setGenerations(generations.filter((g) => g.id !== id));
      toast.success("Deleted");
    } catch {
      toast.error("Could not delete");
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent className="border-white/10 bg-zinc-950 text-white sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 text-white">
            <History className="h-5 w-5 text-sky-400" />
            Generation history
          </SheetTitle>
          <SheetDescription className="text-white/55">
            Reload any past development onto the map in one click.
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="mt-4 h-[calc(100vh-8rem)] pr-3">
          {!isAuthenticated && (
            <p className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white/60">
              Sign in to save and reload your generations.
            </p>
          )}

          {isAuthenticated && generations.length === 0 && (
            <p className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white/60">
              No generations yet. Draw land and create your first development.
            </p>
          )}

          <div className="space-y-3">
            {generations.map((g) => (
              <div
                key={g.id}
                className="rounded-xl border border-white/10 bg-white/5 p-3"
              >
                <div className="mb-2 flex gap-3">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-sky-500/30 to-violet-500/30">
                    {g.thumbnail_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={g.thumbnail_url}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-lg">🏗️</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-sm font-medium text-white">
                      {g.prompt}
                    </p>
                    <p className="mt-1 flex items-center gap-1 text-[11px] text-white/45">
                      <MapPin className="h-3 w-3" />
                      {g.location_name || "Custom site"} ·{" "}
                      {formatAcres(g.area_acres)}
                    </p>
                    <p className="text-[11px] text-white/35">
                      {formatDistanceToNow(new Date(g.created_at), {
                        addSuffix: true,
                      })}{" "}
                      · {g.status}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="h-8 flex-1 gap-1.5 bg-sky-500/20 text-sky-100 hover:bg-sky-500/30"
                    onClick={() => reload(g)}
                    disabled={g.status !== "completed"}
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Reload
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-8 bg-white/10 text-white hover:bg-red-500/20"
                    onClick={() => remove(g.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
