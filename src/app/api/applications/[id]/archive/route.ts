import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { archiveApplication } from "@/lib/domain/archive";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  console.log("[api/applications/id/archive] POST request received", id);

  const session = await auth();
  if (!session?.user) {
    console.log("[api/applications/id/archive] unauthorized - no session");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = (session.user as { role?: string }).role;
  console.log("[api/applications/id/archive] actor role", role);

  const result = archiveApplication(id, role as "processor" | "team_lead");

  if (!result.success) {
    console.log("[api/applications/id/archive] archive denied", result.error);
    return NextResponse.json({ error: result.error }, { status: 403 });
  }

  console.log("[api/applications/id/archive] archived successfully", id);
  return NextResponse.json({ success: true });
}
