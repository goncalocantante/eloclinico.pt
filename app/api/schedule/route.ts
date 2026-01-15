import { getSchedule } from "@/server/actions/schedule";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const schedule = await getSchedule(session.user.id);
    return NextResponse.json(schedule || null);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || "Failed to fetch schedule" },
      { status: 500 }
    );
  }
}
