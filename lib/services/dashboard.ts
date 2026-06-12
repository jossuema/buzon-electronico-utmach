import { prisma } from "@/lib/prisma";
import { PRIORITY_LABELS, SUBMISSION_TYPE_LABELS } from "@/lib/constants";
import type { DashboardStats } from "@/lib/types";
import { Priority, SubmissionType } from "@prisma/client";

/**
 * Calcula los indicadores del dashboard mediante agregaciones de Prisma.
 * Centralizado aquí (capa de aplicación) para reutilizarlo y testearlo.
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  const [total, byFacultyRaw, byCareerRaw, byTypeRaw, byPriorityRaw, recent] =
    await Promise.all([
      prisma.submission.count(),
      prisma.submission.groupBy({
        by: ["facultyId"],
        _count: { _all: true },
      }),
      prisma.submission.groupBy({
        by: ["careerId"],
        _count: { _all: true },
      }),
      prisma.submission.groupBy({
        by: ["type"],
        _count: { _all: true },
      }),
      prisma.submission.groupBy({
        by: ["priority"],
        _count: { _all: true },
      }),
      prisma.submission.findMany({
        select: { createdAt: true },
        orderBy: { createdAt: "asc" },
      }),
    ]);

  // Resuelve nombres para facultades y carreras.
  const [faculties, careers] = await Promise.all([
    prisma.faculty.findMany({ select: { id: true, name: true } }),
    prisma.career.findMany({ select: { id: true, name: true } }),
  ]);

  const facultyName = new Map(faculties.map((f) => [f.id, f.name]));
  const careerName = new Map(careers.map((c) => [c.id, c.name]));

  const byFaculty = byFacultyRaw
    .map((r) => ({
      name: r.facultyId ? facultyName.get(r.facultyId) ?? "—" : "Sin facultad",
      count: r._count._all,
    }))
    .sort((a, b) => b.count - a.count);

  const byCareer = byCareerRaw
    .map((r) => ({
      name: r.careerId ? careerName.get(r.careerId) ?? "—" : "Sin carrera",
      count: r._count._all,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const byType = byTypeRaw
    .map((r) => ({
      type: r.type,
      label: SUBMISSION_TYPE_LABELS[r.type as SubmissionType],
      count: r._count._all,
    }))
    .sort((a, b) => b.count - a.count);

  const byPriority = byPriorityRaw
    .map((r) => ({
      priority: r.priority,
      label: PRIORITY_LABELS[r.priority as Priority],
      count: r._count._all,
    }))
    .sort((a, b) => b.count - a.count);

  // Evolución temporal agrupada por día (YYYY-MM-DD).
  const overTimeMap = new Map<string, number>();
  for (const row of recent) {
    const key = row.createdAt.toISOString().slice(0, 10);
    overTimeMap.set(key, (overTimeMap.get(key) ?? 0) + 1);
  }
  const overTime = Array.from(overTimeMap.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    total,
    byFaculty,
    byCareer,
    byType,
    byPriority,
    overTime,
  };
}
