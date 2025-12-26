import { NextRequest } from "next/server";
import { proxyToBackend } from "@/lib/api-proxy";

export async function GET(req: NextRequest) {
  return proxyToBackend(req, "workflows");
}

export async function POST(req: NextRequest) {
  return proxyToBackend(req, "workflows");
}
