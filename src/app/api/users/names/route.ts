import { NextResponse } from "next/server";
import { listUsers } from "@/lib/domain/users";

export async function GET() {
  console.log("[api/users/names] GET request received");
  const users = listUsers();
  console.log("[api/users/names] returning", users.length, "names");
  return NextResponse.json({ names: users.map((u) => u.name) });
}
