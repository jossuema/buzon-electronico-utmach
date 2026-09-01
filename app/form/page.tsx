import { existsSync } from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { SiteFooter } from "@/components/site-footer";
import { SubmissionForm } from "@/components/form/submission-form";
import { FormIntro } from "@/components/form/form-intro";
import { firstParam, isTruthy, normalizeSlug, resolveCampus } from "@/lib/hierarchy";
import type {
  CampusOption,
  CareerOption,
  FacultyOption,
  FormParams,
} from "@/lib/types";
import { SubmissionType } from "@prisma/client";

export const metadata: Metadata = { title: "Enviar aporte" };

// Los parámetros del QR no deben cachearse entre escaneos distintos.
export const dynamic = "force-dynamic";

const DEFAULT_DESCRIPTION =
  "Comparte tus quejas, sugerencias, ideas y reconocimientos. Seguimos construyendo el futuro de la Universidad Técnica de Machala";

// El logo es opcional: si el archivo no está, la intro simplemente no lo pinta
// (así nunca aparece una imagen rota).
const HAS_LOGO = existsSync(
  path.join(process.cwd(), "public", "utmach-sello.png")
);

export default async function FormPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;

  const facultySlug = normalizeSlug(sp.faculty);
  const careerSlug = normalizeSlug(sp.career);
  const campusSlug = normalizeSlug(sp.campus);
  // El tipo es un enum (admite "_"), así que no pasa por normalizeSlug.
  const typeParam = firstParam(sp.type)?.trim().toUpperCase();

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

  // --- Resolución ESTRICTAMENTE DESCENDENTE facultad → carrera → campus.
  // Si un nivel no resuelve, los inferiores se descartan por completo.
  let facultyId: string | undefined;
  let careerId: string | undefined;
  let campusId: string | undefined;
  let initialCareers: CareerOption[] = [];
  let initialCampuses: CampusOption[] = [];

  if (facultySlug) {
    const faculty = faculties.find((f) => f.slug === facultySlug);
    if (faculty) {
      facultyId = faculty.id;
      initialCareers = await prisma.career.findMany({
        where: { facultyId: faculty.id, active: true },
        orderBy: { name: "asc" },
        select: { id: true, name: true, slug: true, facultyId: true },
      });

      if (careerSlug) {
        // La carrera debe pertenecer a ESA facultad; si no, se ignora.
        const career = initialCareers.find((c) => c.slug === careerSlug);
        if (career) {
          careerId = career.id;

          const links = await prisma.careerCampus.findMany({
            where: { careerId: career.id, campus: { active: true } },
            orderBy: { campus: { name: "asc" } },
            select: { campus: { select: { id: true, name: true, slug: true } } },
          });
          initialCampuses = links.map((l) => l.campus);

          // El slug de campus solo se acepta si pertenece a la carrera.
          const requestedId = campusSlug
            ? initialCampuses.find((c) => c.slug === campusSlug)?.id
            : undefined;
          const resolved = resolveCampus(
            initialCampuses.map((c) => c.id),
            requestedId
          );
          if (resolved.kind === "single" || resolved.kind === "chosen") {
            campusId = resolved.campusId;
          }
        }
      }
    }
  }

  const type =
    typeParam && typeParam in SubmissionType
      ? (typeParam as SubmissionType)
      : undefined;

  // Un campo solo puede ocultarse si su valor SÍ se resolvió; de lo contrario
  // el QR generaría un formulario imposible de enviar (campos obligatorios).
  const params: FormParams = {
    facultyId,
    careerId,
    campusId,
    hideFaculty: isTruthy(sp.hideFaculty) && !!facultyId,
    hideCareer: isTruthy(sp.hideCareer) && !!careerId,
    readonly: isTruthy(sp.readonly),
    type,
  };

  return (
    <div className="flex min-h-screen flex-col">
      <FormIntro hasLogo={HAS_LOGO} />
      <main className="relative isolate flex-1 overflow-hidden bg-[#004a82]">
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

        <div className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6 sm:py-12">
          <div className="mb-6 text-center motion-safe:animate-fade-in-up">
            <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-medium text-white/90 shadow-sm backdrop-blur">
              <span className="flex h-2 w-2 rounded-full bg-[#53aae1]" />
              Participación estudiantil
            </span>
            <h1 className="text-balance text-2xl font-bold tracking-tight text-white sm:text-4xl">
              {globalConfig?.title ?? "Buzón Inteligente UTMACH"}
            </h1>
            <p className="mx-auto mt-2 max-w-xl text-pretty text-sm text-white/90 sm:text-base">
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
