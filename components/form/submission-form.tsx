"use client";

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Loader2, Send } from "lucide-react";

import {
  createSubmissionSchema,
  type CreateSubmissionInput,
} from "@/lib/validations/submission";
import { createSubmission } from "@/actions/submissions";
import { useCampuses, useCareers } from "@/lib/hooks";
import { SUBMISSION_TYPES, SUBMISSION_TYPE_LABELS } from "@/lib/constants";
import type {
  CampusOption,
  CareerOption,
  FacultyOption,
  FormParams,
} from "@/lib/types";

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

  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    getValues,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateSubmissionInput>({
    resolver: zodResolver(createSubmissionSchema),
    defaultValues: {
      type: (params.type as CreateSubmissionInput["type"]) ?? undefined,
      facultyId: params.facultyId ?? null,
      careerId: params.careerId ?? null,
      campusId: params.campusId ?? null,
      title: "",
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

  // Carreras dependientes de la facultad seleccionada. initialCareers precarga
  // las carreras cuando la facultad llega desde la URL (sin recargar la página).
  const { data: careers = initialCareers, isFetching: loadingCareers } =
    useCareers(facultyId ?? undefined);

  // Campus dependientes de la carrera. Solo se muestra el combo si la carrera
  // tiene MÁS de un campus; con uno solo se asigna automáticamente.
  const { data: campuses = [], isFetching: loadingCampuses } = useCampuses(
    careerId ?? undefined,
    careerId && careerId === params.careerId ? initialCampuses : undefined
  );

  useEffect(() => {
    if (loadingCampuses) return;
    const current = getValues("campusId");
    if (!careerId) {
      if (current) setValue("campusId", null);
    } else if (campuses.length === 1) {
      if (current !== campuses[0].id) setValue("campusId", campuses[0].id);
    } else if (campuses.length === 0) {
      if (current) setValue("campusId", null);
    } else if (current && !campuses.some((c) => c.id === current)) {
      setValue("campusId", null);
    }
  }, [careerId, campuses, loadingCampuses, getValues, setValue]);

  const facultyDisabled = params.readonly && !!params.facultyId;
  const careerDisabled = params.readonly && !!params.careerId;
  const campusDisabled = params.readonly && !!params.campusId;

  async function onSubmit(values: CreateSubmissionInput) {
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
      <div className="rounded-2xl border border-white/15 bg-card p-8 text-center shadow-[0_20px_50px_-12px_rgba(0,40,74,0.45)] ring-1 ring-black/5 sm:p-10">
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
      {/* Franja superior de marca */}
      <div className="h-1.5 w-full bg-gradient-to-r from-primary via-secondary to-primary" />

      <div className="space-y-6 p-6 sm:p-8">
        {/* Honeypot anti-bot: oculto a personas, los bots lo llenan. */}
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

        {/* Tipo de aporte */}
        <Field label="Tipo de aporte" error={errors.type?.message} required>
          <Controller
            control={control}
            name="type"
            render={({ field }) => (
              <Select value={field.value ?? ""} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona el tipo de aporte" />
                </SelectTrigger>
                <SelectContent>
                  {SUBMISSION_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {SUBMISSION_TYPE_LABELS[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </Field>

        {/* Facultad + Carrera (cascada) */}
        {(!params.hideFaculty || !params.hideCareer) && (
          <div className="grid gap-6 sm:grid-cols-2">
            {!params.hideFaculty && (
              <Field label="Facultad" error={errors.facultyId?.message}>
                <Controller
                  control={control}
                  name="facultyId"
                  render={({ field }) => (
                    <Select
                      value={field.value ?? ""}
                      disabled={facultyDisabled}
                      onValueChange={(v) => {
                        field.onChange(v);
                        setValue("careerId", null);
                        setValue("campusId", null);
                      }}
                    >
                      <SelectTrigger>
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
              <Field label="Carrera" error={errors.careerId?.message}>
                <Controller
                  control={control}
                  name="careerId"
                  render={({ field }) => (
                    <Select
                      value={field.value ?? ""}
                      disabled={careerDisabled || !facultyId || loadingCareers}
                      onValueChange={(v) => {
                        field.onChange(v);
                        setValue("campusId", null);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            !facultyId
                              ? "Primero elige facultad"
                              : loadingCareers
                                ? "Cargando carreras..."
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
        )}

        {/* Campus: solo aparece si la carrera se imparte en más de un campus.
            Con un único campus se asigna automáticamente y no se muestra. */}
        {careerId && !loadingCampuses && campuses.length > 1 && (
          <Field label="Campus" error={errors.campusId?.message} required>
            <Controller
              control={control}
              name="campusId"
              render={({ field }) => (
                <Select
                  value={field.value ?? ""}
                  disabled={campusDisabled}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona el campus" />
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
          </Field>
        )}

        {/* Título */}
        <Field label="Título" error={errors.title?.message} required>
          <Input
            placeholder="Resume tu aporte en una frase"
            {...register("title")}
          />
        </Field>

        {/* Descripción */}
        <Field label="Descripción" error={errors.description?.message} required>
          <Textarea
            rows={5}
            placeholder="Describe con detalle tu queja, sugerencia, idea o reconocimiento"
            {...register("description")}
          />
        </Field>

        {/* Envío anónimo */}
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

        {/* Correo de contacto */}
        {!isAnonymous && (
          <Field
            label="Correo de contacto (opcional)"
            error={errors.contactEmail?.message}
          >
            <Input
              type="email"
              placeholder="tu.correo@utmachala.edu.ec"
              {...register("contactEmail")}
            />
          </Field>
        )}

        {serverError && (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {serverError}
          </p>
        )}

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
  label,
  error,
  required,
  children,
}: {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">
        {label}
        {required && <span className="ml-0.5 text-destructive">*</span>}
      </Label>
      {children}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
