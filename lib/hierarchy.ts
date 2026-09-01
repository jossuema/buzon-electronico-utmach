// Utilidades compartidas para resolver y validar la jerarquía
// Facultad → Carrera → Campus, tanto desde parámetros de URL como en el
// servidor al guardar. Los slugs de la URL solo sirven para BUSCAR: nunca se
// confía en ellos, siempre se resuelven contra la base de datos.

/** Un query param puede llegar repetido (?a=1&a=2). Toma el primero. */
export function firstParam(
  v: string | string[] | undefined
): string | undefined {
  if (Array.isArray(v)) return v[0];
  return v;
}

/** Normaliza un slug de URL. Devuelve undefined si no es un slug plausible. */
export function normalizeSlug(
  raw: string | string[] | undefined
): string | undefined {
  const v = firstParam(raw);
  if (typeof v !== "string") return undefined;
  const s = v.trim().toLowerCase();
  if (s === "" || s.length > 64) return undefined;
  return /^[a-z0-9-]+$/.test(s) ? s : undefined;
}

/**
 * Flags booleanos de la URL. `?readonly` (sin valor) cuenta como true, porque
 * quien genera el QR asume que lo activó.
 */
export function isTruthy(raw: string | string[] | undefined): boolean {
  const v = firstParam(raw);
  if (v === undefined) return false;
  const s = String(v).trim().toLowerCase();
  return s === "" || s === "true" || s === "1" || s === "si" || s === "on";
}

export type CampusResolution =
  | { kind: "single"; campusId: string } // 1 campus → se asigna solo
  | { kind: "chosen"; campusId: string } // varios y el pedido es válido
  | { kind: "pending" } // varios y el usuario debe elegir
  | { kind: "none" }; // la carrera no tiene campus activos

/**
 * Resuelve el campus de una carrera. Trabaja SIEMPRE con IDs ya resueltos
 * (nunca con slugs) para que cliente y servidor apliquen la misma regla.
 *
 * Si la carrera tiene un solo campus, ese gana aunque la URL pidiera otro:
 * la base de datos es la fuente de verdad.
 */
export function resolveCampus(
  campusIds: string[],
  requestedId?: string | null
): CampusResolution {
  if (campusIds.length === 0) return { kind: "none" };
  if (campusIds.length === 1) return { kind: "single", campusId: campusIds[0] };
  if (requestedId && campusIds.includes(requestedId)) {
    return { kind: "chosen", campusId: requestedId };
  }
  return { kind: "pending" };
}
