"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { AuthModal } from "@/components/auth/auth-modal";
import { useStudioStore } from "@/stores/studio-store";
import { DEMO_MODE_KEY } from "@/lib/constants";
import {
  Sparkles,
  Map,
  Pentagon,
  Sun,
  Share2,
  ArrowRight,
  Play,
  Building2,
  Hospital,
  Factory,
  Trees,
} from "lucide-react";

const FEATURES = [
  {
    icon: Map,
    title: "Photorealistic 3D land",
    body: "Explore Google Photorealistic 3D Tiles — real terrain, buildings, and canopy — not a flat sketch.",
  },
  {
    icon: Pentagon,
    title: "Draw any parcel",
    body: "Click-to-draw polygons, live acreage with Turf.js, and one-tap 5–50 acre presets.",
  },
  {
    icon: Sparkles,
    title: "AI text-to-3D developments",
    body: "Meshy turns your prompt into a GLB model, scaled and clamped to your selected land.",
  },
  {
    icon: Sun,
    title: "Cinematic lighting",
    body: "Time-of-day sun, dynamic shadows, golden hour and sunset presets for presentations.",
  },
];

const USE_CASES = [
  { icon: Trees, label: "Theme parks" },
  { icon: Hospital, label: "Hospitals" },
  { icon: Building2, label: "Data centers" },
  { icon: Factory, label: "Industrial parks" },
];

