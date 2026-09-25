import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "./auth.config";
import { getDb } from "@/lib/db/client";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: { name: { label: "Name" } },
      authorize: async (credentials) => {
        const db = getDb();
        const user = db
          .prepare("SELECT name, role FROM users WHERE name = ?")
          .get(credentials?.name) as { name: string; role: string } | undefined;
        return user ? { id: user.name, name: user.name, role: user.role } : null;
      },
    }),
  ],
});
