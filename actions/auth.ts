"use server";

import { signIn, signOut } from "@/lib/auth";
import { AuthError } from "next-auth";

export type LoginState = { error?: string };

/** Inicia sesión con credenciales. Devuelve un error legible si fallan. */
export async function login(
  callbackUrl: string,
  _prev: LoginState,
  formData: FormData
): Promise<LoginState> {
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
