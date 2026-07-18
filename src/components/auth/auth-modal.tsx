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
import { Loader2, Mail } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

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

  const close = () => setShowAuthModal(false);

  const onEmail = async (e: React.FormEvent) => {
    e.preventDefault();
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
            ? "Welcome back"
            : "Check your email to confirm, or continue if confirmations are disabled"
        );
        close();
        router.push("/studio");
      }
    } finally {
      setLoading(false);
    }
  };

  const onOAuth = async (provider: "google" | "apple") => {
    setLoading(true);
    try {
      const err = await signInWithOAuth(provider);
      if (err) toast.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => setShowAuthModal(v)}>
      <DialogContent className="max-w-md border-white/10 bg-zinc-950 text-white sm:rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {mode === "login" ? "Welcome back" : "Create your account"}
          </DialogTitle>
          <DialogDescription className="text-white/60">
            {mode === "login"
              ? "Sign in to generate, save history, and share developments."
              : "Get 3 free AI generations. Google, Apple, or email."}
          </DialogDescription>
        </DialogHeader>

        {!configured && (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-100">
            Supabase is not configured. Add{" "}
            <code className="text-amber-50">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
            <code className="text-amber-50">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>{" "}
            to <code className="text-amber-50">.env.local</code>. You can still
            explore the studio in demo mode.
          </div>
        )}

        <div className="grid gap-2">
          <Button
            type="button"
            variant="secondary"
            className="h-11 bg-white text-zinc-900 hover:bg-white/90"
            disabled={loading || !configured}
            onClick={() => onOAuth("google")}
          >
            <GoogleIcon />
            Continue with Google
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="h-11 bg-white/10 text-white hover:bg-white/20"
            disabled={loading || !configured}
            onClick={() => onOAuth("apple")}
          >
            <AppleIcon />
            Continue with Apple
          </Button>
        </div>

        <div className="relative flex items-center gap-3 py-1">
          <div className="h-px flex-1 bg-white/10" />
          <span className="text-[11px] uppercase tracking-wider text-white/40">
            email
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
            disabled={loading || !configured}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Mail className="h-4 w-4" />
            )}
            {mode === "login" ? "Sign in" : "Create account"}
          </Button>
        </form>

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
