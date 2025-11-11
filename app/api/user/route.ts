import { getUserWithContext } from "@/lib/db/queries/queries";

export async function GET() {
  const user = await getUserWithContext();
  return Response.json(user);
}
