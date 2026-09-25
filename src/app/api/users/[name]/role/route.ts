import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { setUserRole } from "@/lib/domain/users";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ name: string }> }
) {
  const { name } = await context.params;
  const decodedName = decodeURIComponent(name);
  console.log("[api/users/name/role] PATCH request received", decodedName);

  const session = await auth();
  if (!session?.user) {
    console.log("[api/users/name/role] unauthorized - no session");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = (session.user as { role?: string }).role;
  if (role !== "team_lead") {
    console.log("[api/users/name/role] forbidden - not team_lead", role);
    return NextResponse.json({ error: "Only a team lead can change roles" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { role: newRole } = body;
    console.log("[api/users/name/role] updating role", { name: decodedName, newRole });

    const result = setUserRole(decodedName, newRole);
    if (!result.success) {
      console.log("[api/users/name/role] update failed", result.error);
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    console.log("[api/users/name/role] update succeeded");
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[api/users/name/role] error", err);
    return NextResponse.json({ error: "Failed to update role" }, { status: 500 });
  }
}
