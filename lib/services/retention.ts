import { prisma } from "@/lib/prisma";
import { retentionCutoffDate } from "@/lib/privacy";

export interface PurgeResult {
  cutoff: string;
  anonymized: number;
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

  return { cutoff: cutoff.toISOString(), anonymized: count };
}
