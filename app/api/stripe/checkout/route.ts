import { NextRequest, NextResponse } from "next/server";

// Checkout handler removed for MVP - can be re-added later with user-based subscriptions
export async function GET(request: NextRequest) {
  return NextResponse.redirect(new URL("/dashboard", request.url));
}
