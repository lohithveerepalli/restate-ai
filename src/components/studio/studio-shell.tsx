"use client";

import dynamic from "next/dynamic";
import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SearchBar } from "@/components/studio/search-bar";
import { GenerationPanel } from "@/components/studio/generation-panel";
import { ViewControls } from "@/components/studio/view-controls";
import { DrawToolbar } from "@/components/studio/draw-toolbar";
import { MapNav, CityChips } from "@/components/studio/map-nav";
import { GuidedTour } from "@/components/studio/guided-tour";
import { LimitModal } from "@/components/studio/limit-modal";
import { HistoryPanel } from "@/components/studio/history-panel";
import { AuthModal } from "@/components/auth/auth-modal";
import { useStudioStore } from "@/stores/studio-store";
import { useAuth } from "@/components/providers/auth-provider";
import { TOUR_STORAGE_KEY, DEMO_MODE_KEY } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import {
  History,
  LogOut,
  User,
  HelpCircle,
  Loader2,
  Wand2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const CesiumViewer = dynamic(
  () => import("@/components/studio/cesium-viewer"),
  {
    ssr: false,
    loading: () => (
      <div className="absolute inset-0 flex items-center justify-center bg-[#050a14]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-sky-400" />
          <p className="text-sm text-white/60">Loading 3D globe…</p>
        </div>
      </div>
    ),
  }
);

export function StudioShell({
  startTour = false,
  autoSurprise = false,
}: {
  startTour?: boolean;
  autoSurprise?: boolean;
}) {
  const { user, profile, signOut, loading } = useAuth();
  const setShowTour = useStudioStore((s) => s.setShowTour);
  const setTourStep = useStudioStore((s) => s.setTourStep);
  const setShowHistory = useStudioStore((s) => s.setShowHistory);
  const setShowAuthModal = useStudioStore((s) => s.setShowAuthModal);
  const setDemoMode = useStudioStore((s) => s.setDemoMode);
  const locationLabel = useStudioStore((s) => s.locationLabel);
  const mapReady = useStudioStore((s) => s.mapReady);
  const mode = useStudioStore((s) => s.mode);
  const router = useRouter();

  useEffect(() => {
    try {
      const demo = sessionStorage.getItem(DEMO_MODE_KEY) === "1";
      setDemoMode(demo);
      const done = localStorage.getItem(TOUR_STORAGE_KEY);
      if (startTour && !autoSurprise && (!done || startTour)) {
        const t = setTimeout(() => {
          setTourStep(0);
          setShowTour(true);
        }, 1000);
        return () => clearTimeout(t);
      }
    } catch {
      /* ignore */
    }
  }, [startTour, autoSurprise, loading, setDemoMode, setShowTour, setTourStep]);

  // Auto surprise generation for demos
  useEffect(() => {
    if (!autoSurprise || !mapReady) return;
    const t = setTimeout(() => {
      window.dispatchEvent(new Event("restate-surprise"));
    }, 1800);
    return () => clearTimeout(t);
  }, [autoSurprise, mapReady]);

  const initials =
    profile?.full_name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() ||
    user?.email?.[0]?.toUpperCase() ||
    "R";

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-[#050a14] text-white">
      <CesiumViewer />

      {/* Gradient vignette for readability */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-28 bg-gradient-to-b from-black/55 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-24 bg-gradient-to-t from-black/40 to-transparent" />

      {/* Top chrome */}
      <header className="pointer-events-none absolute left-0 right-0 top-0 z-20 p-3 sm:p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="pointer-events-auto flex items-center gap-2">
            <Link
              href="/"
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/55 px-3 py-2 backdrop-blur-xl transition hover:bg-black/70"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-sky-400 to-violet-500 text-xs font-bold shadow-md shadow-sky-500/30">
                R
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-semibold leading-none">Restate.ai</p>
                <p className="text-[10px] text-white/50">
                  Land Development Studio
                </p>
              </div>
            </Link>
            <div className="hidden max-w-[10rem] truncate rounded-xl border border-white/10 bg-black/45 px-3 py-2 text-xs text-white/65 backdrop-blur-xl lg:block">
              {locationLabel}
            </div>
          </div>

          <div className="pointer-events-auto min-w-0 flex-1 max-w-lg">
            <SearchBar />
            <div className="mt-2 hidden sm:block">
              <CityChips />
            </div>
          </div>

          <div className="pointer-events-auto flex items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              className="hidden h-10 gap-1.5 border border-white/10 bg-black/55 text-white backdrop-blur-xl hover:bg-white/10 sm:inline-flex"
              onClick={() => window.dispatchEvent(new Event("restate-surprise"))}
              title="Surprise me"
            >
              <Wand2 className="h-4 w-4" />
              Surprise
            </Button>
            <Button
              size="icon"
              variant="secondary"
              className="h-10 w-10 border border-white/10 bg-black/55 text-white backdrop-blur-xl hover:bg-white/10"
              onClick={() => {
                setTourStep(0);
                setShowTour(true);
              }}
              title="Tour"
            >
              <HelpCircle className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="secondary"
              className="h-10 w-10 border border-white/10 bg-black/55 text-white backdrop-blur-xl hover:bg-white/10"
              onClick={() => setShowHistory(true)}
              title="History"
            >
              <History className="h-4 w-4" />
            </Button>

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger className="rounded-full border border-white/10 outline-none ring-sky-400/40 focus-visible:ring-2">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={profile?.avatar_url ?? undefined} />
                    <AvatarFallback className="bg-sky-500/30 text-sm">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="border-white/10 bg-zinc-950 text-white"
                >
                  <div className="px-2 py-1.5 text-xs text-white/50">
                    {user.email}
                    <div className="mt-0.5 text-white/80">
                      {(profile?.free_generations_remaining ?? 0) +
                        (profile?.credit_balance ?? 0)}{" "}
                      generations left
                    </div>
                  </div>
                  <DropdownMenuSeparator className="bg-white/10" />
                  <DropdownMenuItem
                    className="gap-2 focus:bg-white/10"
                    onClick={() => setShowHistory(true)}
                  >
                    <History className="h-4 w-4" /> History
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="gap-2 focus:bg-white/10"
                    onClick={async () => {
                      await signOut();
                      router.push("/");
                    }}
                  >
                    <LogOut className="h-4 w-4" /> Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                className="h-10 gap-2 bg-white text-zinc-900 hover:bg-white/90"
                onClick={() => setShowAuthModal(true, "login")}
              >
                <User className="h-4 w-4" />
                Sign in
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Left: land tools */}
      <div className="pointer-events-none absolute bottom-4 left-3 top-auto z-20 w-[min(100%-1.5rem,20rem)] sm:left-4 sm:top-28 sm:w-72">
        <div className="pointer-events-auto flex max-h-[calc(100dvh-8rem)] flex-col gap-3 overflow-y-auto studio-scroll">
          <DrawToolbar />
          <div className="hidden lg:block">
            <GenerationPanel />
          </div>
        </div>
      </div>

      {/* Right: map nav + view */}
      <div className="pointer-events-none absolute bottom-4 right-3 top-auto z-20 flex flex-col items-end gap-3 sm:right-4 sm:top-28">
        <div className="pointer-events-auto">
          <MapNav />
        </div>
        <div className="pointer-events-auto hidden max-h-[50vh] overflow-y-auto studio-scroll xl:block">
          <ViewControls />
        </div>
      </div>

      {/* Mobile generation dock */}
      <div className="pointer-events-none absolute bottom-3 left-3 right-3 z-20 lg:hidden">
        <div className="pointer-events-auto max-h-[42vh] overflow-y-auto">
          <GenerationPanel />
        </div>
      </div>

      {/* Mode pill */}
      {mode !== "navigate" && (
        <div className="pointer-events-none absolute left-1/2 top-[4.75rem] z-20 -translate-x-1/2 sm:top-24">
          <div className="rounded-full border border-sky-400/35 bg-sky-500/20 px-4 py-1.5 text-xs font-medium text-sky-50 shadow-lg backdrop-blur-xl">
            {mode === "draw" &&
              "Drawing · click corners · Finish or click green start point"}
            {mode === "measure" && "Measure · click two points"}
            {mode === "edit-model" && "Edit model"}
          </div>
        </div>
      )}

      {!mapReady && (
        <div className="pointer-events-none absolute inset-0 z-10 bg-black/10" />
      )}

      <GuidedTour />
      <LimitModal />
      <HistoryPanel />
      <AuthModal />
    </div>
  );
}
