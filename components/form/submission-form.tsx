"use client";

import { useEffect, useId, useState } from "react";
import Link from "next/link";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Award,
  CheckCircle2,
  CircleEllipsis,
  Lightbulb,
  Loader2,
  MapPin,
  MessageSquareWarning,
  Microscope,
  Rocket,
  Send,
  type LucideIcon,
} from "lucide-react";

import {
  createSubmissionSchema,
  type CreateSubmissionInput,
} from "@/lib/validations/submission";
import { createSubmission } from "@/actions/submissions";
import { useCampuses, useCareers } from "@/lib/hooks";
import { SUBMISSION_TYPES, SUBMISSION_TYPE_LABELS } from "@/lib/constants";
import { CONTACT_EMAIL_RETENTION_MONTHS } from "@/lib/privacy";
import { cn } from "@/lib/utils";
import type {
  CampusOption,
  CareerOption,
  FacultyOption,
  FormParams,
} from "@/lib/types";
import type { SubmissionType } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Iconos por tipo de aporte. Se declaran aquí (componente cliente) para no
// arrastrar lucide-react a los módulos que se importan desde el servidor.
const TYPE_ICONS: Record<SubmissionType, LucideIcon> = {
  QUEJA: MessageSquareWarning,
  SUGERENCIA: Lightbulb,
  IDEA_PROYECTO: Rocket,
  INVESTIGACION: Microscope,
  RECONOCIMIENTO: Award,
  OTRO: CircleEllipsis,
};

interface Props {
  faculties: FacultyOption[];
  initialCareers: CareerOption[];
  initialCampuses: CampusOption[];
  params: FormParams;
  allowAnonymous: boolean;
}

