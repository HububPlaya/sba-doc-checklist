import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { bulkUpdateDocumentStatus } from "@/lib/domain/documentUpdates";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  console.log("[api/applications/id/documents] PATCH request received", id);

  const session = await auth();
  if (!session?.user?.name) {
    console.log("[api/applications/id/documents] unauthorized - no session");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { status } = body;
    console.log("[api/applications/id/documents] bulk updating status", {
      applicationId: id,
      status,
      updatedBy: session.user.name,
    });

    const result = bulkUpdateDocumentStatus(id, status, session.user.name);

    if (!result.success) {
      console.log("[api/applications/id/documents] bulk update failed", result.error);
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    console.log("[api/applications/id/documents] bulk update succeeded", result.count);
    return NextResponse.json({ success: true, count: result.count });
  } catch (err) {
    console.error("[api/applications/id/documents] error", err);
    return NextResponse.json({ error: "Failed to update documents" }, { status: 500 });
  }
}
