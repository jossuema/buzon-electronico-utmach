// Ejecuta la política de retención contra la base de datos configurada en
// DATABASE_URL. Uso:  npm run privacy:purge
import { purgeExpiredContactEmails } from "@/lib/services/retention";
import { prisma } from "@/lib/prisma";

purgeExpiredContactEmails()
  .then((r) => {
    console.log(
      `✅ Retención aplicada: ${r.anonymized} correo(s) anonimizado(s) (anteriores a ${r.cutoff})`
    );
  })
  .catch((e) => {
    console.error("❌ Error aplicando la retención:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
