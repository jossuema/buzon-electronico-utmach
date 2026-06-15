import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { SubmissionFilters } from "@/lib/validations/submission";

/** Construye el filtro WHERE de Prisma a partir de los filtros del dashboard. */
export function buildWhere(
  filters: SubmissionFilters
): Prisma.SubmissionWhereInput {
  const where: Prisma.SubmissionWhereInput = {};

  if (filters.type) where.type = filters.type;
  if (filters.priority) where.priority = filters.priority;
  if (filters.facultyId) where.facultyId = filters.facultyId;
  if (filters.careerId) where.careerId = filters.careerId;

  if (filters.from || filters.to) {
    where.createdAt = {};
    if (filters.from) where.createdAt.gte = new Date(filters.from);
    if (filters.to) {
      // incluye todo el día "to"
      const to = new Date(filters.to);
      to.setHours(23, 59, 59, 999);
      where.createdAt.lte = to;
    }
  }

  if (filters.q) {
    where.OR = [
      { title: { contains: filters.q, mode: "insensitive" } },
      { description: { contains: filters.q, mode: "insensitive" } },
    ];
  }

  return where;
}

const listSelect = {
  id: true,
  type: true,
  title: true,
  priority: true,
  contactEmail: true,
  createdAt: true,
  faculty: { select: { name: true } },
  career: { select: { name: true } },
  campus: { select: { name: true } },
} satisfies Prisma.SubmissionSelect;

export type SubmissionRow = Prisma.SubmissionGetPayload<{
  select: typeof listSelect;
}>;

/** Lista paginada de aportes según los filtros. */
export async function getSubmissions(filters: SubmissionFilters) {
  const where = buildWhere(filters);
  const [rows, total] = await Promise.all([
    prisma.submission.findMany({
      where,
      select: listSelect,
      orderBy: { createdAt: "desc" },
      skip: (filters.page - 1) * filters.pageSize,
      take: filters.pageSize,
    }),
    prisma.submission.count({ where }),
  ]);

  return {
    rows,
    total,
    page: filters.page,
    pageSize: filters.pageSize,
    totalPages: Math.max(1, Math.ceil(total / filters.pageSize)),
  };
}

/** Todas las filas que cumplen el filtro, para exportación CSV (sin paginar). */
export async function getSubmissionsForExport(filters: SubmissionFilters) {
  return prisma.submission.findMany({
    where: buildWhere(filters),
    select: listSelect,
    orderBy: { createdAt: "desc" },
  });
}
