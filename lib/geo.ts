import { EC_IPV4_RANGES, EC_IPV6_PREFIXES } from "./geo-ec-data";

// Comprobación de país sin servicios externos: los rangos IP asignados a
// Ecuador (LACNIC) van embebidos, así que la consulta es local, instantánea y
// no envía la IP de nadie a terceros.

function ipv4ToInt(ip: string): number | null {
  const parts = ip.split(".");
  if (parts.length !== 4) return null;
  let n = 0;
  for (const p of parts) {
    const o = Number(p);
    if (!Number.isInteger(o) || o < 0 || o > 255 || p === "") return null;
    n = n * 256 + o;
  }
  return n;
}

/** Expande una IPv6 (admite "::") a un BigInt de 128 bits. */
function ipv6ToBigInt(ip: string): bigint | null {
  const clean = ip.split("%")[0];
  if (!clean.includes(":")) return null;

  // IPv4 mapeada (::ffff:1.2.3.4)
  const v4 = clean.match(/(\d+\.\d+\.\d+\.\d+)$/);
  let head = clean;
  let tail4: number | null = null;
  if (v4) {
    tail4 = ipv4ToInt(v4[1]);
    if (tail4 === null) return null;
    head = clean.slice(0, clean.length - v4[1].length);
  }

  const [left, right = ""] = head.split("::");
  const lg = left.split(":").filter(Boolean);
  const rg = right.split(":").filter(Boolean);
  const groups: string[] = [];
  if (head.includes("::")) {
    const fill = 8 - lg.length - rg.length - (tail4 !== null ? 2 : 0);
    if (fill < 0) return null;
    groups.push(...lg, ...Array(fill).fill("0"), ...rg);
  } else {
    groups.push(...lg, ...rg);
  }
  if (tail4 !== null) {
    groups.push(((tail4 >>> 16) & 0xffff).toString(16));
    groups.push((tail4 & 0xffff).toString(16));
  }
  if (groups.length !== 8) return null;

  let n = 0n;
  for (const g of groups) {
    if (!/^[0-9a-fA-F]{1,4}$/.test(g)) return null;
    n = (n << 16n) | BigInt(parseInt(g, 16));
  }
  return n;
}

/** ¿La IP pertenece a un rango asignado a Ecuador? */
export function isEcuadorIp(ip: string): boolean {
  const v4 = ipv4ToInt(ip);
  if (v4 !== null) {
    // Búsqueda binaria sobre los rangos ordenados.
    let lo = 0;
    let hi = EC_IPV4_RANGES.length - 1;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      const [start, end] = EC_IPV4_RANGES[mid];
      if (v4 < start) hi = mid - 1;
      else if (v4 > end) lo = mid + 1;
      else return true;
    }
    return false;
  }

  const v6 = ipv6ToBigInt(ip);
  if (v6 === null) return false;
  for (const [prefix, len] of EC_IPV6_PREFIXES) {
    const base = ipv6ToBigInt(prefix);
    if (base === null) continue;
    const shift = BigInt(128 - len);
    if (v6 >> shift === base >> shift) return true;
  }
  return false;
}

export type GeoDecision = "allow" | "block" | "unknown";

/**
 * Decide si se acepta un envío según el país de origen.
 * Si la IP no se puede determinar (proxy raro, red local), NO se bloquea:
 * más vale dejar pasar un envío dudoso que rechazar a un estudiante real.
 */
export function checkEcuadorOnly(ip: string | undefined): GeoDecision {
  if (!ip || ip === "unknown") return "unknown";
  // Redes privadas/locales (desarrollo, pruebas internas): se permiten.
  if (
    ip === "::1" ||
    ip === "127.0.0.1" ||
    ip.startsWith("10.") ||
    ip.startsWith("192.168.") ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(ip)
  ) {
    return "unknown";
  }
  return isEcuadorIp(ip) ? "allow" : "block";
}
