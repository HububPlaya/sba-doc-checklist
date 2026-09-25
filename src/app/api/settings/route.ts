import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { getAlertRecipientEmail, setAlertRecipientEmail } from "@/lib/domain/settings";

export async function GET() {
  console.log("[api/settings] GET request received");

  const session = await auth();
  if (!session?.user) {
    console.log("[api/settings] unauthorized - no session");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const email = getAlertRecipientEmail();
  console.log("[api/settings] current alert recipient", email);
  return NextResponse.json({ alertRecipientEmail: email });
}

export async function PATCH(request: NextRequest) {
  console.log("[api/settings] PATCH request received");

  const session = await auth();
  if (!session?.user) {
    console.log("[api/settings] unauthorized - no session");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = (session.user as { role?: string }).role;
  if (role !== "team_lead") {
    console.log("[api/settings] forbidden - not team_lead", role);
    return NextResponse.json({ error: "Only a team lead can change settings" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { alertRecipientEmail } = body;
    console.log("[api/settings] updating alert recipient", alertRecipientEmail);

    const result = setAlertRecipientEmail(alertRecipientEmail);
    if (!result.success) {
      console.log("[api/settings] update failed", result.error);
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    console.log("[api/settings] update succeeded");
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[api/settings] error", err);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
