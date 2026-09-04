"use server";

import { signIn, signOut } from "@/lib/auth";
import { AuthError } from "next-auth";
import { getClientIp } from "@/lib/request";
import {
  LOGIN_MAX_ATTEMPTS,
  loginKey,
  rateLimitStatus,
} from "@/lib/rate-limit";

export type LoginState = { error?: string };

/** Inicia sesión con credenciales. Devuelve un error legible si fallan. */
export async function login(
  callbackUrl: string,
  _prev: LoginState,
  formData: FormData
): Promise<LoginState> {
  // El conteo lo hace authorize() en lib/auth.ts, que es el único punto por el
  // que pasan tanto este formulario como la ruta nativa de Auth.js. Aquí solo
  // se CONSULTA, sin gastar cupo, para poder decirle al usuario cuánto falta.
  const ip = await getClientIp();
  const rl = rateLimitStatus(loginKey(ip), LOGIN_MAX_ATTEMPTS);
  if (!rl.success) {
    const mins = Math.ceil(rl.retryAfterMs / 60000);
    return {
      error: `Demasiados intentos. Espera ${mins} minuto${mins === 1 ? "" : "s"} e inténtalo de nuevo.`,
    };
  }

  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: callbackUrl || "/dashboard",
    });
    return {};
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Correo o contraseña incorrectos" };
    }
    // signIn lanza un redirect interno que NO debe ser capturado como error.
    throw error;
  }
}

export async function logout() {
  await signOut({ redirectTo: "/" });
}
