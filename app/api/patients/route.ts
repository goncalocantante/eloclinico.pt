import { NextResponse } from "next/server";
import { getPatients } from "@/lib/db/queries/patient-queries";

export async function GET() {
  const patients = await getPatients();
  return NextResponse.json(patients);
}
