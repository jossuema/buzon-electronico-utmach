import { z } from "zod";
import { Priority, SubmissionType } from "@prisma/client";

// DTO de creación de un aporte. Se usa tanto en el cliente (react-hook-form)
// como en el servidor (Server Action), garantizando una sola fuente de verdad.
export const createSubmissionSchema = z.object({
  type: z.nativeEnum(SubmissionType, {
    required_error: "Selecciona el tipo de aporte",
  }),
  // Obligatorios: sostienen toda la analítica por facultad/carrera/campus.
  facultyId: z.string().min(1, "Selecciona tu facultad"),
  careerId: z.string().min(1, "Selecciona tu carrera"),
  // El campus lo resuelve el servidor: si la carrera tiene uno solo lo
  // asigna automáticamente; si tiene varios, exige que venga elegido.
  campusId: z.string().optional(),
  description: z
    .string()
    .trim()
    .min(15, "Cuéntanos un poco más (mínimo 15 caracteres)")
    .max(5000, "El texto no puede superar 5000 caracteres"),
  priority: z.nativeEnum(Priority).default(Priority.MEDIA),
  contactEmail: z
    .string()
    .trim()
    .email("Correo electrónico no válido")
    .optional()
    .or(z.literal("")),
  isAnonymous: z.boolean().default(false),
  // Honeypot anti-bot: campo oculto que un humano nunca debe llenar.
  website: z.string().optional(),
  // Token de Cloudflare Turnstile. Lo aporta el widget en el cliente y lo
  // valida el servidor contra siteverify; nunca se guarda.
  turnstileToken: z.string().max(2048).optional(),
  // Lugar del QR. El servidor lo vuelve a comprobar: si no existe o está
  // desactivado, el aporte se guarda igual, sin lugar.
  placeId: z.string().max(64).optional(),
});

export type CreateSubmissionInput = z.infer<typeof createSubmissionSchema>;

// Filtros del dashboard (query params de la tabla de aportes).
export const submissionFiltersSchema = z.object({
  type: z.nativeEnum(SubmissionType).optional(),
  facultyId: z.string().optional(),
  careerId: z.string().optional(),
  placeId: z.string().max(64).optional(),
  // Se exige que sean fechas reales: un valor basura llegaba hasta
  // `new Date(...)` y hacía fallar la consulta de Prisma con un 500.
  from: z
    .string()
    .refine((v) => !Number.isNaN(Date.parse(v)), "Fecha no válida")
    .optional(),
  to: z
    .string()
    .refine((v) => !Number.isNaN(Date.parse(v)), "Fecha no válida")
    .optional(),
  q: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type SubmissionFilters = z.infer<typeof submissionFiltersSchema>;

/**
 * Lee los filtros del panel sin romper nunca la página.
 *
 * Con `.parse()` cualquier parámetro inválido lanzaba un error y el panel
 * respondía 500. Eso incluye enlaces que antes eran válidos, como
 * `?type=INVESTIGACION` tras fusionar ese tipo en PROPUESTA. Aquí se descartan
 * SOLO los parámetros que fallan y se conservan los demás filtros.
 */
export function parseSubmissionFilters(
  input: Record<string, unknown>
): SubmissionFilters {
  const first = submissionFiltersSchema.safeParse(input);
  if (first.success) return first.data;

  const clean: Record<string, unknown> = { ...input };
  for (const issue of first.error.issues) {
    const key = issue.path[0];
    if (typeof key === "string") delete clean[key];
  }
  const second = submissionFiltersSchema.safeParse(clean);
  return second.success ? second.data : submissionFiltersSchema.parse({});
}
