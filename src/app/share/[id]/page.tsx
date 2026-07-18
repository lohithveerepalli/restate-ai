import Link from "next/link";
import { createServiceClient, createClient } from "@/lib/supabase/server";
import { formatAcres } from "@/lib/geo";
import { ShareStudioLoader } from "@/components/studio/share-loader";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return {
    title: `Shared development · Restate.ai`,
    description: `View a shared land development (${id}) on Restate.ai`,
  };
}

export default async function SharePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const service = createServiceClient();
  const supabase = service ?? (await createClient());

  let generation = null as null | {
    prompt: string;
    area_acres: number;
    location_name: string | null;
    model_url: string | null;
    thumbnail_url: string | null;
    polygon: unknown;
    centroid: { lat: number; lng: number };
    model_transform: {
      scale: number;
      heading: number;
      heightOffset: number;
    };
    status: string;
    share_id: string;
  };

  if (supabase) {
    const { data } = await supabase
      .from("generations")
      .select(
        "prompt, area_acres, location_name, model_url, thumbnail_url, polygon, centroid, model_transform, status, share_id"
      )
      .eq("share_id", id)
      .eq("status", "completed")
      .maybeSingle();
    generation = data;
  }

  if (!generation) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-[#050a14] px-6 text-center text-white">
        <h1 className="text-2xl font-semibold">Share link not found</h1>
        <p className="mt-2 max-w-md text-white/55">
          This generation may still be processing, was deleted, or Supabase is
          not configured for shared lookups.
        </p>
        <Link
          href="/studio"
          className="mt-6 inline-flex h-10 items-center justify-center rounded-lg bg-sky-500 px-4 text-sm font-medium text-white hover:bg-sky-400"
        >
          Open studio
        </Link>
      </div>
    );
  }

  return (
    <div className="relative min-h-dvh bg-[#050a14] text-white">
      <div className="absolute left-0 right-0 top-0 z-30 flex items-center justify-between gap-3 p-4">
        <div className="rounded-xl border border-white/10 bg-black/55 px-4 py-2 backdrop-blur-xl">
          <p className="text-xs text-white/45">Shared development</p>
          <p className="max-w-md truncate text-sm font-medium">
            {generation.prompt}
          </p>
          <p className="text-[11px] text-white/45">
            {generation.location_name || "Custom site"} ·{" "}
            {formatAcres(generation.area_acres)}
          </p>
        </div>
        <Link
          href="/studio?tour=1"
          className="inline-flex h-10 items-center justify-center rounded-lg bg-white px-4 text-sm font-medium text-zinc-900 hover:bg-white/90"
        >
          Open in studio
        </Link>
      </div>
      <ShareStudioLoader
        polygon={generation.polygon as never}
        centroid={generation.centroid}
        modelUrl={generation.model_url}
        modelTransform={generation.model_transform}
        prompt={generation.prompt}
        shareId={generation.share_id}
        areaAcres={generation.area_acres}
      />
    </div>
  );
}
