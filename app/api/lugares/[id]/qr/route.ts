import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { placeFormUrl } from "@/lib/places";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Nivel de corrección "Q" (~25 % recuperable): estos QR se pegan en baños y
// pasillos, donde se mojan, se ensucian o se rayan. La URL es corta, así que
// el código sigue siendo fácil de leer aun con esa redundancia.
const QR_OPTIONS = { errorCorrectionLevel: "Q", margin: 2 } as const;

// GET /api/lugares/:id/qr?format=png|svg&download=1  (solo administradores)
// Esta ruta está fuera de /dashboard, así que el middleware NO la protege:
// la sesión se comprueba aquí.
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const place = await prisma.place.findUnique({
    where: { id },
    select: { slug: true },
  });
  if (!place) {
    return NextResponse.json({ error: "Lugar no encontrado" }, { status: 404 });
  }

  const url = placeFormUrl(place.slug);
  if (!url) {
    return NextResponse.json(
      { error: "Falta configurar PUBLIC_BASE_URL (o AUTH_URL) con la URL pública." },
      { status: 500 }
    );
  }

  const svg = req.nextUrl.searchParams.get("format") === "svg";
  const disposition =
    req.nextUrl.searchParams.get("download") === "1" ? "attachment" : "inline";
  const filename = `qr-${place.slug}.${svg ? "svg" : "png"}`;
  const headers = {
    "Content-Disposition": `${disposition}; filename="${filename}"`,
    "Cache-Control": "private, no-store",
  };

  if (svg) {
    const body = await QRCode.toString(url, { ...QR_OPTIONS, type: "svg" });
    return new NextResponse(body, {
      headers: { ...headers, "Content-Type": "image/svg+xml; charset=utf-8" },
    });
  }

  // 1024 px: suficiente para imprimir a buen tamaño sin pixelado.
  const png = await QRCode.toBuffer(url, { ...QR_OPTIONS, type: "png", width: 1024 });
  return new NextResponse(new Uint8Array(png), {
    headers: { ...headers, "Content-Type": "image/png" },
  });
}
