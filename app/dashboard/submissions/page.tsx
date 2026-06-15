import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { submissionFiltersSchema } from "@/lib/validations/submission";
import { getSubmissions } from "@/lib/services/submissions";
import { SubmissionFilters } from "@/components/dashboard/submission-filters";
import {
  PRIORITY_COLORS,
  PRIORITY_LABELS,
  SUBMISSION_TYPE_LABELS,
} from "@/lib/constants";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { FacultyOption } from "@/lib/types";

export const metadata: Metadata = { title: "Aportes" };
export const dynamic = "force-dynamic";

export default async function SubmissionsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const filters = submissionFiltersSchema.parse(sp);

  const [data, faculties] = await Promise.all([
    getSubmissions(filters),
    prisma.faculty.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true },
    }),
  ]);

  const fmt = new Intl.DateTimeFormat("es-EC", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  function pageHref(page: number) {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(sp)) {
      if (typeof v === "string") params.set(k, v);
    }
    params.set("page", String(page));
    return `/dashboard/submissions?${params.toString()}`;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Aportes</h1>
        <p className="text-muted-foreground">
          {data.total} aporte{data.total === 1 ? "" : "s"} en total.
        </p>
      </div>

      <SubmissionFilters faculties={faculties as FacultyOption[]} />

      <div className="rounded-lg border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Título</TableHead>
              <TableHead>Facultad</TableHead>
              <TableHead>Carrera</TableHead>
              <TableHead>Campus</TableHead>
              <TableHead>Prioridad</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-10 text-center text-muted-foreground"
                >
                  No hay aportes que coincidan con los filtros.
                </TableCell>
              </TableRow>
            ) : (
              data.rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {fmt.format(r.createdAt)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="muted">
                      {SUBMISSION_TYPE_LABELS[r.type]}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-xs">
                    <span className="font-medium">{r.title}</span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {r.faculty?.name ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {r.career?.name ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {r.campus?.name ?? "—"}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${PRIORITY_COLORS[r.priority]}`}
                    >
                      {PRIORITY_LABELS[r.priority]}
                    </span>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Paginación */}
      {data.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Página {data.page} de {data.totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              asChild
              variant="outline"
              size="sm"
              disabled={data.page <= 1}
            >
              <Link href={pageHref(data.page - 1)}>Anterior</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="sm"
              disabled={data.page >= data.totalPages}
            >
              <Link href={pageHref(data.page + 1)}>Siguiente</Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
