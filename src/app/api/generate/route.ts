import { NextResponse } from "next/server";
import { generateSignals } from "@/lib/signal-generator";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST() {
  const result = await generateSignals();
  return NextResponse.json(result);
}
