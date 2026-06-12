import { Priority, SubmissionType } from "@prisma/client";

// Etiquetas legibles para los tipos de aporte (capa de presentación).
export const SUBMISSION_TYPE_LABELS: Record<SubmissionType, string> = {
  QUEJA: "Queja",
  SUGERENCIA: "Sugerencia",
  IDEA_PROYECTO: "Idea de proyecto",
  INVESTIGACION: "Investigación",
  RECONOCIMIENTO: "Reconocimiento",
  OTRO: "Otro",
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  BAJA: "Baja",
  MEDIA: "Media",
  ALTA: "Alta",
  CRITICA: "Crítica",
};

// Colores para badges de prioridad (clases de Tailwind).
export const PRIORITY_COLORS: Record<Priority, string> = {
  BAJA: "bg-slate-100 text-slate-700 border-slate-200",
  MEDIA: "bg-blue-100 text-blue-700 border-blue-200",
  ALTA: "bg-amber-100 text-amber-700 border-amber-200",
  CRITICA: "bg-red-100 text-red-700 border-red-200",
};

export const SUBMISSION_TYPES = Object.keys(
  SUBMISSION_TYPE_LABELS
) as SubmissionType[];

export const PRIORITIES = Object.keys(PRIORITY_LABELS) as Priority[];
