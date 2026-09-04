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
import { turnstileStatus, verifyTurnstile } from "@/lib/turnstile";

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

  // Cortafuegos rápido en memoria: barato, frena una inundación antes de tocar
  // la base de datos.
  //
  // El valor es deliberadamente enorme. Estaba en 10 cada 10 minutos POR IP, y
  // como el WiFi del campus saca a miles de estudiantes por una sola IP pública
  // (y las operadoras usan CGNAT), en la práctica limitaba a toda la
  // universidad a 10 aportes cada 10 minutos: se habría autobloqueado en la
  // primera hora del lanzamiento. Quien pone el límite por persona es la cookie
  // de dispositivo en lib/guard.ts, respaldada por Turnstile; esto solo existe
  // para que una inundación no llegue a la base de datos, y por eso se queda
  // por debajo del techo persistente por hora sin llegar a estorbar nunca.
  const burst = rateLimit(`submit:${ip}`, 600, 10 * 60 * 1000);
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

  // Cloudflare Turnstile. Va ANTES de tocar la base de datos para que un bot
  // no consuma consultas, y después del filtro geográfico porque siteverify
  // cuesta una llamada de red.
  const turnstile = turnstileStatus();
  if (turnstile === "misconfigured") {
    // Configuración a medias: se falla cerrado. Es preferible un formulario
    // caído y ruidoso a uno que parece protegido y no lo está.
    console.error(
      "Turnstile mal configurado: hacen falta TURNSTILE_SITE_KEY, " +
        "TURNSTILE_SECRET y TURNSTILE_HOSTNAMES. Se rechazan los envíos."
    );
    return {
      ok: false,
      error: "El formulario no está disponible ahora mismo. Inténtalo más tarde.",
    };
  }
  if (turnstile === "on") {
    const verdict = await verifyTurnstile(data.turnstileToken, ip);
    if (!verdict.ok) {
      return { ok: false, error: verdict.error };
    }
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
