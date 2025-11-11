import { getClinicForUser } from "@/lib/db/queries/queries";

export async function GET() {
  const clinic = await getClinicForUser();
  return Response.json(clinic);
}
