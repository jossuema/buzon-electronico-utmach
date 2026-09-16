import "server-only";
import { prisma } from "@/lib/prisma";
import { normalizeSlug } from "@/lib/hierarchy";

export { PLACE_SLUG_MAX, PLACE_SLUG_RE, slugifyPlace } from "@/lib/place-slug";

/**
 * URL pública que va dentro de los QR.
 *
 * Se toma de la configuración y NUNCA de la petición: un QR generado con un
 * host equivocado queda impreso y no se puede corregir. (Ya ocurrió: el
 * generador de QR apuntaba por defecto a un despliegue antiguo.)
 */
export function publicBaseUrl(): string | null {
  const raw = process.env.PUBLIC_BASE_URL || process.env.AUTH_URL;
  if (!raw) return null;
  try {
    const u = new URL(raw);
    return `${u.protocol}//${u.host}`;
  } catch {
    return null;
  }
}

export function placeFormUrl(slug: string): string | null {
  const base = publicBaseUrl();
  return base ? `${base}/form?lugar=${encodeURIComponent(slug)}` : null;
}

/**
 * Resuelve ?lugar= para el formulario. Un lugar desconocido o desactivado
 * devuelve null y el formulario funciona igual, sin lugar: un QR ya impreso
 * nunca debe llevar a una página de error.
 */
export async function findActivePlace(raw: string | string[] | undefined) {
  const slug = normalizeSlug(raw);
  if (!slug) return null;
  return prisma.place.findFirst({
    where: { slug, active: true },
    select: { id: true, name: true, defaultType: true },
  });
}
