import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Genera un slug legible en URL a partir de un nombre.
 * "Ingeniería en Sistemas" -> "ingenieria-en-sistemas"
 */
function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // quita acentos
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

// Oferta académica de la Universidad Técnica de Machala (UTMACH).
const FACULTIES: { name: string; careers: string[] }[] = [
  {
    name: "Facultad de Ciencias Agropecuarias",
    careers: [
      "Acuicultura",
      "Agronomía",
      "Medicina Veterinaria",
      "Agropecuaria",
    ],
  },
  {
    name: "Facultad de Ciencias Empresariales",
    careers: [
      "Administración de Empresas",
      "Administración de Hotelería y Turismo",
      "Mercadotecnia",
      "Contabilidad y Auditoría",
      "Economía",
      "Comercio Exterior",
      "Finanzas y Negocios Digitales",
      "Gestión de la Innovación Organizacional y Productividad",
    ],
  },
  {
    name: "Facultad de Ciencias Sociales",
    careers: [
      "Artes Plásticas y Visuales",
      "Pedagogía de la Actividad Física y Deporte",
      "Pedagogía de las Ciencias Experimentales",
      "Educación Básica",
      "Educación Inicial",
      "Pedagogía de los Idiomas Nacionales y Extranjeros",
      "Psicopedagogía",
      "Comunicación",
      "Derecho",
      "Sociología",
      "Trabajo Social",
    ],
  },
  {
    name: "Facultad de Ciencias Químicas y de la Salud",
    careers: [
      "Ingeniería en Alimentos",
      "Ingeniería Química",
      "Bioquímica y Farmacia",
      "Medicina",
      "Enfermería",
      "Psicología Clínica"
    ],
  },
  {
    name: "Facultad de Ingeniería Civil",
    careers: [
      "Ingeniería Civil",
      "Ingeniería en Ciencias de datos e inteligencia artificial",
      "Tecnologías de la Información",
      "Ingeniería Ambiental",
    ],
  },
];

async function main() {
  for (const faculty of FACULTIES) {
    const facultySlug = slugify(faculty.name.replace(/^Facultad de\s+/i, ""));
    const createdFaculty = await prisma.faculty.upsert({
      where: { slug: facultySlug },
      update: { name: faculty.name },
      create: { name: faculty.name, slug: facultySlug },
    });

    for (const careerName of faculty.careers) {
      const careerSlug = slugify(careerName);
      await prisma.career.upsert({
        where: {
          facultyId_slug: { facultyId: createdFaculty.id, slug: careerSlug },
        },
        update: { name: careerName },
        create: {
          name: careerName,
          slug: careerSlug,
          facultyId: createdFaculty.id,
        },
      });
    }

    // Elimina carreras obsoletas de esta facultad (las que ya no están en la
    // lista) siempre que no tengan aportes asociados. Hace el seed autoritativo.
    const validSlugs = new Set(faculty.careers.map(slugify));
    const existing = await prisma.career.findMany({
      where: { facultyId: createdFaculty.id },
      select: {
        id: true,
        name: true,
        slug: true,
        _count: { select: { submissions: true } },
      },
    });
    for (const c of existing) {
      if (validSlugs.has(c.slug)) continue;
      if (c._count.submissions > 0) {
        console.log(`    ! "${c.name}" tiene aportes; no se elimina`);
        continue;
      }
      await prisma.career.delete({ where: { id: c.id } });
      console.log(`    − carrera obsoleta eliminada: ${c.name}`);
    }

    console.log(`  ✓ ${faculty.name} (${faculty.careers.length} carreras)`);
  }

  // Configuración de formulario global
  const existingGlobalConfig = await prisma.formConfiguration.findFirst({
    where: { facultyId: null },
  });
  if (!existingGlobalConfig) {
    await prisma.formConfiguration.create({
      data: {
        facultyId: null,
        title: "Buzón Inteligente UTMACH",
        description:
          "Comparte tus quejas, sugerencias, ideas y reconocimientos. Seguimos construyendo el futuro de la Universidad Técnica de Machala.",
        allowAnonymous: true,
        active: true,
      },
    });
    console.log("  ✓ Configuración de formulario global");
  }

  console.log("✅ Seed completado.");
}

main()
  .catch((e) => {
    console.error("❌ Error en el seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
