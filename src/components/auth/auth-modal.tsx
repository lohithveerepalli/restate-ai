"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useStudioStore } from "@/stores/studio-store";
import { useAuth } from "@/components/providers/auth-provider";
import { Loader2, Mail, Sparkles, Settings2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { SupabaseSetupModal } from "@/components/setup/supabase-setup-modal";

export function AuthModal() {
  const open = useStudioStore((s) => s.showAuthModal);
  const mode = useStudioStore((s) => s.authModalMode);
  const setShowAuthModal = useStudioStore((s) => s.setShowAuthModal);
  const { signInWithEmail, signUpWithEmail, signInWithOAuth, configured } =
    useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [setupOpen, setSetupOpen] = useState(false);

  const close = () => setShowAuthModal(false);

  const onEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSupabaseConfigured()) {
      setSetupOpen(true);
      return;
    }
    setLoading(true);
    try {
      const err =
        mode === "login"
          ? await signInWithEmail(email, password)
          : await signUpWithEmail(email, password, fullName);
      if (err) {
        toast.error(err);
      } else {
        toast.success(
          mode === "login"
            ? "Welcome back — opening studio"
            : "Account created — welcome to Restate"
        );
        close();
        router.push("/studio?tour=1");
      }
    } finally {
      setLoading(false);
    }
  };

  const onOAuth = async (provider: "google" | "apple") => {
    if (!isSupabaseConfigured()) {
      toast.message("Connect Supabase first", {
        description: "Paste your Project URL to enable Google sign-in.",
      });
      setSetupOpen(true);
      return;
    }
    setLoading(true);
    try {
      const err = await signInWithOAuth(provider);
      if (err) {
        const disabled =
          /not enabled|unsupported provider|provider is not enabled/i.test(err);
        toast.error(
          disabled
            ? "Google sign-in is not enabled yet in Supabase"
            : err,
          {
            description: disabled
              ? "Dashboard → Authentication → Providers → Google → Enable, then add Google OAuth Client ID & Secret."
              : provider === "google"
                ? "Check Supabase Auth → Providers → Google and redirect URLs."
                : undefined,
            duration: 8000,
          }
        );
        if (disabled) setSetupOpen(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const exploreAsGuest = () => {
    close();
    router.push("/studio?tour=1&guest=1");
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => setShowAuthModal(v)}>
        <DialogContent className="max-w-md border-white/10 bg-zinc-950 text-white sm:rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl">
              {mode === "login" ? "Welcome back" : "Start building on real land"}
            </DialogTitle>
            <DialogDescription className="text-white/60">
              {mode === "login"
                ? "Sign in to generate with Meshy, save history, and share."
                : "3 free AI generations. Sign up with Google, then open the Land Development Studio."}
            </DialogDescription>
          </DialogHeader>

          {!configured && (
            <button
              type="button"
              onClick={() => setSetupOpen(true)}
              className="flex w-full items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-left text-xs text-amber-100 transition hover:bg-amber-500/15"
            >
              <Settings2 className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                <strong className="text-amber-50">One step left for Google auth:</strong>{" "}
                paste your Supabase Project URL (publishable key is already set).
                Click here to connect.
              </span>
            </button>
          )}

          <div className="grid gap-2">
            <Button
              type="button"
              variant="secondary"
              className="h-12 bg-white text-base text-zinc-900 hover:bg-white/90"
              disabled={loading}
              onClick={() => onOAuth("google")}
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <GoogleIcon />
              )}
              Continue with Google
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="h-11 bg-white/10 text-white hover:bg-white/20"
              disabled={loading}
              onClick={() => onOAuth("apple")}
            >
              <AppleIcon />
              Continue with Apple
            </Button>
          </div>

          <div className="relative flex items-center gap-3 py-1">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-[11px] uppercase tracking-wider text-white/40">
              or email
            </span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          <form onSubmit={onEmail} className="space-y-3">
            {mode === "signup" && (
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-white/70">
                  Full name
                </Label>
                <Input
                  id="name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="border-white/10 bg-white/5 text-white"
                  placeholder="Ada Lovelace"
                />
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-white/70">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border-white/10 bg-white/5 text-white"
                placeholder="you@company.com"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-white/70">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="border-white/10 bg-white/5 text-white"
                placeholder="••••••••"
              />
            </div>
            <Button
              type="submit"
              className="h-11 w-full gap-2 bg-gradient-to-r from-sky-500 to-violet-500"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Mail className="h-4 w-4" />
              )}
              {mode === "login" ? "Sign in with email" : "Create account"}
            </Button>
          </form>

          <Button
            type="button"
            variant="ghost"
            className="h-10 w-full gap-2 text-white/70 hover:bg-white/5 hover:text-white"
            onClick={exploreAsGuest}
          >
            <Sparkles className="h-4 w-4 text-sky-400" />
            Skip for now — explore studio (3 free gens)
          </Button>

          <p className="text-center text-xs text-white/50">
            {mode === "login" ? (
              <>
                New here?{" "}
                <button
                  type="button"
                  className="text-sky-400 hover:underline"
                  onClick={() => setShowAuthModal(true, "signup")}
                >
                  Create an account
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  className="text-sky-400 hover:underline"
                  onClick={() => setShowAuthModal(true, "login")}
                >
                  Sign in
                </button>
              </>
            )}
          </p>
        </DialogContent>
      </Dialog>

      <SupabaseSetupModal open={setupOpen} onOpenChange={setSetupOpen} />
    </>
  );
}

function GoogleIcon() {
  return (
    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
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

function AppleIcon() {
  return (
    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
    </svg>
  );
}
