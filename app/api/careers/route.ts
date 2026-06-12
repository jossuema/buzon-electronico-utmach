import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/careers?facultyId=... → carreras activas de UNA facultad.
// Sin facultyId devuelve lista vacía: nunca se mezclan carreras de facultades.
export async function GET(req: NextRequest) {
  const facultyId = req.nextUrl.searchParams.get("facultyId");
  if (!facultyId) return NextResponse.json([]);

  const careers = await prisma.career.findMany({
    where: { facultyId, active: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true, facultyId: true },
  });
  return NextResponse.json(careers);
}
