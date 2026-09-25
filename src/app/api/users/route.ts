import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { listUsers } from "@/lib/domain/users";

export async function GET() {
  console.log("[api/users] GET request received");

  const session = await auth();
  if (!session?.user) {
    console.log("[api/users] unauthorized - no session");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const users = listUsers();
  console.log("[api/users] returning", users.length, "users");
  return NextResponse.json({ users });
}
