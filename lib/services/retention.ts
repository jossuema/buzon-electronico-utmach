import { prisma } from "@/lib/prisma";
import { retentionCutoffDate } from "@/lib/privacy";
import { purgeExpiredGuards } from "@/lib/guard";

export interface PurgeResult {
  cutoff: string;
  anonymized: number;
  guardsDeleted: number;
}

/**
 * Aplica la política de retención: elimina el correo de contacto de los aportes
 * más antiguos que el periodo permitido. El aporte se conserva (anonimizado)
 * para fines estadísticos.
 */
export async function purgeExpiredContactEmails(
  now: Date = new Date()
): Promise<PurgeResult> {
  const cutoff = retentionCutoffDate(now);

  const { count } = await prisma.submission.updateMany({
    where: {
      createdAt: { lt: cutoff },
      contactEmail: { not: null },
    },
    data: { contactEmail: null },
  });

  // Además se borran los registros antiabuso vencidos (30 días).
  const guards = await purgeExpiredGuards(now);

  return {
    cutoff: cutoff.toISOString(),
    anonymized: count,
    guardsDeleted: guards.deleted,
  };
}
