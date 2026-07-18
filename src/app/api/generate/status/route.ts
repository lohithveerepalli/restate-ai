import { NextRequest, NextResponse } from "next/server";
import { getTextTo3DTask, isMeshyConfigured } from "@/lib/meshy";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { DEMO_MODEL_URL } from "@/lib/constants";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const taskId = req.nextUrl.searchParams.get("taskId");
    const generationId = req.nextUrl.searchParams.get("generationId");

    if (!taskId) {
      return NextResponse.json({ error: "taskId is required" }, { status: 400 });
    }

    // Demo tasks complete immediately
    if (taskId.startsWith("demo-")) {
      return NextResponse.json({
        status: "SUCCEEDED",
        progress: 100,
        modelUrl: DEMO_MODEL_URL,
        thumbnailUrl: null,
      });
    }

    if (!isMeshyConfigured()) {
      return NextResponse.json({
        status: "SUCCEEDED",
        progress: 100,
        modelUrl: DEMO_MODEL_URL,
        thumbnailUrl: null,
        demo: true,
      });
    }

    const task = await getTextTo3DTask(taskId);

    const modelUrl = task.model_urls?.glb ?? null;
    const thumbnailUrl = task.thumbnail_url ?? null;

    // Persist completion to Supabase when finished
    if (
      generationId &&
      (task.status === "SUCCEEDED" || task.status === "FAILED")
    ) {
      const supabase = await createClient();
      const service = createServiceClient() ?? supabase;
      if (service) {
        await service
          .from("generations")
          .update({
            status: task.status === "SUCCEEDED" ? "completed" : "failed",
            model_url: modelUrl,
            thumbnail_url: thumbnailUrl,
            error_message:
              task.status === "FAILED"
                ? task.task_error?.message || "Generation failed"
                : null,
          })
          .eq("id", generationId);
      }
    }

    return NextResponse.json({
      status: task.status,
      progress: task.progress ?? 0,
      modelUrl,
      thumbnailUrl,
      error: task.task_error?.message,
    });
  } catch (err) {
    console.error("Status error", err);
    const message = err instanceof Error ? err.message : "Status check failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
