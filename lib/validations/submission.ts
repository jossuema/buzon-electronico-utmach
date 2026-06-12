import { z } from "zod";
import { Priority, SubmissionType } from "@prisma/client";

// DTO de creación de un aporte. Se usa tanto en el cliente (react-hook-form)
// como en el servidor (Server Action), garantizando una sola fuente de verdad.
export const createSubmissionSchema = z.object({
  type: z.nativeEnum(SubmissionType, {
    required_error: "Selecciona el tipo de aporte",
  }),
  facultyId: z.string().cuid().optional().nullable(),
  careerId: z.string().cuid().optional().nullable(),
  title: z
    .string()
    .trim()
    .min(5, "El título debe tener al menos 5 caracteres")
    .max(150, "El título no puede superar 150 caracteres"),
  description: z
    .string()
    .trim()
    .min(10, "La descripción debe tener al menos 10 caracteres")
    .max(5000, "La descripción no puede superar 5000 caracteres"),
  priority: z.nativeEnum(Priority).default(Priority.MEDIA),
  contactEmail: z
    .string()
    .trim()
    .email("Correo electrónico no válido")
    .optional()
    .or(z.literal("")),
  isAnonymous: z.boolean().default(false),
});

export type CreateSubmissionInput = z.infer<typeof createSubmissionSchema>;

// Filtros del dashboard (query params de la tabla de aportes).
export const submissionFiltersSchema = z.object({
  type: z.nativeEnum(SubmissionType).optional(),
  priority: z.nativeEnum(Priority).optional(),
  facultyId: z.string().optional(),
  careerId: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  q: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type SubmissionFilters = z.infer<typeof submissionFiltersSchema>;
