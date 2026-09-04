import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { authConfig } from "./auth.config";
import { clientIpFromForwarded } from "./request";
import {
  LOGIN_MAX_ATTEMPTS,
  LOGIN_WINDOW_MS,
  loginKey,
  rateLimit,
  rateLimitStatus,
} from "./rate-limit";

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
      authorize: async (raw, request) => {
        // Anti fuerza bruta. Va AQUÍ y no en la Server Action porque Auth.js
        // atiende también /api/auth/callback/credentials, que llega hasta este
        // punto sin pasar por la acción: con el límite solo en la acción, ese
        // camino quedaba abierto a intentos ilimitados.
        const ip = clientIpFromForwarded(
          request?.headers?.get?.("x-forwarded-for")
        );
        const key = loginKey(ip);

        if (!rateLimitStatus(key, LOGIN_MAX_ATTEMPTS).success) {
          console.warn("Acceso al panel bloqueado por exceso de intentos.");
          return null;
        }

        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) {
          rateLimit(key, LOGIN_MAX_ATTEMPTS, LOGIN_WINDOW_MS);
          return null;
        }

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

        // Solo se contabilizan los intentos FALLIDOS: si se contaran también
        // los correctos, el administrador se bloquearía a sí mismo entrando y
        // saliendo del panel.
        rateLimit(key, LOGIN_MAX_ATTEMPTS, LOGIN_WINDOW_MS);
        return null;
      },
    }),
  ],
});
