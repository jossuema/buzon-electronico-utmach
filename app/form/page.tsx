import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { SiteFooter } from "@/components/site-footer";
import { SubmissionForm } from "@/components/form/submission-form";
import { FormIntro } from "@/components/form/form-intro";
import type { CareerOption, FacultyOption, FormParams } from "@/lib/types";
import { SubmissionType } from "@prisma/client";

export const metadata: Metadata = { title: "Enviar aporte" };

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

  // Resuelve los slugs de la URL a IDs reales.
  let facultyId: string | undefined;
  let careerId: string | undefined;
  let initialCareers: CareerOption[] = [];

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
        careerId = careers.find((c) => c.slug === careerSlug)?.id;
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
              {globalConfig?.description ??
                "Comparte tu aporte con la Universidad Técnica de Machala."}
            </p>
          </div>
          <SubmissionForm
            faculties={faculties as FacultyOption[]}
            initialCareers={initialCareers}
            params={params}
            allowAnonymous={globalConfig?.allowAnonymous ?? true}
          />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
