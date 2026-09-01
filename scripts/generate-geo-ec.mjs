// Genera lib/geo-ec-data.ts con los rangos IP asignados a Ecuador según LACNIC.
// Uso: node scripts/generate-geo-ec.mjs
// Conviene regenerarlo cada cierto tiempo (las asignaciones cambian lentamente).

import { writeFile } from "node:fs/promises";

const SRC = "https://ftp.lacnic.net/pub/stats/lacnic/delegated-lacnic-latest";

const ipv4ToInt = (ip) =>
  ip.split(".").reduce((acc, o) => acc * 256 + Number(o), 0);

async function main() {
  const res = await fetch(SRC);
  if (!res.ok) throw new Error(`No se pudo descargar LACNIC: ${res.status}`);
  const text = await res.text();

  const v4 = [];
  const v6 = [];

  for (const line of text.split("\n")) {
    const p = line.split("|");
    // registro|cc|tipo|inicio|valor|fecha|estado
    if (p.length < 7 || p[1] !== "EC") continue;
    const status = p[6].trim();
    if (status !== "allocated" && status !== "assigned") continue;

    if (p[2] === "ipv4") {
      const start = ipv4ToInt(p[3]);
      const size = Number(p[4]);
      if (!Number.isFinite(start) || !Number.isFinite(size)) continue;
      v4.push([start, start + size - 1]);
    } else if (p[2] === "ipv6") {
      v6.push([p[3], Number(p[4])]); // prefijo, longitud
    }
  }

  // Ordena y fusiona rangos IPv4 contiguos para acelerar la búsqueda binaria.
  v4.sort((a, b) => a[0] - b[0]);
  const merged = [];
  for (const r of v4) {
    const last = merged[merged.length - 1];
    if (last && r[0] <= last[1] + 1) last[1] = Math.max(last[1], r[1]);
    else merged.push([...r]);
  }

  const out = `// GENERADO AUTOMÁTICAMENTE por scripts/generate-geo-ec.mjs — no editar a mano.
// Fuente: LACNIC delegated-latest. Rangos IP asignados a Ecuador (EC).
// Regenerar con: npm run geo:update
// Última generación: ${new Date().toISOString().slice(0, 10)}

/** Rangos IPv4 [inicio, fin] como enteros de 32 bits, ordenados y fusionados. */
export const EC_IPV4_RANGES: readonly (readonly [number, number])[] = ${JSON.stringify(merged)};

/** Prefijos IPv6 asignados a Ecuador como [prefijo, longitud]. */
export const EC_IPV6_PREFIXES: readonly (readonly [string, number])[] = ${JSON.stringify(v6)};
`;

  await writeFile("lib/geo-ec-data.ts", out);
  console.log(`✓ lib/geo-ec-data.ts`);
  console.log(`  rangos IPv4: ${merged.length} (de ${v4.length} bloques)`);
  console.log(`  prefijos IPv6: ${v6.length}`);
  const total = merged.reduce((a, [s, e]) => a + (e - s + 1), 0);
  console.log(`  direcciones IPv4 cubiertas: ${total.toLocaleString("es")}`);
}

main().catch((e) => {
  console.error("❌", e.message);
  process.exit(1);
});
