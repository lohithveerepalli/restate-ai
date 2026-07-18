import { NextRequest, NextResponse } from "next/server";

/**
 * Lightweight location search using OpenStreetMap Nominatim (no API key).
 * Falls back gracefully if rate-limited.
 */
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  try {
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("q", q);
    url.searchParams.set("format", "json");
    url.searchParams.set("limit", "6");
    url.searchParams.set("addressdetails", "0");

    const res = await fetch(url.toString(), {
      headers: {
        "User-Agent": "Restate.ai Land Development Studio (dev)",
        Accept: "application/json",
      },
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      return NextResponse.json({ results: [] });
    }

    const data = (await res.json()) as Array<{
      display_name: string;
      lat: string;
      lon: string;
      type?: string;
      class?: string;
    }>;

    const results = data.map((item) => ({
      name: item.display_name,
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
      type: item.type,
      class: item.class,
    }));

    return NextResponse.json({ results });
  } catch (err) {
    console.error("Geocode error", err);
    return NextResponse.json({ results: [] });
  }
}
