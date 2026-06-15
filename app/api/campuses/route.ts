import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/campuses?careerId=... → campus donde se imparte ESA carrera.
// Sin careerId devuelve lista vacía (el campus depende de la carrera).
export async function GET(req: NextRequest) {
  const careerId = req.nextUrl.searchParams.get("careerId");
  if (!careerId) return NextResponse.json([]);

  const links = await prisma.careerCampus.findMany({
    where: { careerId, campus: { active: true } },
    select: { campus: { select: { id: true, name: true, slug: true } } },
    orderBy: { campus: { name: "asc" } },
  });
  return NextResponse.json(links.map((l) => l.campus));
}
