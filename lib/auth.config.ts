import type { NextAuthConfig } from "next-auth";

/**
 * Configuración base de Auth.js compatible con el Edge Runtime (la usa el
 * middleware). NO incluye el provider de credenciales (que usa bcrypt / APIs de
 * Node); ese se añade en lib/auth.ts, que corre en Node.
 */
export const authConfig = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user) token.role = (user as { role?: string }).role ?? "admin";
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        (session.user as { role?: string }).role = token.role as string;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
