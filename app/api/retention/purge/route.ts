import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { purgeExpiredContactEmails } from "@/lib/services/retention";

export const dynamic = "force-dynamic";

/**
 * POST /api/retention/purge → aplica la política de retención de datos.
 *
 * Autorización: cabecera `Authorization: Bearer <RETENTION_TOKEN>` (para la
 * tarea programada) o una sesión de administrador activa (ejecución manual).
 */
export async function POST(req: NextRequest) {
  const token = process.env.RETENTION_TOKEN;
  const provided = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

  const byToken = Boolean(token && provided && provided === token);
  const bySession = byToken ? false : Boolean(await auth());

  if (!byToken && !bySession) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const result = await purgeExpiredContactEmails();
  console.log(
    `[retención] correos anonimizados: ${result.anonymized} (anteriores a ${result.cutoff})`
  );
  return NextResponse.json({ ok: true, ...result });
}
