"use client";

import dynamic from "next/dynamic";
import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SearchBar } from "@/components/studio/search-bar";
import { GenerationPanel } from "@/components/studio/generation-panel";
import { ViewControls } from "@/components/studio/view-controls";
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

export function StudioShell({ startTour = false }: { startTour?: boolean }) {
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
      if (startTour || (!done && !loading)) {
        // slight delay so map can mount
        const t = setTimeout(() => {
          setTourStep(0);
          setShowTour(true);
        }, 1200);
        return () => clearTimeout(t);
      }
    } catch {
      /* ignore */
    }
  }, [startTour, loading, setDemoMode, setShowTour, setTourStep]);

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

      {/* Top chrome */}
      <header className="pointer-events-none absolute left-0 right-0 top-0 z-20 flex items-start justify-between gap-3 p-3 sm:p-4">
        <div className="pointer-events-auto flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/50 px-3 py-2 backdrop-blur-xl transition hover:bg-black/60"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-sky-400 to-violet-500 text-xs font-bold">
              R
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-semibold leading-none">Restate.ai</p>
              <p className="text-[10px] text-white/50">Land Development Studio</p>
            </div>
          </Link>
          <div className="hidden rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-xs text-white/60 backdrop-blur-xl md:block">
            {locationLabel}
          </div>
        </div>

        <div className="pointer-events-auto flex-1 max-w-md">
          <SearchBar />
        </div>

        <div className="pointer-events-auto flex items-center gap-2">
          <Button
            size="icon"
            variant="secondary"
            className="h-10 w-10 border border-white/10 bg-black/50 text-white backdrop-blur-xl hover:bg-white/10"
            onClick={() => {
              setTourStep(0);
              setShowTour(true);
            }}
            title="Restart tour"
          >
            <HelpCircle className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="secondary"
            className="h-10 w-10 border border-white/10 bg-black/50 text-white backdrop-blur-xl hover:bg-white/10"
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
      </header>

      {/* Side panels */}
      <div className="pointer-events-none absolute bottom-4 left-4 right-4 z-20 flex flex-col items-stretch justify-end gap-3 lg:bottom-6 lg:left-6 lg:right-auto lg:top-24 lg:flex-row lg:items-start">
        <div className="pointer-events-auto lg:w-[22rem]">
          <GenerationPanel />
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-4 right-4 z-20 hidden lg:block">
        <div className="pointer-events-auto">
          <ViewControls />
        </div>
      </div>

      {/* Mobile view controls strip */}
      <div className="pointer-events-none absolute bottom-4 right-4 z-20 lg:hidden">
        <div className="pointer-events-auto max-h-[40vh] overflow-y-auto">
          <ViewControls className="max-w-[min(100vw-2rem,20rem)]" />
        </div>
      </div>

      {/* Mode pill */}
      {mode !== "navigate" && (
        <div className="pointer-events-none absolute left-1/2 top-20 z-20 -translate-x-1/2">
          <div className="rounded-full border border-sky-400/30 bg-sky-500/20 px-4 py-1.5 text-xs font-medium text-sky-100 backdrop-blur-xl">
            {mode === "draw" && "Drawing mode · click to place · double-click to close"}
            {mode === "measure" && "Measure mode · click two points"}
            {mode === "edit-model" && "Edit model"}
          </div>
        </div>
      )}

      {!mapReady && (
        <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-b from-transparent to-black/20" />
      )}

      <GuidedTour />
      <LimitModal />
      <HistoryPanel />
      <AuthModal />
    </div>
  );
}
