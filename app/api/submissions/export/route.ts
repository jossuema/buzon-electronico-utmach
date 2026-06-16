import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { submissionFiltersSchema } from "@/lib/validations/submission";
import { getSubmissionsForExport } from "@/lib/services/submissions";
import {
  PRIORITY_LABELS,
  SUBMISSION_TYPE_LABELS,
} from "@/lib/constants";

// Escapa un valor para CSV (comillas y separadores) y neutraliza la inyección
// de fórmulas: si el texto empieza con un carácter peligroso (= + - @ TAB CR),
// se antepone un apóstrofo para que Excel/Sheets lo trate como texto.
function csvCell(value: unknown): string {
  let s = value == null ? "" : String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  if (/[",\n;]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

// GET /api/submissions/export?<filtros> → descarga CSV (solo admin).
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const filters = submissionFiltersSchema.parse(
    Object.fromEntries(req.nextUrl.searchParams)
  );
  const rows = await getSubmissionsForExport(filters);

  const headers = [
    "ID",
    "Fecha",
    "Tipo",
    "Título",
    "Prioridad",
    "Facultad",
    "Carrera",
    "Campus",
    "Correo de contacto",
  ];

  const lines = rows.map((r) =>
    [
      r.id,
      r.createdAt.toISOString(),
      SUBMISSION_TYPE_LABELS[r.type],
      r.title,
      PRIORITY_LABELS[r.priority],
      r.faculty?.name ?? "",
      r.career?.name ?? "",
      r.campus?.name ?? "",
      r.contactEmail ?? "",
    ]
      .map(csvCell)
      .join(",")
  );

  // BOM para que Excel reconozca UTF-8 (acentos).
  const csv = "﻿" + [headers.join(","), ...lines].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="aportes-utmach.csv"`,
    },
  });
}
