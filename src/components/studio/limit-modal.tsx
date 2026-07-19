"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useStudioStore } from "@/stores/studio-store";
import { useAuth } from "@/components/providers/auth-provider";
import { CREDIT_PLANS } from "@/types";
import { Check, Play, Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { grantLocalGeneration } from "@/lib/local-quota";

const AD_SECONDS = 30;

export function LimitModal() {
  const open = useStudioStore((s) => s.showLimitModal);
  const setOpen = useStudioStore((s) => s.setShowLimitModal);
  const profile = useStudioStore((s) => s.profile);
  const setProfile = useStudioStore((s) => s.setProfile);
  const { refreshProfile } = useAuth();

  const [watching, setWatching] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(AD_SECONDS);
  const [claiming, setClaiming] = useState(false);

  useEffect(() => {
    if (!watching) return;
    if (secondsLeft <= 0) return;
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [watching, secondsLeft]);

  useEffect(() => {
    if (!open) {
      setWatching(false);
      setSecondsLeft(AD_SECONDS);
      setClaiming(false);
    }
  }, [open]);

  const claimAd = async () => {
    setClaiming(true);
    try {
      const res = await fetch("/api/credits/ad", { method: "POST" });
      const data = await res.json();

      if (res.ok && !data.demo) {
        if (profile) {
          setProfile({
            ...profile,
            free_generations_remaining:
              data.free_remaining ?? profile.free_generations_remaining + 1,
          });
        }
        await refreshProfile();
      } else {
        // Guest / no Supabase — local quota
        grantLocalGeneration(1);
      }

      toast.success("+1 generation unlocked");
      setOpen(false);
      // soft reload quota UI
      window.dispatchEvent(new Event("restate-quota"));
    } catch (err) {
      // Still grant local reward so demos never soft-lock
      grantLocalGeneration(1);
      toast.success("+1 generation unlocked");
      setOpen(false);
      console.error(err);
    } finally {
      setClaiming(false);
      setWatching(false);
      setSecondsLeft(AD_SECONDS);
    }
  };

  const buyPlan = (planName: string) => {
    toast.message(`${planName} checkout coming soon`, {
      description:
        "Credit purchases will connect to Stripe in a future release. Use Watch Ad for +1 free generation now.",
    });
  };

  const adProgress =
    ((AD_SECONDS - secondsLeft) / AD_SECONDS) * 100;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-lg border-white/10 bg-zinc-950 text-white sm:rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="h-5 w-5 text-sky-400" />
            You&apos;ve used your free generations
          </DialogTitle>
          <DialogDescription className="text-white/60">
            Free accounts include 3 AI land developments. Buy credits to keep
            building, or watch a short ad for one more generation.
          </DialogDescription>
        </DialogHeader>

        {!watching ? (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              {CREDIT_PLANS.map((plan) => (
                <button
                  key={plan.id}
                  type="button"
                  onClick={() => buyPlan(plan.name)}
                  className={cn(
                    "relative flex flex-col rounded-xl border p-3 text-left transition hover:border-sky-400/50",
                    "popular" in plan && plan.popular
                      ? "border-sky-400/40 bg-sky-500/10"
                      : "border-white/10 bg-white/5"
                  )}
                >
                  {"popular" in plan && plan.popular && (
                    <Badge className="absolute -top-2 right-2 bg-sky-500 text-[10px]">
                      Popular
                    </Badge>
                  )}
                  <span className="text-sm font-semibold">{plan.name}</span>
                  <span className="mt-1 text-2xl font-bold tracking-tight">
                    ${plan.price}
                  </span>
                  <span className="mt-1 text-xs text-white/55">
                    {plan.credits} generations
                  </span>
                </button>
              ))}
            </div>

            <div className="relative flex items-center gap-3 py-1">
              <div className="h-px flex-1 bg-white/10" />
              <span className="text-[11px] uppercase tracking-wider text-white/40">
                or
              </span>
              <div className="h-px flex-1 bg-white/10" />
            </div>

            <Button
              className="h-11 w-full gap-2 bg-white/10 text-white hover:bg-white/20"
              onClick={() => {
                setWatching(true);
                setSecondsLeft(AD_SECONDS);
              }}
            >
              <Play className="h-4 w-4" />
              Watch 30-second ad · +1 generation
            </Button>
          </div>
        ) : (
          <div className="space-y-4 rounded-xl border border-white/10 bg-black/40 p-4">
            <div className="flex aspect-video items-center justify-center rounded-lg bg-gradient-to-br from-zinc-800 to-zinc-900">
              <div className="text-center">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-white/10">
                  <Play className="h-6 w-6 text-white/80" />
                </div>
                <p className="text-sm font-medium text-white/90">
                  Sponsored preview
                </p>
                <p className="mt-1 text-xs text-white/50">
                  Restate.ai partners with forward-looking developers
                </p>
              </div>
            </div>
            <Progress value={adProgress} className="h-2 bg-white/10" />
            <p className="text-center text-sm text-white/70">
              {secondsLeft > 0
                ? `Unlocking in ${secondsLeft}s…`
                : "Ad complete — claim your generation"}
            </p>
            <Button
              className="h-11 w-full gap-2 bg-gradient-to-r from-sky-500 to-violet-500"
              disabled={secondsLeft > 0 || claiming}
              onClick={claimAd}
            >
              {claiming ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              Claim +1 generation
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