export function LandingPage() {
  const setShowAuthModal = useStudioStore((s) => s.setShowAuthModal);

  const tryDemo = () => {
    try {
      sessionStorage.setItem(DEMO_MODE_KEY, "1");
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="min-h-dvh bg-[#050a14] text-white">
      {/* Ambient background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-32 top-0 h-[480px] w-[480px] rounded-full bg-sky-500/20 blur-[120px]" />
        <div className="absolute -right-20 top-40 h-[420px] w-[420px] rounded-full bg-violet-600/20 blur-[120px]" />
        <div className="absolute bottom-0 left-1/3 h-[360px] w-[360px] rounded-full bg-cyan-500/10 blur-[100px]" />
        <div
          className="absolute inset-0 opacity-[0.15]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)",
            backgroundSize: "32px 32px",
          }}
        />
      </div>

      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-sky-400 to-violet-500 text-sm font-bold shadow-lg shadow-sky-500/30">
            R
          </div>
          <div>
            <p className="text-sm font-semibold tracking-tight">Restate.ai</p>
            <p className="text-[10px] uppercase tracking-wider text-white/45">
              Land Development Studio
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            className="text-white/80 hover:bg-white/10 hover:text-white"
            onClick={() => setShowAuthModal(true, "login")}
          >
            Sign in
          </Button>
          <Button
            className="bg-white text-zinc-900 hover:bg-white/90"
            onClick={() => setShowAuthModal(true, "signup")}
          >
            Get started
          </Button>
        </div>
      </header>

      <main className="relative z-10">
        <section className="mx-auto max-w-6xl px-6 pb-20 pt-10 sm:pt-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="mx-auto max-w-3xl text-center"
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-sky-200/90 backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" />
              AI land development on real 3D Earth
            </div>
            <h1 className="bg-gradient-to-b from-white via-white to-white/60 bg-clip-text text-4xl font-semibold tracking-tight text-transparent sm:text-6xl sm:leading-[1.05]">
              Select land.
              <br />
              Generate the future.
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-white/60 sm:text-lg">
              Restate.ai is the Land Development Studio — pick any parcel on a
              high-definition 3D map and watch AI design theme parks, hospitals,
              data centers, and communities directly on the terrain.
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button
                size="lg"
                className="h-12 gap-2 bg-white px-8 text-base text-zinc-900 shadow-xl hover:bg-white/90"
                onClick={() => setShowAuthModal(true, "signup")}
              >
                <GoogleGlyph />
                Sign up with Google
              </Button>
              <Link
                href="/studio?tour=1&guest=1"
                onClick={tryDemo}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-sky-500 to-violet-500 px-8 text-base font-medium text-white shadow-xl shadow-sky-500/25 hover:from-sky-400 hover:to-violet-400"
              >
                <Play className="h-4 w-4" />
                Open studio now
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <p className="mt-4 text-xs text-white/40">
              Full path: Sign up → guided tour → pick land → Generate with Meshy · 3 free gens
            </p>
          </motion.div>

          {/* Showcase card */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15 }}
            className="relative mx-auto mt-16 max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-white/10 to-white/[0.02] p-1 shadow-2xl"
          >
            <div className="relative aspect-[16/9] overflow-hidden rounded-[1.35rem] bg-[#0a1224]">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(56,189,248,0.25),transparent_50%),radial-gradient(ellipse_at_70%_80%,rgba(139,92,246,0.2),transparent_50%)]" />
              {/* Stylized map mock */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative h-[70%] w-[80%]">
                  <div className="absolute inset-0 rounded-2xl border border-sky-400/30 bg-gradient-to-br from-emerald-900/40 via-lime-900/20 to-amber-900/30 shadow-inner" />
                  <div className="absolute left-[20%] top-[25%] h-[45%] w-[40%] rounded-xl border-2 border-sky-400/70 bg-sky-400/15 shadow-[0_0_40px_rgba(56,189,248,0.35)]" />
                  <div className="absolute left-[28%] top-[32%] h-16 w-24 rounded-md bg-gradient-to-t from-zinc-700 to-zinc-400 shadow-lg" />
                  <div className="absolute left-[38%] top-[38%] h-20 w-14 rounded-md bg-gradient-to-t from-sky-800 to-sky-400 shadow-lg" />
                  <div className="absolute left-[48%] top-[35%] h-12 w-16 rounded-md bg-gradient-to-t from-violet-900 to-violet-500 shadow-lg" />
                  <div className="absolute bottom-6 left-6 rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-xs backdrop-blur">
                    <span className="text-sky-300">25.0 ac</span>
                    <span className="text-white/40"> · Texas Hill Country</span>
                  </div>
                  <div className="absolute right-6 top-6 max-w-[200px] rounded-xl border border-white/10 bg-black/55 p-3 text-left text-xs backdrop-blur">
                    <p className="font-medium text-white">Modern hospital campus</p>
                    <p className="mt-1 text-white/50">AI placed · terrain clamped</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-12">
          <div className="flex flex-wrap items-center justify-center gap-3">
            {USE_CASES.map((u) => (
              <div
                key={u.label}
                className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/75"
              >
                <u.icon className="h-4 w-4 text-sky-400" />
                {u.label}
              </div>
            ))}
            <span className="text-sm text-white/40">+ communities, campuses, more</span>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="mb-10 text-center text-2xl font-semibold tracking-tight sm:text-3xl">
            Built for the &ldquo;wow&rdquo; moment
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/15 text-sky-300">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-medium">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/55">
                  {f.body}
                </p>
              </motion.div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 pb-24">
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-sky-500/20 via-violet-600/10 to-transparent px-8 py-12 text-center sm:px-16">
            <Share2 className="mx-auto mb-4 h-8 w-8 text-sky-300" />
            <h2 className="text-2xl font-semibold sm:text-3xl">
              From idea to shareable 3D site in minutes
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-white/60">
              Open the studio, take the guided tour, and place your first
              development on real land — no GIS degree required.
            </p>
            <Link
              href="/studio?tour=1"
              onClick={tryDemo}
              className="mt-8 inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-white px-8 text-base font-medium text-zinc-900 hover:bg-white/90"
            >
              Launch Land Development Studio
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-white/10 py-8 text-center text-xs text-white/40">
        <p>
          © {new Date().getFullYear()} Restate.ai · Land Development Studio ·
          Powered by Cesium, Google Photorealistic 3D Tiles & Meshy.ai
        </p>
      </footer>

      <AuthModal />
    </div>
  );
}

function GoogleGlyph() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}
