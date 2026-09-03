import { NextResponse } from "next/server";
import { getOrCreateDeviceId } from "@/lib/deviceId";
import { getStatus } from "@/lib/rateLimit";

export const runtime = "nodejs";

export async function GET() {
  const deviceId = getOrCreateDeviceId();
  const status = await getStatus(deviceId);
  return NextResponse.json(status);
}
