-- Fusiona IDEA_PROYECTO e INVESTIGACION en PROPUESTA.
--
-- PostgreSQL no permite quitar valores de un enum, así que se crea el tipo
-- nuevo y se convierte la columna. El USING que genera Prisma por defecto
-- ("type"::text::"SubmissionType_new") FALLARÍA con cualquier fila que tenga
-- uno de los valores eliminados, por eso se reasignan explícitamente aquí:
-- ningún aporte existente se pierde ni queda sin tipo.

BEGIN;

CREATE TYPE "SubmissionType_new" AS ENUM ('QUEJA', 'SUGERENCIA', 'PROPUESTA', 'RECONOCIMIENTO', 'OTRO');

ALTER TABLE "submissions"
  ALTER COLUMN "type" TYPE "SubmissionType_new"
  USING (
    CASE "type"::text
      WHEN 'IDEA_PROYECTO' THEN 'PROPUESTA'
      WHEN 'INVESTIGACION' THEN 'PROPUESTA'
      ELSE "type"::text
    END
  )::"SubmissionType_new";

ALTER TYPE "SubmissionType" RENAME TO "SubmissionType_old";
ALTER TYPE "SubmissionType_new" RENAME TO "SubmissionType";
DROP TYPE "public"."SubmissionType_old";

COMMIT;
