import { NextResponse } from "next/server";
import { getAppointments } from "@/lib/db/queries/appointment-queries";

export async function GET() {
  const appointments = await getAppointments();
  return NextResponse.json(appointments);
}
