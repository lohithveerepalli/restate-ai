"use client";

import { useState, useRef, useEffect } from "react";
import { Search, MapPin, Loader2, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useStudioStore } from "@/stores/studio-store";
import { cn } from "@/lib/utils";

interface Result {
  name: string;
  lat: number;
  lng: number;
}

export function SearchBar({ className }: { className?: string }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestFlyTo = useStudioStore((s) => s.requestFlyTo);
  const setLocationLabel = useStudioStore((s) => s.setLocationLabel);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    timer.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/geocode?q=${encodeURIComponent(query.trim())}`
        );
        const data = await res.json();
        setResults(data.results ?? []);
        setOpen(true);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 320);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [query]);

  const select = (r: Result) => {
    setQuery(r.name.split(",")[0] ?? r.name);
    setLocationLabel(r.name.split(",").slice(0, 2).join(","));
    requestFlyTo(r.lng, r.lat, 3500, { heading: 15, pitch: -50 });
    setOpen(false);
  };

  return (
    <div className={cn("relative w-full", className)}>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="Search cities, addresses, landmarks…"
          className="h-11 border-white/10 bg-black/55 pl-10 pr-10 text-white shadow-lg placeholder:text-white/40 backdrop-blur-xl focus-visible:ring-sky-400/50"
        />
        {loading ? (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-white/50" />
        ) : query ? (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setResults([]);
              setOpen(false);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      {open && results.length > 0 && (
        <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 overflow-hidden rounded-xl border border-white/10 bg-zinc-950/95 shadow-2xl backdrop-blur-xl">
          {results.map((r, i) => (
            <button
              key={`${r.lat}-${r.lng}-${i}`}
              type="button"
              onClick={() => select(r)}
              className="flex w-full items-start gap-3 px-3 py-2.5 text-left text-sm text-white/90 transition hover:bg-white/10"
            >
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-sky-400" />
              <span className="line-clamp-2">{r.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
