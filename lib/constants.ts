import { Priority, SubmissionType } from "@prisma/client";

// Etiquetas legibles para los tipos de aporte (capa de presentación).
export const SUBMISSION_TYPE_LABELS: Record<SubmissionType, string> = {
  QUEJA: "Queja",
  SUGERENCIA: "Sugerencia",
  PROPUESTA: "Propuesta",
  RECONOCIMIENTO: "Reconocimiento",
  OTRO: "Otro",
};

// Una línea bajo cada tarjeta del formulario. Sin ella el estudiante adivina, y
// una categoría que la gente no sabe elegir deja de ser un dato: estropea los
// gráficos por tipo y la entrada del futuro NLP. La frontera clave es
// SUGERENCIA ("que lo hagan") frente a PROPUESTA ("quiero hacerlo").
export const SUBMISSION_TYPE_DESCRIPTIONS: Record<SubmissionType, string> = {
  QUEJA: "Algo que no funciona o está mal",
  SUGERENCIA: "Una mejora que alguien debería hacer",
  PROPUESTA: "Algo que quieres impulsar o crear",
  RECONOCIMIENTO: "Algo o alguien que merece destacarse",
  OTRO: "Lo que no encaje en lo anterior",
};

// Valores que existieron antes de fusionarse en PROPUESTA. Solo sirven para que
// un enlace o un QR ya impreso con ?type=IDEA_PROYECTO siga funcionando.
export const LEGACY_SUBMISSION_TYPES: Record<string, SubmissionType> = {
  IDEA_PROYECTO: "PROPUESTA",
  INVESTIGACION: "PROPUESTA",
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
