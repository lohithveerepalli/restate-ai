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
import {
  setSupabaseUrlClient,
  getSupabaseUrlClient,
  getSupabaseAnonKey,
} from "@/lib/supabase/config";
import { ExternalLink, Database, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onConfigured?: () => void;
}

export function SupabaseSetupModal({ open, onOpenChange, onConfigured }: Props) {
  const [url, setUrl] = useState(
    () => getSupabaseUrlClient() || process.env.NEXT_PUBLIC_SUPABASE_URL || ""
  );
  const hasKey = Boolean(getSupabaseAnonKey());

  const save = () => {
    const cleaned = url.trim().replace(/\/$/, "");
    if (!/^https:\/\/[a-z0-9]+\.supabase\.co$/i.test(cleaned)) {
      toast.error(
        "URL should look like https://abcdefghijklmnop.supabase.co"
      );
      return;
    }
    setSupabaseUrlClient(cleaned);
    toast.success("Supabase URL saved — reload to enable Google sign-in");
    onConfigured?.();
    onOpenChange(false);
    // Full reload so middleware/server see cookies after auth; client picks URL immediately after
    setTimeout(() => window.location.reload(), 600);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg border-white/10 bg-zinc-950 text-white sm:rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Database className="h-5 w-5 text-sky-400" />
            Connect Supabase (Google sign-in)
          </DialogTitle>
          <DialogDescription className="text-white/60">
            Your publishable key is already installed. Paste the{" "}
            <strong className="text-white/80">Project URL</strong> from your
            Supabase dashboard to enable Google / email auth.
          </DialogDescription>
        </DialogHeader>

        <ol className="space-y-2 text-sm text-white/70">
          <li className="flex gap-2">
            <span className="text-sky-400">1.</span>
            <span>
              Open{" "}
              <a
                href="https://supabase.com/dashboard/projects"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-sky-400 hover:underline"
              >
                Supabase projects <ExternalLink className="h-3 w-3" />
              </a>
              , select your project (or create one).
            </span>
          </li>
          <li className="flex gap-2">
            <span className="text-sky-400">2.</span>
            <span>
              <strong className="text-white/90">Settings → API</strong> → copy{" "}
              <em>Project URL</em> (https://….supabase.co).
            </span>
          </li>
          <li className="flex gap-2">
            <span className="text-sky-400">3.</span>
            <span>
              SQL Editor → paste & run{" "}
              <code className="rounded bg-white/10 px-1">supabase/schema.sql</code>{" "}
              from this repo.
            </span>
          </li>
          <li className="flex gap-2">
            <span className="text-sky-400">4.</span>
            <span>
              <strong className="text-white/90">Auth → Providers → Google</strong>{" "}
              → enable, add Google OAuth Client ID & Secret. Redirect URL:{" "}
              <code className="rounded bg-white/10 px-1 text-[10px]">
                https://YOUR_REF.supabase.co/auth/v1/callback
              </code>
            </span>
          </li>
          <li className="flex gap-2">
            <span className="text-sky-400">5.</span>
            <span>
              Auth → URL config → Site URL{" "}
              <code className="rounded bg-white/10 px-1">http://localhost:3000</code>
              , Redirect{" "}
              <code className="rounded bg-white/10 px-1 text-[10px]">
                http://localhost:3000/auth/callback
              </code>
            </span>
          </li>
        </ol>

        <div className="space-y-1.5">
          <Label className="text-white/70">Project URL</Label>
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://xxxxxxxx.supabase.co"
            className="border-white/10 bg-white/5 font-mono text-sm text-white"
          />
        </div>

        <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/60">
          {hasKey ? (
            <>
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              Publishable key detected in environment
            </>
          ) : (
            <span>Missing publishable key in .env.local</span>
          )}
        </div>

        <div className="flex gap-2">
          <Button
            variant="secondary"
            className="bg-white/10 text-white hover:bg-white/20"
            onClick={() => onOpenChange(false)}
          >
            Later
          </Button>
          <Button
            className="flex-1 bg-gradient-to-r from-sky-500 to-violet-500"
            onClick={save}
          >
            Save & enable auth
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
