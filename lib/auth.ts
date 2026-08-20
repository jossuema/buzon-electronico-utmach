import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { authConfig } from "./auth.config";

// Esquema de las credenciales de acceso al dashboard.
const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

/**
 * Autenticación simple basada en un único administrador definido por variables
 * de entorno. En producción se compara contra un hash bcrypt
 * (ADMIN_PASSWORD_HASH); el texto plano (ADMIN_PASSWORD) solo es respaldo para
 * desarrollo local. Puede migrarse a SSO de la UTMACH más adelante.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Correo", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      authorize: async (raw) => {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;
        const adminEmail = process.env.ADMIN_EMAIL;
        const adminHash = process.env.ADMIN_PASSWORD_HASH;
        const adminPlain = process.env.ADMIN_PASSWORD;

        if (!adminEmail || (!adminHash && !adminPlain)) {
          console.error(
            "Falta configurar ADMIN_EMAIL y ADMIN_PASSWORD_HASH (o ADMIN_PASSWORD)"
          );
          return null;
        }

        const emailOk = email.toLowerCase() === adminEmail.toLowerCase();
        const passwordOk = adminHash
          ? await bcrypt.compare(password, adminHash)
          : password === adminPlain;

        if (emailOk && passwordOk) {
          return {
            id: "admin",
            name: "Administrador UTMACH",
            email: adminEmail,
            role: "admin",
          };
        }
        return null;
      },
    }),
  ],
});
