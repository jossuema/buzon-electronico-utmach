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
    careers: ["Acuicultura", "Agronomía", "Medicina Veterinaria", "Agropecuaria"],
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
      "Psicología Clínica",
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

// --- Campus (sedes) y su asignación a las carreras ---

const CAMPUSES = ["Principal", "Machala", "Agropecuaria", "Piñas", "Arenillas"];

// Campus base por facultad (la sede "natural" de sus carreras).
const FACULTY_DEFAULT_CAMPUS: Record<string, string> = {
  "ciencias-agropecuarias": "Agropecuaria",
  "ciencias-empresariales": "Principal",
  "ciencias-quimicas-y-de-la-salud": "Principal",
  "ingenieria-civil": "Principal",
  // ciencias-sociales se resuelve aparte (Principal vs Machala).
};

// Carreras de Ciencias Sociales cuya sede base es Machala (el resto: Principal).
const SOCIALES_MACHALA = [
  "Derecho",
  "Sociología",
  "Comunicación",
  "Trabajo Social",
  "Artes Plásticas y Visuales",
  "Pedagogía de las Ciencias Experimentales",
];

// Campus adicionales (extensiones) donde también se imparten ciertas carreras.
const CAMPUS_EXTRAS: Record<string, string[]> = {
  Piñas: [
    "Educación Básica",
    "Agropecuaria",
    "Contabilidad y Auditoría",
    "Ingeniería en Ciencias de datos e inteligencia artificial",
  ],
  Arenillas: [
    "Educación Básica",
    "Finanzas y Negocios Digitales",
    "Psicología Clínica",
    "Derecho",
    "Educación Inicial",
  ],
  Machala: SOCIALES_MACHALA,
};

/** Devuelve los nombres de campus donde se imparte una carrera. */
function campusesFor(facultySlug: string, careerName: string): string[] {
  const set = new Set<string>();
  if (facultySlug === "ciencias-sociales") {
    set.add(SOCIALES_MACHALA.includes(careerName) ? "Machala" : "Principal");
  } else {
    set.add(FACULTY_DEFAULT_CAMPUS[facultySlug]);
  }
  for (const [campus, list] of Object.entries(CAMPUS_EXTRAS)) {
    if (list.includes(careerName)) set.add(campus);
  }
  return [...set];
}

const FORM_TITLE = "Buzón Inteligente UTMACH";
const FORM_DESCRIPTION =
  "Comparte tus quejas, sugerencias, ideas y reconocimientos. Seguimos construyendo el futuro de la Universidad Técnica de Machala";

async function main() {
  // Campus
  const campusId = new Map<string, string>();
  for (const name of CAMPUSES) {
    const c = await prisma.campus.upsert({
      where: { slug: slugify(name) },
      update: { name },
      create: { name, slug: slugify(name) },
    });
    campusId.set(name, c.id);
  }
  console.log(`  ✓ ${CAMPUSES.length} campus`);

  for (const faculty of FACULTIES) {
    const facultySlug = slugify(faculty.name.replace(/^Facultad de\s+/i, ""));
    const createdFaculty = await prisma.faculty.upsert({
      where: { slug: facultySlug },
      update: { name: faculty.name },
      create: { name: faculty.name, slug: facultySlug },
    });

    for (const careerName of faculty.careers) {
      const careerSlug = slugify(careerName);
      const career = await prisma.career.upsert({
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

      // Sincroniza los campus de la carrera con la definición.
      const wantIds = new Set(
        campusesFor(facultySlug, careerName)
          .map((n) => campusId.get(n))
          .filter((v): v is string => Boolean(v))
      );
      for (const cid of wantIds) {
        await prisma.careerCampus.upsert({
          where: { careerId_campusId: { careerId: career.id, campusId: cid } },
          update: {},
          create: { careerId: career.id, campusId: cid },
        });
      }
      const links = await prisma.careerCampus.findMany({
        where: { careerId: career.id },
        select: { campusId: true },
      });
      for (const link of links) {
        if (!wantIds.has(link.campusId)) {
          await prisma.careerCampus.delete({
            where: {
              careerId_campusId: {
                careerId: career.id,
                campusId: link.campusId,
              },
            },
          });
        }
      }
    }

    // Elimina carreras obsoletas de esta facultad (sin aportes) → seed autoritativo.
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

  // Configuración de formulario global (crea o actualiza la descripción).
  const config = await prisma.formConfiguration.findFirst({
    where: { facultyId: null },
  });
  const configData = {
    title: FORM_TITLE,
    description: FORM_DESCRIPTION,
    allowAnonymous: true,
    active: true,
  };
  if (config) {
    await prisma.formConfiguration.update({
      where: { id: config.id },
      data: configData,
    });
    console.log("  ✓ Configuración de formulario actualizada");
  } else {
    await prisma.formConfiguration.create({
      data: { facultyId: null, ...configData },
    });
    console.log("  ✓ Configuración de formulario creada");
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
