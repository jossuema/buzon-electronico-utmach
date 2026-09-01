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

// Límites por DISPOSITIVO: aquí sí aplica "una persona".
const DEVICE_LIMITS = [
  { windowMs: 10 * 60 * 1000, max: 1, label: "10 minutos" },
  { windowMs: 24 * 60 * 60 * 1000, max: 3, label: "24 horas" },
  { windowMs: 7 * 24 * 60 * 60 * 1000, max: 8, label: "7 días" },
];

// Límites por IP: son un TECHO ANTIINUNDACIÓN, no un límite por persona.
// Deben ser holgados porque el WiFi del campus saca a cientos de estudiantes
// por una sola IP pública (NAT).
const IP_LIMITS = [
  { windowMs: 60 * 60 * 1000, max: 40, label: "1 hora" },
  { windowMs: 24 * 60 * 60 * 1000, max: 150, label: "24 horas" },
];

/** Ventana en la que un texto idéntico se considera duplicado. */
const DUPLICATE_WINDOW_MS = 24 * 60 * 60 * 1000;

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

  // 1) Duplicado exacto reciente.
  const duplicate = await prisma.submissionGuard.findFirst({
    where: {
      contentHash,
      createdAt: { gte: new Date(now - DUPLICATE_WINDOW_MS) },
    },
    select: { id: true },
  });
  if (duplicate) {
    return {
      ok: false,
      reason: "Ya recibimos un aporte con este mismo texto. Si es algo distinto, redáctalo con tus palabras.",
    };
  }

  // 2) Límites por dispositivo.
  for (const l of DEVICE_LIMITS) {
    const count = await prisma.submissionGuard.count({
      where: { deviceHash, createdAt: { gte: new Date(now - l.windowMs) } },
    });
    if (count >= l.max) {
      return {
        ok: false,
        reason:
          l.max === 1
            ? "Espera unos minutos antes de enviar otro aporte."
            : `Has alcanzado el máximo de ${l.max} aportes en ${l.label}. Podrás enviar más pasado ese tiempo.`,
      };
    }
  }

  // 3) Techo por IP (antiinundación).
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
