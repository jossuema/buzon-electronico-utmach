import { createHmac, randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

// Control antiabuso persistente (sobrevive reinicios y despliegues, a
// diferencia del limitador en memoria).
//
// PRIVACIDAD: nunca se almacenan la IP ni el identificador de dispositivo en
// claro; solo un HMAC-SHA256 con un secreto del servidor. Es irreversible sin
// ese secreto y basta para contar envíos. Los registros se purgan a los 30 días.

const DEVICE_COOKIE = "utmach_did";
const DEVICE_COOKIE_MAX_AGE = 60 * 60 * 24 * 400; // ~13 meses

/** Días que se conservan los registros antiabuso. */
export const GUARD_RETENTION_DAYS = 30;

// Límites por DISPOSITIVO: es la única capa donde "una persona" tiene sentido,
// así que es la que hace el trabajo de verdad. Generosos a propósito: un
// estudiante puede tener varias cosas distintas que contar el mismo día.
const DEVICE_LIMITS = [
  { windowMs: 2 * 60 * 1000, max: 1, label: "2 minutos" },
  { windowMs: 24 * 60 * 60 * 1000, max: 10, label: "24 horas" },
  { windowMs: 7 * 24 * 60 * 60 * 1000, max: 25, label: "7 días" },
];

// Límites por IP: TECHO ANTIINUNDACIÓN, nunca un límite por persona.
//
// Tienen que ser enormes y aquí está el porqué: el WiFi del campus saca a miles
// de estudiantes por UNA sola IP pública, y las operadoras del país (Claro,
// Movistar, CNT) usan CGNAT, así que también agrupan a miles de móviles bajo
// una misma dirección. Cualquier cifra "razonable por persona" en esta capa
// bloquea a una universidad entera. El trabajo por persona lo hacen Turnstile
// y los límites por dispositivo; esto solo frena una inundación descarada.
const IP_LIMITS = [
  { windowMs: 60 * 60 * 1000, max: 1000, label: "1 hora" },
  { windowMs: 24 * 60 * 60 * 1000, max: 6000, label: "24 horas" },
];

/** Ventana en la que un texto idéntico del MISMO dispositivo es un duplicado. */
const DUPLICATE_WINDOW_MS = 24 * 60 * 60 * 1000;

// Campaña de spam: el mismo texto repetido desde muchos dispositivos distintos.
// El umbral es alto a propósito, porque que dos o tres estudiantes describan el
// mismo problema real con las mismas palabras es normal y no debe castigarse.
const DUPLICATE_FLOOD_WINDOW_MS = 6 * 60 * 60 * 1000;
const DUPLICATE_FLOOD_MAX = 15;

function secret(): string {
  return process.env.GUARD_SECRET || process.env.AUTH_SECRET || "buzon-utmach";
}

function hash(scope: string, value: string): string {
  return createHmac("sha256", secret()).update(`${scope}:${value}`).digest("hex");
}

/** Normaliza el texto para detectar duplicados con cambios cosméticos. */
function normalizeText(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Lee (o crea) el identificador de dispositivo de la cookie.
 * La cookie es httpOnly, así que el script de la página no puede tocarla.
 */
export async function getOrCreateDeviceId(): Promise<string> {
  const jar = await cookies();
  const existing = jar.get(DEVICE_COOKIE)?.value;
  if (existing && /^[0-9a-f-]{36}$/.test(existing)) return existing;

  const id = randomUUID();
  try {
    jar.set(DEVICE_COOKIE, id, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: DEVICE_COOKIE_MAX_AGE,
    });
  } catch {
    /* si no se puede escribir la cookie, el límite recae en la IP */
  }
  return id;
}

export type GuardVerdict =
  | { ok: true; deviceHash: string; ipHash: string; contentHash: string }
  | { ok: false; reason: string };

/**
 * Comprueba los límites antes de aceptar un envío. No registra nada: eso lo
 * hace recordSubmission() solo si el aporte se guarda con éxito.
 */
export async function checkSubmissionGuards(
  ip: string,
  description: string
): Promise<GuardVerdict> {
  const deviceId = await getOrCreateDeviceId();
  const deviceHash = hash("device", deviceId);
  const ipHash = hash("ip", ip);
  const contentHash = hash("content", normalizeText(description));

  const now = Date.now();

  // 1) El MISMO dispositivo reenviando el mismo texto. Se acota al dispositivo
  //    a propósito: antes la búsqueda era global y rechazaba al segundo
  //    estudiante que reportaba un problema real con las mismas palabras,
  //    culpándole además de un envío que no era suyo.
  const ownDuplicate = await prisma.submissionGuard.findFirst({
    where: {
      contentHash,
      deviceHash,
      createdAt: { gte: new Date(now - DUPLICATE_WINDOW_MS) },
    },
    select: { id: true },
  });
  if (ownDuplicate) {
    return {
      ok: false,
      reason:
        "Este texto es idéntico a uno que ya enviaste. Si es un caso distinto, descríbelo con tus palabras.",
    };
  }

  // 2) Campaña de spam: el mismo texto repetido desde muchos dispositivos.
  const copies = await prisma.submissionGuard.count({
    where: {
      contentHash,
      createdAt: { gte: new Date(now - DUPLICATE_FLOOD_WINDOW_MS) },
    },
  });
  if (copies >= DUPLICATE_FLOOD_MAX) {
    return {
      ok: false,
      reason:
        "Este mismo texto se ha enviado muchas veces en poco tiempo. Si tu caso es real, descríbelo con tus palabras.",
    };
  }

  // 3) Límites por dispositivo.
  for (const l of DEVICE_LIMITS) {
    const count = await prisma.submissionGuard.count({
      where: { deviceHash, createdAt: { gte: new Date(now - l.windowMs) } },
    });
    if (count >= l.max) {
      return {
        ok: false,
        reason:
          l.max === 1
            ? `Espera ${l.label} antes de enviar otro aporte.`
            : `Has alcanzado el máximo de ${l.max} aportes en ${l.label}. Podrás enviar más pasado ese tiempo.`,
      };
    }
  }

  // 4) Techo por IP (antiinundación).
  for (const l of IP_LIMITS) {
    const count = await prisma.submissionGuard.count({
      where: { ipHash, createdAt: { gte: new Date(now - l.windowMs) } },
    });
    if (count >= l.max) {
      return {
        ok: false,
        reason:
          "Se recibieron demasiados aportes desde esta red en poco tiempo. Intenta de nuevo más tarde.",
      };
    }
  }

  return { ok: true, deviceHash, ipHash, contentHash };
}

/** Registra el envío aceptado para que cuente en los límites siguientes. */
export async function recordSubmission(v: {
  deviceHash: string;
  ipHash: string;
  contentHash: string;
}): Promise<void> {
  await prisma.submissionGuard.create({ data: v });
}

/** Borra los registros antiabuso que superan el periodo de retención. */
export async function purgeExpiredGuards(now: Date = new Date()) {
  const cutoff = new Date(now.getTime() - GUARD_RETENTION_DAYS * 86400000);
  const { count } = await prisma.submissionGuard.deleteMany({
    where: { createdAt: { lt: cutoff } },
  });
  return { cutoff: cutoff.toISOString(), deleted: count };
}
