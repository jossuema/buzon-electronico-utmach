"use server";

import { prisma } from "@/lib/prisma";
import {
  createSubmissionSchema,
  type CreateSubmissionInput,
} from "@/lib/validations/submission";
import { getClientIp } from "@/lib/request";
import { rateLimit } from "@/lib/rate-limit";
import { resolveCampus } from "@/lib/hierarchy";
import { checkEcuadorOnly } from "@/lib/geo";
import { checkSubmissionGuards, recordSubmission } from "@/lib/guard";

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

  // Honeypot: si el campo oculto viene lleno, es un bot. Fingimos éxito para
  // no darle pistas (no se guarda nada).
  if (data.website && data.website.trim() !== "") {
    return { ok: true, id: "ok" };
  }

  const ip = await getClientIp();

  // Cortafuegos rápido en memoria (barato, frena ráfagas antes de tocar la BD).
  const burst = rateLimit(`submit:${ip}`, 10, 10 * 60 * 1000);
  if (!burst.success) {
    return {
      ok: false,
      error: "Demasiados envíos seguidos. Intenta de nuevo en unos minutos.",
    };
  }

  // Solo se aceptan envíos desde Ecuador. Si la IP no se puede determinar
  // (red local, proxy raro) NO se bloquea: es peor rechazar a un estudiante
  // real que aceptar un envío dudoso.
  if (checkEcuadorOnly(ip) === "block") {
    return {
      ok: false,
      error: "Este buzón solo admite envíos desde Ecuador.",
    };
  }

  // Límites persistentes por dispositivo, red y contenido duplicado.
  const guard = await checkSubmissionGuards(ip, data.description);
  if (!guard.ok) {
    return { ok: false, error: guard.reason };
  }

  // Si el envío es anónimo, se descarta el correo de contacto.
  const contactEmail =
    data.isAnonymous || !data.contactEmail ? null : data.contactEmail;

  // Valida la jerarquía Facultad → Carrera → Campus contra la base de datos.
  // La CARRERA es la fuente de verdad: de ella se deriva la facultad, así que
  // es imposible guardar una combinación incoherente aunque el cliente la envíe.
  const career = await prisma.career.findFirst({
    where: { id: data.careerId, active: true },
    select: {
      id: true,
      facultyId: true,
      campuses: {
        where: { campus: { active: true } },
        select: { campusId: true },
      },
    },
  });
  if (!career) {
    return { ok: false, error: "La carrera seleccionada no es válida." };
  }

  const campus = resolveCampus(
    career.campuses.map((c) => c.campusId),
    data.campusId
  );
  if (campus.kind === "none") {
    return {
      ok: false,
      error: "Esta carrera no tiene campus configurado. Avisa a la administración.",
    };
  }
  if (campus.kind === "pending") {
    return { ok: false, error: "Selecciona el campus." };
  }
  const campusId = campus.campusId;

  try {
    const submission = await prisma.submission.create({
      data: {
        type: data.type,
        facultyId: career.facultyId, // derivada de la carrera (autoritativa)
        careerId: career.id,
        campusId,
        description: data.description,
        priority: data.priority,
        contactEmail,
        metadata: { source: "web-form", anonymous: data.isAnonymous },
      },
      select: { id: true },
    });

    // Solo cuenta para los límites si el aporte se guardó de verdad.
    await recordSubmission({
      deviceHash: guard.deviceHash,
      ipHash: guard.ipHash,
      contentHash: guard.contentHash,
    });

    return { ok: true, id: submission.id };
  } catch (err) {
    console.error("Error al crear submission:", err);
    return { ok: false, error: "No se pudo registrar el aporte. Intenta de nuevo." };
  }
}
