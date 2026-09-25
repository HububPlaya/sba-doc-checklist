import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { updateDocumentStatus } from "@/lib/domain/documentUpdates";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id: idParam } = await context.params;
  console.log("[api/documents/id] PATCH request received", idParam);

  const session = await auth();
  if (!session?.user?.name) {
    console.log("[api/documents/id] unauthorized - no session");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = Number(idParam);
  if (Number.isNaN(id)) {
    console.log("[api/documents/id] invalid id", idParam);
    return NextResponse.json({ error: "Invalid document id" }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { status } = body;
    console.log("[api/documents/id] updating status", {
      id,
      status,
      updatedBy: session.user.name,
    });

    const result = updateDocumentStatus(id, status, session.user.name);

    if (!result.success) {
      console.log("[api/documents/id] update failed", result.error);
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    console.log("[api/documents/id] update succeeded");
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[api/documents/id] error", err);
    return NextResponse.json({ error: "Failed to update document" }, { status: 500 });
  }
}
