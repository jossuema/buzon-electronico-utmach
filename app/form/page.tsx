import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { SiteFooter } from "@/components/site-footer";
import { SubmissionForm } from "@/components/form/submission-form";
import { FormIntro } from "@/components/form/form-intro";
import type {
  CampusOption,
  CareerOption,
  FacultyOption,
  FormParams,
} from "@/lib/types";
import { SubmissionType } from "@prisma/client";

export const metadata: Metadata = { title: "Enviar aporte" };

const DEFAULT_DESCRIPTION =
  "Comparte tus quejas, sugerencias, ideas y reconocimientos. Seguimos construyendo el futuro de la Universidad Técnica de Machala";

// Normaliza un query param que puede venir como string | string[] | undefined.
function param(v: string | string[] | undefined): string | undefined {
  if (Array.isArray(v)) return v[0];
  return v;
}

function isTruthy(v: string | undefined): boolean {
  return v === "true" || v === "1";
}

export default async function FormPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;

  const facultySlug = param(sp.faculty);
  const careerSlug = param(sp.career);
  const campusSlug = param(sp.campus);
  const typeParam = param(sp.type)?.toUpperCase();

  // Datos base para los selectores.
  const [faculties, globalConfig] = await Promise.all([
    prisma.faculty.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true },
    }),
    prisma.formConfiguration.findFirst({
      where: { facultyId: null, active: true },
    }),
  ]);

  // Resuelve los slugs de la URL a IDs reales, respetando la jerarquía
  // facultad → carrera → campus.
  let facultyId: string | undefined;
  let careerId: string | undefined;
  let campusId: string | undefined;
  let initialCareers: CareerOption[] = [];
  let initialCampuses: CampusOption[] = [];

  if (facultySlug) {
    const faculty = faculties.find((f) => f.slug === facultySlug);
    if (faculty) {
      facultyId = faculty.id;
      // Precarga las carreras de esa facultad (sin recargar en el cliente).
      const careers = await prisma.career.findMany({
        where: { facultyId: faculty.id, active: true },
        orderBy: { name: "asc" },
        select: { id: true, name: true, slug: true, facultyId: true },
      });
      initialCareers = careers;

      if (careerSlug) {
        const career = careers.find((c) => c.slug === careerSlug);
        careerId = career?.id;

        if (careerId) {
          // Campus de la carrera seleccionada.
          const links = await prisma.careerCampus.findMany({
            where: { careerId, campus: { active: true } },
            orderBy: { campus: { name: "asc" } },
            select: { campus: { select: { id: true, name: true, slug: true } } },
          });
          initialCampuses = links.map((l) => l.campus);

          if (initialCampuses.length === 1) {
            // Un solo campus → se asigna automáticamente (no se muestra combo).
            campusId = initialCampuses[0].id;
          } else if (campusSlug) {
            // Varios campus → solo se acepta uno que pertenezca a la carrera.
            campusId = initialCampuses.find((c) => c.slug === campusSlug)?.id;
          }
        }
      }
    }
  }

  const type =
    typeParam && typeParam in SubmissionType
      ? (typeParam as SubmissionType)
      : undefined;

  const params: FormParams = {
    facultyId,
    careerId,
    campusId,
    hideFaculty: isTruthy(param(sp.hideFaculty)),
    hideCareer: isTruthy(param(sp.hideCareer)),
    readonly: isTruthy(param(sp.readonly)),
    type,
  };

  return (
    <div className="flex min-h-screen flex-col">
      {/* Animación de apertura a nivel raíz para cubrir toda la pantalla. */}
      <FormIntro />
      <main className="relative isolate flex-1 overflow-hidden bg-[#004a82]">
        {/* Capas del fondo azul institucional */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(180deg,#005ca2_0%,#005ca2_28%,#004a82_100%)]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 bg-[radial-gradient(60%_120%_at_50%_-20%,rgba(83,170,225,0.32),transparent_70%)]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[2px] bg-[#C2354A]/70"
        />

        <div className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6 sm:py-14">
          <div className="mb-8 text-center motion-safe:animate-fade-in-up">
            <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-medium text-white/90 shadow-sm backdrop-blur">
              <span className="flex h-2 w-2 rounded-full bg-[#53aae1]" />
              Participación estudiantil
            </span>
            <h1 className="text-balance text-3xl font-bold tracking-tight text-white sm:text-4xl">
              {globalConfig?.title ?? "Buzón Inteligente UTMACH"}
            </h1>
            <p className="mx-auto mt-3 max-w-xl text-pretty text-white/90">
              {globalConfig?.description ?? DEFAULT_DESCRIPTION}
            </p>
          </div>
          <SubmissionForm
            faculties={faculties as FacultyOption[]}
            initialCareers={initialCareers}
            initialCampuses={initialCampuses}
            params={params}
            allowAnonymous={globalConfig?.allowAnonymous ?? true}
          />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
