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
      "Ingeniería Acuícola",
      "Economía Agropecuaria",
      "Ingeniería Agronómica",
      "Medicina Veterinaria y Zootecnia",
    ],
  },
  {
    name: "Facultad de Ciencias Empresariales",
    careers: [
      "Administración de Empresas",
      "Administración de Hotelería y Turismo",
      "Marketing",
      "Contabilidad y Auditoría",
      "Economía",
      "Comercio Internacional",
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
      "Psicología Clínica",
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
          "Comparte tus quejas, sugerencias, ideas y reconocimientos con la Universidad Técnica de Machala.",
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
