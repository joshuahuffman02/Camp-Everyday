import { NextResponse } from "next/server";

export const runtime = "edge";

/**
 * Web Vitals collection endpoint
 * Accepts Core Web Vitals metrics from the client
 */
export async function POST(request: Request) {
  try {
    const data = await request.json();

    // In production, you could send this to an analytics service
    // For now, just acknowledge receipt
    if (process.env.NODE_ENV === "development") {
      console.log("[Web Vitals]", data);
    }

    // TODO: Store in database or send to analytics service like:
    // - Google Analytics
    // - Datadog RUM
    // - Custom metrics DB

    return NextResponse.json({ received: true }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }
}
