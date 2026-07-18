import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

/**
 * Called after the client finishes the 30s "watch ad" countdown.
 * Grants +1 free generation (rate-limited in SQL).
 */
export async function POST() {
  try {
    const supabase = await createClient();
    if (!supabase) {
      // Local/demo without Supabase: always succeed
      return NextResponse.json({
        success: true,
        free_remaining: 1,
        demo: true,
      });
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const service = createServiceClient();
    if (!service) {
      // Fallback: update via user client if RLS allows
      const { data: profile } = await supabase
        .from("profiles")
        .select("free_generations_remaining")
        .eq("id", user.id)
        .single();

      const next = (profile?.free_generations_remaining ?? 0) + 1;
      await supabase
        .from("profiles")
        .update({ free_generations_remaining: next })
        .eq("id", user.id);

      return NextResponse.json({ success: true, free_remaining: next });
    }

    const { data, error } = await service.rpc("grant_ad_reward", {
      p_user_id: user.id,
    });

    if (error) {
      console.error(error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const row = Array.isArray(data) ? data[0] : data;
    if (!row?.success) {
      return NextResponse.json(
        {
          error: "Ad reward limit reached. Try again later.",
          free_remaining: row?.free_remaining ?? 0,
        },
        { status: 429 }
      );
    }

    return NextResponse.json({
      success: true,
      free_remaining: row.free_remaining,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to grant ad reward" },
      { status: 500 }
    );
  }
}
