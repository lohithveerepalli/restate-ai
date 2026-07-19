import { MESHY_API_BASE, DEMO_MODEL_URL } from "@/lib/constants";
import type { MeshyTask } from "@/types";

export class MeshyError extends Error {
  constructor(
    message: string,
    public status?: number
  ) {
    super(message);
    this.name = "MeshyError";
  }
}

function getApiKey(): string | null {
  return process.env.MESHY_API_KEY || null;
}

export function isMeshyConfigured(): boolean {
  return Boolean(getApiKey());
}

/**
 * Start a Meshy text-to-3D preview task.
 * Docs: https://docs.meshy.ai/api/text-to-3d
 */
export async function createTextTo3DTask(prompt: string): Promise<string> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new MeshyError("MESHY_API_KEY is not configured");
  }

  const res = await fetch(`${MESHY_API_BASE}/text-to-3d`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      mode: "preview",
      prompt: `${prompt}. Photorealistic architectural site model, clean geometry, ground plane aligned, suitable for geospatial placement.`,
      art_style: "realistic",
      should_remesh: true,
      topology: "triangle",
      target_polycount: 30000,
      ai_model: "meshy-6",
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new MeshyError(
      `Meshy create failed (${res.status}): ${body}`,
      res.status
    );
  }

  const data = (await res.json()) as { result: string };
  return data.result;
}

export async function getTextTo3DTask(taskId: string): Promise<MeshyTask> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new MeshyError("MESHY_API_KEY is not configured");
  }

  const res = await fetch(`${MESHY_API_BASE}/text-to-3d/${taskId}`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.text();
    throw new MeshyError(
      `Meshy status failed (${res.status}): ${body}`,
      res.status
    );
  }

  return res.json() as Promise<MeshyTask>;
}

/**
 * Demo / fallback generation — returns a sample model after a short delay simulation.
 * Used when MESHY_API_KEY is missing or NEXT_PUBLIC_DEMO_MODE=true.
 */
export function createDemoTaskResult(prompt: string) {
  return {
    id: `demo-${Date.now()}`,
    status: "SUCCEEDED" as const,
    progress: 100,
    model_urls: { glb: DEMO_MODEL_URL },
    thumbnail_url: null as string | null,
    prompt,
  };
}

export async function pollUntilComplete(
  taskId: string,
  options: {
    intervalMs?: number;
    timeoutMs?: number;
    onProgress?: (progress: number, status: string) => void;
  } = {}
): Promise<MeshyTask> {
  const intervalMs = options.intervalMs ?? 3000;
  const timeoutMs = options.timeoutMs ?? 10 * 60 * 1000;
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    const task = await getTextTo3DTask(taskId);
    options.onProgress?.(task.progress ?? 0, task.status);

    if (task.status === "SUCCEEDED") return task;
    if (task.status === "FAILED" || task.status === "CANCELED") {
      throw new MeshyError(
        task.task_error?.message || `Meshy task ${task.status.toLowerCase()}`
      );
    }

    await new Promise((r) => setTimeout(r, intervalMs));
  }

  throw new MeshyError("Meshy generation timed out");
}
