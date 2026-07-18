import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import {
  createTextTo3DTask,
  isMeshyConfigured,
  createDemoTaskResult,
} from "@/lib/meshy";
import { generateShareId } from "@/lib/share";
import { estimateModelScale } from "@/lib/geo";
import type { PolygonPoint } from "@/types";

export const maxDuration = 60;

interface GenerateBody {
  prompt: string;
  polygon: PolygonPoint[];
  centroid: { lat: number; lng: number };
  areaAcres: number;
  locationName?: string;
  demo?: boolean;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as GenerateBody;
    const { prompt, polygon, centroid, areaAcres, locationName, demo } = body;

    if (!prompt?.trim()) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }
    if (!polygon || polygon.length < 3) {
      return NextResponse.json(
        { error: "A closed polygon with at least 3 points is required" },
        { status: 400 }
      );
    }
    if (!centroid || typeof areaAcres !== "number") {
      return NextResponse.json(
        { error: "Centroid and area are required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    let userId: string | null = null;
    let useDemo = demo || !isMeshyConfigured() || process.env.NEXT_PUBLIC_DEMO_MODE === "true";

    if (supabase) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      userId = user?.id ?? null;

      if (userId) {
        // Consume a free generation or credit
        const service = createServiceClient();
        if (service) {
          const { data: consume, error: consumeError } = await service.rpc(
            "consume_generation",
            { p_user_id: userId }
          );

          if (consumeError) {
            console.error("consume_generation error", consumeError);
          } else {
            const row = Array.isArray(consume) ? consume[0] : consume;
            if (row && row.success === false) {
              return NextResponse.json(
                {
                  error: "Generation limit reached",
                  code: "LIMIT_REACHED",
                  free_remaining: row.remaining ?? 0,
                  credits: row.credits ?? 0,
                },
                { status: 402 }
              );
            }
          }
        }
      }
    }

    // Unauthenticated users can only use demo generation
    if (!userId) {
      useDemo = true;
    }

    const shareId = generateShareId();
    const scale = estimateModelScale(areaAcres);
    const modelTransform = {
      scale,
      heading: 0,
      heightOffset: 0,
    };

    let meshyTaskId: string | null = null;
    let modelUrl: string | null = null;
    let thumbnailUrl: string | null = null;
    let status: "generating" | "completed" = "generating";

    if (useDemo) {
      const demoResult = createDemoTaskResult(prompt);
      meshyTaskId = demoResult.id;
      modelUrl = demoResult.model_urls.glb;
      status = "completed";
    } else {
      meshyTaskId = await createTextTo3DTask(prompt.trim());
    }

    let generationId: string | null = null;

    if (userId && supabase) {
      const service = createServiceClient() ?? supabase;
      const { data, error } = await service
        .from("generations")
        .insert({
          user_id: userId,
          prompt: prompt.trim(),
          share_id: shareId,
          polygon,
          centroid,
          area_acres: areaAcres,
          model_url: modelUrl,
          thumbnail_url: thumbnailUrl,
          meshy_task_id: meshyTaskId,
          status,
          model_transform: modelTransform,
          location_name: locationName ?? null,
        })
        .select()
        .single();

      if (error) {
        console.error("Insert generation error", error);
      } else {
        generationId = data.id;
      }
    }

    return NextResponse.json({
      generationId,
      shareId,
      meshyTaskId,
      status,
      modelUrl,
      thumbnailUrl,
      modelTransform,
      demo: useDemo,
    });
  } catch (err) {
    console.error("Generate error", err);
    const message = err instanceof Error ? err.message : "Generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
