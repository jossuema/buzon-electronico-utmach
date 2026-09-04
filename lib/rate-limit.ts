// Limitador de tasa en memoria (ventana fija por clave).
//
// Suficiente para una sola instancia de App Service (el plan actual es B1, una
// instancia). Si en el futuro se escala horizontalmente, migrar a un store
// compartido (Redis / Upstash) porque este estado es por proceso.

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();
let calls = 0;

// Limpieza perezosa para evitar crecimiento ilimitado del Map.
function sweep(now: number) {
  for (const [key, b] of buckets) {
    if (b.resetAt <= now) buckets.delete(key);
  }
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  retryAfterMs: number;
}

/**
 * Registra un intento para `key` y dice si está dentro del límite.
 * @param limit    máximo de intentos permitidos por ventana
 * @param windowMs duración de la ventana en milisegundos
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  if (++calls % 1000 === 0) sweep(now);

  const b = buckets.get(key);
  if (!b || b.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { success: true, remaining: limit - 1, retryAfterMs: 0 };
  }
  if (b.count >= limit) {
    return { success: false, remaining: 0, retryAfterMs: b.resetAt - now };
  }
  b.count += 1;
  return { success: true, remaining: limit - b.count, retryAfterMs: 0 };
}

// --- Límite de intentos de acceso al panel -----------------------------------
//
// Vive aquí, y no en la Server Action, porque Auth.js expone además la ruta
// nativa /api/auth/callback/credentials, que llega directamente a authorize()
// sin pasar por la acción. Contar en un solo sitio (authorize) es lo que hace
// que el límite cubra AMBOS caminos.

export const LOGIN_MAX_ATTEMPTS = 8;
export const LOGIN_WINDOW_MS = 15 * 60 * 1000;

export function loginKey(ip: string): string {
  return `login:${ip}`;
}

/**
 * Consulta el estado de una clave SIN registrar un intento.
 * Permite que la interfaz explique cuánto falta sin gastar cupo, dejando que
 * sea authorize() el único que cuenta.
 */
export function rateLimitStatus(key: string, limit: number): RateLimitResult {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || b.resetAt <= now) {
    return { success: true, remaining: limit, retryAfterMs: 0 };
  }
  if (b.count >= limit) {
    return { success: false, remaining: 0, retryAfterMs: b.resetAt - now };
  }
  return { success: true, remaining: limit - b.count, retryAfterMs: 0 };
}
