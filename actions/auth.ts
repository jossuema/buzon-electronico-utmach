"use server";

import { signIn, signOut } from "@/lib/auth";
import { AuthError } from "next-auth";
import { getClientIp } from "@/lib/request";
import { rateLimit } from "@/lib/rate-limit";

export type LoginState = { error?: string };

/** Inicia sesión con credenciales. Devuelve un error legible si fallan. */
export async function login(
  callbackUrl: string,
  _prev: LoginState,
  formData: FormData
): Promise<LoginState> {
  // Anti fuerza bruta: máximo 8 intentos cada 15 minutos por IP.
  const ip = await getClientIp();
  const rl = rateLimit(`login:${ip}`, 8, 15 * 60 * 1000);
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
