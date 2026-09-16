"use server";

import { revalidatePath } from "next/cache";
import { Prisma, SubmissionType } from "@prisma/client";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PLACE_SLUG_MAX, PLACE_SLUG_RE, slugifyPlace } from "@/lib/places";

export type PlaceActionState = { ok?: boolean; error?: string; message?: string };

const PATH = "/dashboard/lugares";
/** Valor del desplegable para "no preseleccionar ningún tipo". */
const NO_TYPE = "__none__";

// Cada acción comprueba la sesión por su cuenta. El middleware ya protege
// /dashboard, pero una Server Action es un endpoint público más: si algún día
// se invocara desde otra ruta, no debe depender de esa protección.
async function isAdmin(): Promise<boolean> {
  const session = await auth();
  return Boolean(session?.user);
}

const nameSchema = z
  .string()
  .trim()
  .min(2, "El nombre debe tener al menos 2 caracteres.")
  .max(80, "El nombre no puede superar 80 caracteres.");

const idSchema = z.string().min(1).max(64);

function parseDefaultType(raw: FormDataEntryValue | null): SubmissionType | null | "invalid" {
  const v = typeof raw === "string" ? raw : "";
  if (v === "" || v === NO_TYPE) return null;
  return v in SubmissionType ? (v as SubmissionType) : "invalid";
}

export async function createPlace(
  _prev: PlaceActionState,
  formData: FormData
): Promise<PlaceActionState> {
  if (!(await isAdmin())) return { error: "Tu sesión expiró. Vuelve a iniciar sesión." };

  const name = nameSchema.safeParse(formData.get("name") ?? "");
  if (!name.success) return { error: name.error.errors[0]?.message };

  const rawSlug = String(formData.get("slug") ?? "").trim().toLowerCase();
  const slug = rawSlug || slugifyPlace(name.data);
  if (slug.length < 2 || slug.length > PLACE_SLUG_MAX || !PLACE_SLUG_RE.test(slug)) {
    return {
      error:
        "El identificador solo puede tener letras minúsculas sin tildes, números y guiones (2 a 60 caracteres).",
    };
  }

  const defaultType = parseDefaultType(formData.get("defaultType"));
  if (defaultType === "invalid") return { error: "Tipo de aporte no válido." };

  try {
    await prisma.place.create({ data: { name: name.data, slug, defaultType } });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return { error: `Ya existe un lugar con el identificador «${slug}». Usa otro.` };
    }
    console.error("Error al crear lugar:", err);
    return { error: "No se pudo crear el lugar. Inténtalo de nuevo." };
  }

  revalidatePath(PATH);
  return { ok: true, message: `Lugar «${name.data}» creado.` };
}

/**
 * Cambia el nombre y el tipo preseleccionado. El identificador NO se puede
 * cambiar: va impreso en los QR y cambiarlo dejaría inservibles los carteles.
 */
export async function updatePlace(
  _prev: PlaceActionState,
  formData: FormData
): Promise<PlaceActionState> {
  if (!(await isAdmin())) return { error: "Tu sesión expiró. Vuelve a iniciar sesión." };

  const id = idSchema.safeParse(formData.get("id"));
  if (!id.success) return { error: "Lugar no válido." };
  const name = nameSchema.safeParse(formData.get("name") ?? "");
  if (!name.success) return { error: name.error.errors[0]?.message };
  const defaultType = parseDefaultType(formData.get("defaultType"));
  if (defaultType === "invalid") return { error: "Tipo de aporte no válido." };

  const res = await prisma.place.updateMany({
    where: { id: id.data },
    data: { name: name.data, defaultType },
  });
  if (res.count === 0) return { error: "Ese lugar ya no existe." };

  revalidatePath(PATH);
  return { ok: true, message: "Cambios guardados." };
}

export async function setPlaceActive(
  _prev: PlaceActionState,
  formData: FormData
): Promise<PlaceActionState> {
  if (!(await isAdmin())) return { error: "Tu sesión expiró. Vuelve a iniciar sesión." };

  const id = idSchema.safeParse(formData.get("id"));
  if (!id.success) return { error: "Lugar no válido." };
  const active = formData.get("active") === "true";

  const res = await prisma.place.updateMany({ where: { id: id.data }, data: { active } });
  if (res.count === 0) return { error: "Ese lugar ya no existe." };

  revalidatePath(PATH);
  return { ok: true };
}

/**
 * Solo se puede eliminar un lugar SIN aportes. Si tiene, se desactiva: así
 * los aportes conservan de dónde vinieron y los gráficos siguen cuadrando.
 */
export async function deletePlace(
  _prev: PlaceActionState,
  formData: FormData
): Promise<PlaceActionState> {
  if (!(await isAdmin())) return { error: "Tu sesión expiró. Vuelve a iniciar sesión." };

  const id = idSchema.safeParse(formData.get("id"));
  if (!id.success) return { error: "Lugar no válido." };

  const place = await prisma.place.findUnique({
    where: { id: id.data },
    select: { _count: { select: { submissions: true } } },
  });
  if (!place) return { error: "Ese lugar ya no existe." };
  if (place._count.submissions > 0) {
    return {
      error: `Tiene ${place._count.submissions} aporte(s) asociados. Desactívalo en lugar de eliminarlo.`,
    };
  }

  // La condición se repite en el borrado para que un aporte que llegue justo
  // en este instante no quede huérfano.
  const res = await prisma.place.deleteMany({
    where: { id: id.data, submissions: { none: {} } },
  });
  if (res.count === 0) {
    return { error: "Acaba de recibir un aporte. Desactívalo en lugar de eliminarlo." };
  }

  revalidatePath(PATH);
  return { ok: true };
}
