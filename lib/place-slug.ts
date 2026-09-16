// Sin dependencias de servidor: lo usan tanto las acciones como el formulario
// del panel, que muestra el identificador mientras se escribe el nombre.

/** Mismo formato que acepta normalizeSlug al leer ?lugar= de la URL. */
export const PLACE_SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const PLACE_SLUG_MAX = 60;

/** "Baños Bloque 3 – Planta alta" → "banos-bloque-3-planta-alta" */
export function slugifyPlace(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, PLACE_SLUG_MAX)
    .replace(/-+$/g, "");
}
