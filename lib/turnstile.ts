import "server-only";

const SITEVERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";

/** Acción estable de esta superficie. Se compara con la que devuelve Cloudflare. */
export const TURNSTILE_ACTION = "aporte";

/** Los tokens de Turnstile rondan los 300-600 caracteres; 2048 es un techo holgado. */
const MAX_TOKEN_LENGTH = 2048;

const TIMEOUT_MS = 10_000;

/**
 * Hostnames del frontend que se aceptan como origen del widget.
 * En producción NUNCA debe incluir localhost ni 127.0.0.1.
 */
function expectedHostnames(): Set<string> {
  return new Set(
    (process.env.TURNSTILE_HOSTNAMES ?? "")
      .split(",")
      .map((h) => h.trim().toLowerCase())
      .filter(Boolean)
  );
}

/**
 * La clave pública se lee en el SERVIDOR y se pasa como prop al componente
 * cliente, en lugar de usar NEXT_PUBLIC_*. Motivo: las variables NEXT_PUBLIC_
 * se incrustan al COMPILAR, y aquí la imagen Docker se construye en GitHub
 * Actions mientras la configuración vive en Azure. Leyéndola en tiempo de
 * ejecución basta con cambiar el App Setting, sin reconstruir la imagen.
 */
export function turnstileSiteKey(): string | null {
  return process.env.TURNSTILE_SITE_KEY?.trim() || null;
}

/**
 * Estado de la configuración. Se distingue "apagado" de "mal configurado"
 * para que una configuración a medias no deje el formulario desprotegido en
 * silencio: eso se trata como error y se rechaza el envío.
 */
export function turnstileStatus(): "off" | "on" | "misconfigured" {
  const hasSecret = Boolean(process.env.TURNSTILE_SECRET?.trim());
  const hasSiteKey = Boolean(turnstileSiteKey());
  const hasHostnames = expectedHostnames().size > 0;

  if (!hasSecret && !hasSiteKey && !hasHostnames) return "off";
  if (hasSecret && hasSiteKey && hasHostnames) return "on";
  return "misconfigured";
}

export type TurnstileVerdict = { ok: true } | { ok: false; error: string };

const GENERIC_ERROR =
  "No se pudo verificar que eres una persona. Recarga la página e inténtalo de nuevo.";

/**
 * Validación canónica en servidor (siteverify). Falla cerrado ante cualquier
 * duda: error de red, respuesta no-2xx, cuerpo no JSON, acción distinta o
 * hostname no esperado.
 *
 * El token es de un solo uso: Cloudflare lo consume aquí, así que el widget
 * debe reiniciarse en el cliente después de cada intento.
 */
export async function verifyTurnstile(
  token: string | undefined,
  ip: string
): Promise<TurnstileVerdict> {
  const secret = process.env.TURNSTILE_SECRET?.trim();
  const hostnames = expectedHostnames();

  // No debería ocurrir (el llamador comprueba turnstileStatus), pero si ocurre
  // se rechaza en vez de dejar pasar el envío.
  if (!secret || hostnames.size === 0) {
    console.error("Turnstile: configuración incompleta, se rechaza el envío.");
    return { ok: false, error: GENERIC_ERROR };
  }

  if (
    typeof token !== "string" ||
    token.length === 0 ||
    token.length > MAX_TOKEN_LENGTH
  ) {
    return { ok: false, error: GENERIC_ERROR };
  }

  const body = new URLSearchParams({ secret, response: token });
  // La IP real ya viene resuelta desde la última entrada de x-forwarded-for.
  if (ip && ip !== "unknown") body.set("remoteip", ip);

  let result: {
    success?: boolean;
    action?: string;
    hostname?: string;
    "error-codes"?: string[];
  };

  try {
    const res = await fetch(SITEVERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      signal: AbortSignal.timeout(TIMEOUT_MS),
      body,
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`siteverify respondió ${res.status}`);
    result = await res.json();
  } catch (err) {
    console.error("Turnstile: fallo al llamar a siteverify:", err);
    return { ok: false, error: GENERIC_ERROR };
  }

  if (result.success !== true) {
    // Códigos de un solo uso: token ya gastado o caducado. Merece un mensaje
    // propio porque la acción del usuario es distinta (reintentar sin más).
    const codes = result["error-codes"] ?? [];
    if (
      codes.includes("timeout-or-duplicate") ||
      codes.includes("invalid-input-response")
    ) {
      return {
        ok: false,
        error: "La verificación caducó. Inténtalo de nuevo.",
      };
    }
    console.error("Turnstile: verificación fallida:", codes);
    return { ok: false, error: GENERIC_ERROR };
  }

  if (result.action !== TURNSTILE_ACTION) {
    console.error(
      `Turnstile: acción inesperada "${result.action}" (se esperaba "${TURNSTILE_ACTION}")`
    );
    return { ok: false, error: GENERIC_ERROR };
  }

  if (!hostnames.has((result.hostname ?? "").toLowerCase())) {
    console.error(`Turnstile: hostname no autorizado "${result.hostname}"`);
    return { ok: false, error: GENERIC_ERROR };
  }

  return { ok: true };
}
