import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/faculties → facultades activas (ordenadas por nombre)
export async function GET() {
  const faculties = await prisma.faculty.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true },
  });
  return NextResponse.json(faculties);
}
