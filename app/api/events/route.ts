import { getEvents } from "@/server/actions/events";
import { NextResponse } from "next/server";

export async function GET() {
  const events = await getEvents();
  return NextResponse.json(events);
}
