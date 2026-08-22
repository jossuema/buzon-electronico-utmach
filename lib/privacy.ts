// Parámetros de la política de privacidad y retención de datos.
//
// El correo de contacto es el único dato personal (PII) que recoge la
// plataforma, y es opcional. Pasado el periodo de retención se elimina
// (anonimización), conservando el aporte para fines estadísticos.

/** Meses que se conserva el correo de contacto antes de anonimizarlo. */
export const CONTACT_EMAIL_RETENTION_MONTHS = 12;

/** Fecha de la última actualización del aviso de privacidad. */
export const PRIVACY_LAST_UPDATED = "2026-08-20";

/** Correo institucional para ejercer derechos ARCO / consultas de privacidad. */
export const PRIVACY_CONTACT_EMAIL = "info@utmachala.edu.ec";

/** Fecha de corte: los correos anteriores a esta fecha deben anonimizarse. */
export function retentionCutoffDate(now: Date = new Date()): Date {
  const cutoff = new Date(now);
  cutoff.setMonth(cutoff.getMonth() - CONTACT_EMAIL_RETENTION_MONTHS);
  return cutoff;
}
