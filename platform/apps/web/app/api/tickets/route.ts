import { NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000/api";

/**
 * Tickets API Route - Proxies to backend NestJS API
 * All ticket data is now stored in the PostgreSQL database
 */

export async function GET() {
  try {
    const res = await fetch(`${API_BASE}/tickets`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });

    if (!res.ok) {
      console.error("[tickets][GET] Backend error:", res.status, await res.text());
      return new NextResponse("Failed to load tickets", { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error("[tickets][GET] Network error:", err);
    return new NextResponse("Failed to load tickets", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Add client info from request headers if not provided
    const userAgent = req.headers.get("user-agent") ?? undefined;
    const referer = req.headers.get("referer") ?? undefined;

    const enrichedBody = {
      ...body,
      url: body.url ?? referer,
      client: body.client ?? {
        userAgent,
        platform: null,
        language: null,
        deviceType: deriveDeviceType(userAgent),
      },
    };

    const res = await fetch(`${API_BASE}/tickets`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(enrichedBody),
    });

    if (!res.ok) {
      console.error("[tickets][POST] Backend error:", res.status, await res.text());
      return new NextResponse("Failed to save ticket", { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error("[tickets][POST] Network error:", err);
    return new NextResponse("Failed to save ticket", { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, ...rest } = body ?? {};

    if (!id) {
      return new NextResponse("Missing ticket id", { status: 400 });
    }

    const res = await fetch(`${API_BASE}/tickets/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(rest),
    });

    if (!res.ok) {
      const status = res.status;
      if (status === 404) {
        return new NextResponse("Ticket not found", { status: 404 });
      }
      console.error("[tickets][PATCH] Backend error:", status, await res.text());
      return new NextResponse("Failed to update ticket", { status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error("[tickets][PATCH] Network error:", err);
    return new NextResponse("Failed to update ticket", { status: 500 });
  }
}

function deriveDeviceType(ua?: string | null): "mobile" | "desktop" | "tablet" | "unknown" {
  if (!ua) return "unknown";
  const lower = ua.toLowerCase();
  if (/(ipad|tablet)/.test(lower)) return "tablet";
  if (/(mobi|android|iphone)/.test(lower)) return "mobile";
  return "desktop";
}
