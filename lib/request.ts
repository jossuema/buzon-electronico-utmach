import { headers } from "next/headers";

/**
 * Obtiene la IP del cliente a partir de las cabeceras de proxy.
 * En Azure App Service la IP real llega en `x-forwarded-for`.
 *
 * Nota: `x-forwarded-for` puede falsificarse parcialmente; el rate limit por IP
 * es un disuasivo, no una garantía absoluta (combinado con el honeypot eleva
 * bastante la barrera ante bots).
 */
export async function getClientIp(): Promise<string> {
  const h = await headers();
  const fwd = h.get("x-forwarded-for");
  if (fwd) {
    const ip = fwd.split(",")[0]?.trim();
    if (ip) return ip;
  }
  return h.get("x-real-ip")?.trim() || "unknown";
}
