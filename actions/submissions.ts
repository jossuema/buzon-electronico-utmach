"use server";

import { prisma } from "@/lib/prisma";
import {
  createSubmissionSchema,
  type CreateSubmissionInput,
} from "@/lib/validations/submission";

export type SubmissionActionResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

/**
 * Crea un aporte. Valida de nuevo en el servidor (la validación de cliente es
 * solo UX).
 */
export async function createSubmission(
  input: CreateSubmissionInput
): Promise<SubmissionActionResult> {
  const parsed = createSubmissionSchema.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.errors[0];
    return { ok: false, error: first?.message ?? "Datos inválidos" };
  }

  const data = parsed.data;

  // Si el envío es anónimo, se descarta el correo de contacto.
  const contactEmail =
    data.isAnonymous || !data.contactEmail ? null : data.contactEmail;

  // Resuelve el campus respetando la jerarquía carrera → campus:
  // - si la carrera tiene un solo campus, se asigna automáticamente;
  // - si tiene varios, solo se acepta un campusId que pertenezca a la carrera.
  let campusId: string | null = null;
  if (data.careerId) {
    const links = await prisma.careerCampus.findMany({
      where: { careerId: data.careerId },
      select: { campusId: true },
    });
    if (links.length === 1) {
      campusId = links[0].campusId;
    } else if (
      data.campusId &&
      links.some((l) => l.campusId === data.campusId)
    ) {
      campusId = data.campusId;
    }
  }

  try {
    const submission = await prisma.submission.create({
      data: {
        type: data.type,
        facultyId: data.facultyId || null,
        careerId: data.careerId || null,
        campusId,
        title: data.title,
        description: data.description,
        priority: data.priority,
        contactEmail,
        metadata: { source: "web-form", anonymous: data.isAnonymous },
      },
      select: { id: true },
    });

    return { ok: true, id: submission.id };
  } catch (err) {
    console.error("Error al crear submission:", err);
    return { ok: false, error: "No se pudo registrar el aporte. Intenta de nuevo." };
  }
}