export function SubmissionForm({
  faculties,
  initialCareers,
  initialCampuses,
  params,
  allowAnonymous,
}: Props) {
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const radioName = useId();

  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    getValues,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CreateSubmissionInput>({
    resolver: zodResolver(createSubmissionSchema),
    defaultValues: {
      type: (params.type as CreateSubmissionInput["type"]) ?? undefined,
      facultyId: params.facultyId ?? "",
      careerId: params.careerId ?? "",
      campusId: params.campusId ?? "",
      description: "",
      priority: "MEDIA",
      contactEmail: "",
      isAnonymous: false,
      website: "", // honeypot
    },
  });

  const facultyId = watch("facultyId");
  const careerId = watch("careerId");
  const isAnonymous = watch("isAnonymous");

  // Carrera depende de facultad; campus depende de carrera.
  const { data: careers = initialCareers, isFetching: loadingCareers } =
    useCareers(facultyId || undefined);

  const {
    data: campuses = [],
    isFetching: loadingCampuses,
    isError: campusesError,
  } = useCampuses(
    careerId || undefined,
    careerId && careerId === params.careerId ? initialCampuses : undefined
  );

  // Autoselección del campus cuando la carrera tiene uno solo. Nunca se limpia
  // el valor si la consulta falló o aún carga (evita perder la selección).
  useEffect(() => {
    if (!careerId) {
      if (getValues("campusId")) setValue("campusId", "");
      return;
    }
    if (loadingCampuses || campusesError || campuses.length === 0) return;

    const current = getValues("campusId");
    if (campuses.length === 1) {
      if (current !== campuses[0].id) setValue("campusId", campuses[0].id);
    } else if (current && !campuses.some((c) => c.id === current)) {
      setValue("campusId", "");
    }
  }, [
    careerId,
    campuses,
    loadingCampuses,
    campusesError,
    getValues,
    setValue,
  ]);

  const facultyDisabled = params.readonly && !!params.facultyId;
  const careerDisabled = params.readonly && !!params.careerId;
  const campusDisabled = params.readonly && !!params.campusId;

  const singleCampus = campuses.length === 1 ? campuses[0] : null;

  async function onSubmit(values: CreateSubmissionInput) {
    // Si la carrera se imparte en varios campus, elegir uno es obligatorio.
    if (campuses.length > 1 && !values.campusId) {
      setError("campusId", {
        type: "manual",
        message: "Selecciona el campus",
      });
      return;
    }
    setServerError(null);
    const result = await createSubmission(values);
    if (result.ok) {
      setSubmitted(true);
      reset();
    } else {
      setServerError(result.error);
    }
  }

  if (submitted) {
    return (
      <div
        role="status"
        className="rounded-2xl border border-white/15 bg-card p-8 text-center shadow-[0_20px_50px_-12px_rgba(0,40,74,0.45)] ring-1 ring-black/5 sm:p-10"
      >
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <CheckCircle2 className="h-9 w-9 text-primary" />
        </div>
        <h2 className="text-2xl font-semibold">¡Aporte enviado!</h2>
        <p className="mx-auto mt-2 max-w-md text-muted-foreground">
          Gracias por contribuir a mejorar la UTMACH. Tu aporte fue registrado
          correctamente.
        </p>
        <Button className="mt-6" onClick={() => setSubmitted(false)}>
          Enviar otro aporte
        </Button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="overflow-hidden rounded-2xl border border-white/15 bg-card shadow-[0_20px_50px_-12px_rgba(0,40,74,0.45)] ring-1 ring-black/5 motion-safe:animate-fade-in-up"
    >
      <div className="h-1.5 w-full bg-gradient-to-r from-primary via-secondary to-primary" />

      <div className="space-y-5 p-5 sm:space-y-6 sm:p-8">
        {/* Honeypot anti-bot */}
        <div
          aria-hidden="true"
          className="absolute left-[-9999px] top-[-9999px] h-0 w-0 overflow-hidden"
        >
          <label htmlFor="website">No llenar este campo</label>
          <input
            id="website"
            type="text"
            tabIndex={-1}
            autoComplete="off"
            {...register("website")}
          />
        </div>

        {/* 1. Tipo de aporte — tarjetas de 1 toque */}
        <Controller
          control={control}
          name="type"
          render={({ field, fieldState }) => (
            <fieldset className="min-w-0">
              <legend className="mb-2 text-sm font-medium leading-none">
                Tipo de aporte
                <span className="ml-0.5 text-destructive" aria-hidden="true">
                  *
                </span>
              </legend>

              <div className="grid auto-rows-fr grid-cols-2 gap-2.5 sm:grid-cols-3">
                {SUBMISSION_TYPES.map((t, i) => {
                  const Icon = TYPE_ICONS[t];
                  const selected = field.value === t;
                  return (
                    <label
                      key={t}
                      className="relative flex cursor-pointer touch-manipulation select-none"
                    >
                      <input
                        type="radio"
                        name={radioName}
                        value={t}
                        checked={selected}
                        onChange={() => field.onChange(t)}
                        onBlur={field.onBlur}
                        ref={i === 0 ? field.ref : undefined}
                        aria-describedby={
                          fieldState.error ? "type-error" : undefined
                        }
                        className="peer sr-only"
                      />
                      <span
                        className={cn(
                          "flex min-h-[84px] w-full flex-col items-center justify-center gap-2 rounded-xl border px-2 py-3 text-center",
                          "transition-colors duration-150 peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2",
                          selected
                            ? "border-primary bg-primary text-primary-foreground shadow-sm"
                            : "border-border bg-muted/40 hover:border-secondary hover:bg-accent"
                        )}
                      >
                        <Icon
                          aria-hidden="true"
                          className={cn(
                            "h-6 w-6 shrink-0",
                            selected ? "text-primary-foreground" : "text-primary"
                          )}
                        />
                        <span className="text-balance text-[13px] font-semibold leading-tight sm:text-sm">
                          {SUBMISSION_TYPE_LABELS[t]}
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>

              {fieldState.error && (
                <p
                  id="type-error"
                  role="alert"
                  className="mt-2 text-sm text-destructive"
                >
                  {fieldState.error.message}
                </p>
              )}
            </fieldset>
          )}
        />

        {/* 2. Descripción — el campo protagonista */}
        <Field
          id="description"
          label="Cuéntanos qué pasó"
          error={errors.description?.message}
          required
          hint="Describe la situación con el mayor detalle posible."
        >
          <Textarea
            id="description"
            rows={6}
            className="text-base sm:text-sm"
            placeholder="Ej.: En el laboratorio 3 no funcionan los enchufes desde hace dos semanas y no podemos conectar las laptops…"
            aria-invalid={errors.description ? true : undefined}
            aria-describedby={
              errors.description ? "description-error" : "description-hint"
            }
            {...register("description")}
          />
        </Field>

        {/* 3 y 4. Facultad + Carrera */}
        <div className="grid gap-5 sm:grid-cols-2">
          {!params.hideFaculty && (
            <Field
              id="facultyId"
              label="Facultad"
              error={errors.facultyId?.message}
              required
            >
              <Controller
                control={control}
                name="facultyId"
                render={({ field }) => (
                  <Select
                    value={field.value || ""}
                    disabled={facultyDisabled}
                    onValueChange={(v) => {
                      field.onChange(v);
                      setValue("careerId", "");
                      setValue("campusId", "");
                    }}
                  >
                    <SelectTrigger
                      id="facultyId"
                      aria-invalid={errors.facultyId ? true : undefined}
                    >
                      <SelectValue placeholder="Selecciona tu facultad" />
                    </SelectTrigger>
                    <SelectContent>
                      {faculties.map((f) => (
                        <SelectItem key={f.id} value={f.id}>
                          {f.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
          )}

          {!params.hideCareer && (
            <Field
              id="careerId"
              label="Carrera"
              error={errors.careerId?.message}
              required
            >
              <Controller
                control={control}
                name="careerId"
                render={({ field }) => (
                  <Select
                    value={field.value || ""}
                    disabled={careerDisabled || !facultyId || loadingCareers}
                    onValueChange={(v) => {
                      field.onChange(v);
                      setValue("campusId", "");
                    }}
                  >
                    <SelectTrigger
                      id="careerId"
                      aria-invalid={errors.careerId ? true : undefined}
                    >
                      <SelectValue
                        placeholder={
                          !facultyId
                            ? "Primero elige facultad"
                            : loadingCareers
                              ? "Cargando carreras…"
                              : "Selecciona tu carrera"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {careers.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
          )}
        </div>

        {/* 5. Campus — SIEMPRE visible: si la carrera tiene uno solo se muestra
            fijo (para que el estudiante lo vea); si tiene varios, elige. */}
        <Field
          id="campusId"
          label="Campus"
          error={errors.campusId?.message}
          required
        >
          {singleCampus ? (
            <div
              className="flex h-10 items-center gap-2 rounded-md border border-input bg-muted/50 px-3 text-sm"
              aria-live="polite"
            >
              <MapPin className="h-4 w-4 shrink-0 text-primary" />
              <span className="font-medium">{singleCampus.name}</span>
              <span className="ml-auto text-xs text-muted-foreground">
                Único campus de esta carrera
              </span>
            </div>
          ) : (
            <Controller
              control={control}
              name="campusId"
              render={({ field }) => (
                <Select
                  value={field.value || ""}
                  disabled={campusDisabled || !careerId || loadingCampuses}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger
                    id="campusId"
                    aria-invalid={errors.campusId ? true : undefined}
                  >
                    <SelectValue
                      placeholder={
                        !careerId
                          ? "Primero elige carrera"
                          : loadingCampuses
                            ? "Cargando campus…"
                            : "Selecciona el campus"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {campuses.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          )}
        </Field>

        {/* 6. Envío anónimo */}
        {allowAnonymous && (
          <Controller
            control={control}
            name="isAnonymous"
            render={({ field }) => (
              <label className="flex cursor-pointer items-start gap-3 rounded-lg border bg-muted/30 p-4 text-sm">
                <Checkbox
                  className="mt-0.5"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
                <span>
                  <span className="font-medium">Enviar de forma anónima</span>
                  <span className="block text-muted-foreground">
                    No se guardará tu correo de contacto.
                  </span>
                </span>
              </label>
            )}
          />
        )}

        {/* 7. Correo de contacto */}
        {!isAnonymous && (
          <Field
            id="contactEmail"
            label="Correo de contacto (opcional)"
            error={errors.contactEmail?.message}
          >
            <Input
              id="contactEmail"
              type="email"
              inputMode="email"
              autoComplete="email"
              className="text-base sm:text-sm"
              placeholder="tu.correo@utmachala.edu.ec"
              {...register("contactEmail")}
            />
            <p className="text-xs text-muted-foreground">
              Solo se usa para responderte sobre este aporte y se elimina
              automáticamente a los {CONTACT_EMAIL_RETENTION_MONTHS} meses.
              Déjalo vacío si prefieres no ser contactado.
            </p>
          </Field>
        )}

        {serverError && (
          <p
            role="alert"
            className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            {serverError}
          </p>
        )}

        <p className="text-xs leading-relaxed text-muted-foreground">
          Al enviar aceptas el tratamiento de los datos de este formulario según
          el{" "}
          <Link
            href="/privacidad"
            className="font-medium text-primary underline underline-offset-2"
          >
            aviso de privacidad
          </Link>
          . No incluyas datos personales de terceros.
        </p>

        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          Enviar aporte
        </Button>
      </div>
    </form>
  );
}

function Field({
  id,
  label,
  error,
  required,
  hint,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-sm font-medium">
        {label}
        {required && (
          <span className="ml-0.5 text-destructive" aria-hidden="true">
            *
          </span>
        )}
      </Label>
      {children}
      {hint && !error && (
        <p id={`${id}-hint`} className="text-xs text-muted-foreground">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
