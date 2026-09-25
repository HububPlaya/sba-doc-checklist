import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { bulkUpdateDocumentStatusByIds } from "@/lib/domain/documentUpdates";

export async function PATCH(request: NextRequest) {
  console.log("[api/documents/bulk] PATCH request received");

  const session = await auth();
  if (!session?.user?.name) {
    console.log("[api/documents/bulk] unauthorized - no session");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { ids, status } = body;

    if (!Array.isArray(ids) || ids.length === 0) {
      console.log("[api/documents/bulk] invalid ids", ids);
      return NextResponse.json({ error: "No document ids provided" }, { status: 400 });
    }

    console.log("[api/documents/bulk] bulk updating", {
      ids,
      status,
      updatedBy: session.user.name,
    });

    const result = bulkUpdateDocumentStatusByIds(ids, status, session.user.name);

    if (!result.success) {
      console.log("[api/documents/bulk] bulk update failed", result.error);
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    console.log("[api/documents/bulk] bulk update succeeded", result.count);
    return NextResponse.json({ success: true, count: result.count });
  } catch (err) {
    console.error("[api/documents/bulk] error", err);
    return NextResponse.json({ error: "Failed to update documents" }, { status: 500 });
  }
}
