import { headers } from "next/headers";

/**
 * Extrae una IP de una entrada de `x-forwarded-for`, que en Azure llega con el
 * puerto pegado: "45.187.3.18:62508" o "[2800:bf0::1]:443".
 */
function stripPort(entry: string): string {
  const value = entry.trim();
  if (!value) return "";

  // IPv6 entre corchetes: [2800::1]:443 → 2800::1
  if (value.startsWith("[")) {
    const end = value.indexOf("]");
    return end > 0 ? value.slice(1, end) : "";
  }

  const colons = (value.match(/:/g) ?? []).length;
  // IPv4 con puerto (un solo ':'). Con más de uno es IPv6 sin corchetes, que no
  // lleva puerto: se devuelve tal cual.
  if (colons === 1) return value.slice(0, value.indexOf(":"));

  return value;
}

/**
 * Obtiene la IP del cliente.
 *
 * IMPORTANTE — por qué se lee la ÚLTIMA entrada y no la primera:
 * `x-forwarded-for` lo puede escribir el propio cliente. Azure App Service NO
 * lo reemplaza: AÑADE la IP real del socket al FINAL de la cadena. Es decir,
 * ante `curl -H "x-forwarded-for: 190.15.128.1"` el servidor recibe
 * "190.15.128.1, 45.187.3.18:62509".
 *
 * Leer la primera entrada haría que cualquiera pudiera declarar la IP que
 * quisiera y saltarse el filtro de Ecuador y los límites por red. La última
 * entrada es la única que escribe nuestra infraestructura, así que es la única
 * en la que se puede confiar.
 *
 * `x-real-ip` y `x-client-ip` NO se usan como respaldo: se comprobó en
 * producción que Azure los deja pasar sin sanear, así que son falsificables.
 */
export async function getClientIp(): Promise<string> {
  const h = await headers();
  const fwd = h.get("x-forwarded-for");
  if (fwd) {
    const parts = fwd.split(",");
    // Se recorre desde el final por si la última entrada viniera vacía.
    for (let i = parts.length - 1; i >= 0; i--) {
      const ip = stripPort(parts[i]!);
      if (ip) return ip;
    }
  }
  return "unknown";
}
