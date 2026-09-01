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
});

export type CreateSubmissionInput = z.infer<typeof createSubmissionSchema>;

// Filtros del dashboard (query params de la tabla de aportes).
export const submissionFiltersSchema = z.object({
  type: z.nativeEnum(SubmissionType).optional(),
  facultyId: z.string().optional(),
  careerId: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  q: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type SubmissionFilters = z.infer<typeof submissionFiltersSchema>;
