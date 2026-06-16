// Genera los códigos QR de las facultades apuntando al formulario en Azure.
// Salida: qr/<slug>.png (alta resolución), qr/<slug>.svg y qr/index.html (hoja imprimible).
//
// Uso:  node scripts/generate-qr.mjs   (o:  BASE_URL=https://... node scripts/generate-qr.mjs)

import QRCode from "qrcode";
import { mkdir, writeFile } from "node:fs/promises";

const BASE_URL =
  process.env.BASE_URL ?? "https://buzon-utmach-43c0c8.azurewebsites.net";
const OUT = "qr";

// Las 5 facultades de la UTMACH (slug = el que usa el formulario).
const FACULTIES = [
  { name: "Facultad de Ciencias Agropecuarias", slug: "ciencias-agropecuarias" },
  { name: "Facultad de Ciencias Empresariales", slug: "ciencias-empresariales" },
  {
    name: "Facultad de Ciencias Químicas y de la Salud",
    slug: "ciencias-quimicas-y-de-la-salud",
  },
  { name: "Facultad de Ciencias Sociales", slug: "ciencias-sociales" },
  { name: "Facultad de Ingeniería Civil", slug: "ingenieria-civil" },
];

// Color oscuro de los módulos: navy de alto contraste (legible y on-brand).
const QR = {
  errorCorrectionLevel: "Q",
  margin: 2,
  color: { dark: "#0a2d4d", light: "#ffffff" },
};

const urlFor = (slug) => `${BASE_URL}/form?faculty=${slug}`;

function card(name, url, svg) {
  return `
    <article class="card">
      <div class="bar"></div>
      <div class="card-body">
        <p class="brand">Buzón Inteligente · UTMACH</p>
        <h2 class="fac">${name}</h2>
        <div class="qr">${svg}</div>
        <p class="cta">Escanea y envía tu aporte</p>
        <p class="url">${url}</p>
      </div>
    </article>`;
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const cards = [];

  for (const f of FACULTIES) {
    const url = urlFor(f.slug);

    // PNG de alta resolución (para imprimir o compartir).
    await QRCode.toFile(`${OUT}/${f.slug}.png`, url, {
      ...QR,
      width: 1200,
    });

    // SVG (escalable, ideal para impresión a cualquier tamaño).
    const svg = await QRCode.toString(url, { ...QR, type: "svg" });
    await writeFile(`${OUT}/${f.slug}.svg`, svg);

    cards.push(card(f.name, url, svg));
    console.log(`  ✓ ${f.name}\n      ${url}`);
  }

  const html = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>QR Buzón Inteligente UTMACH</title>
<style>
  :root { --azul:#005ca2; --celeste:#53aae1; --navy:#0a2d4d; }
  * { box-sizing: border-box; }
  body { margin:0; padding:28px; font-family: "Segoe UI", system-ui, -apple-system, sans-serif; color:#0f172a; background:#eef2f6; }
  header.page { text-align:center; margin-bottom:22px; }
  header.page h1 { margin:0; font-size:22px; color:var(--azul); }
  header.page p { margin:4px 0 0; color:#475569; font-size:14px; }
  .grid { display:grid; grid-template-columns: repeat(2, 1fr); gap:20px; max-width:1000px; margin:0 auto; }
  .card { background:#fff; border:1px solid #e2e8f0; border-radius:16px; overflow:hidden; box-shadow:0 8px 24px -12px rgba(0,40,74,.25); }
  .bar { height:8px; background:linear-gradient(90deg, var(--azul), var(--celeste), var(--azul)); }
  .card-body { padding:22px; text-align:center; }
  .brand { margin:0 0 6px; font-size:11px; letter-spacing:.16em; text-transform:uppercase; color:var(--celeste); font-weight:700; }
  .fac { margin:0 0 14px; font-size:18px; line-height:1.25; color:var(--navy); min-height:46px; }
  .qr { width:230px; height:230px; margin:0 auto; }
  .qr svg { width:100%; height:100%; display:block; }
  .cta { margin:14px 0 4px; font-weight:600; color:var(--azul); }
  .url { margin:0; font-size:11px; color:#64748b; word-break:break-all; font-family: ui-monospace, "SF Mono", Menlo, monospace; }
  @media print {
    body { background:#fff; padding:0; }
    header.page { margin:14px 0; }
    .grid { gap:14px; max-width:none; }
    .card { break-inside: avoid; box-shadow:none; }
  }
</style>
</head>
<body>
  <header class="page">
    <h1>Buzón Inteligente UTMACH</h1>
    <p>Escanea el código de tu facultad para enviar quejas, sugerencias, ideas y reconocimientos.</p>
  </header>
  <div class="grid">
    ${cards.join("\n")}
  </div>
</body>
</html>`;

  await writeFile(`${OUT}/index.html`, html);
  console.log(`\n✅ Generados en ./${OUT}/  (PNG + SVG por facultad + index.html imprimible)`);
  console.log(`   Base: ${BASE_URL}`);
}

main().catch((e) => {
  console.error("❌ Error generando QR:", e);
  process.exit(1);
});
