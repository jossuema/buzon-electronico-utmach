"use client";

import { useQuery } from "@tanstack/react-query";
import type { CampusOption, CareerOption, FacultyOption } from "@/lib/types";

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Error al cargar ${url}`);
  return res.json() as Promise<T>;
}

/** Facultades activas. */
export function useFaculties(initialData?: FacultyOption[]) {
  return useQuery({
    queryKey: ["faculties"],
    queryFn: () => fetchJson<FacultyOption[]>("/api/faculties"),
    initialData,
  });
}

/**
 * Carreras de una facultad. La query se deshabilita si no hay facultad,
 * y se precarga automáticamente cuando la facultad llega desde la URL.
 */
export function useCareers(facultyId?: string) {
  return useQuery({
    queryKey: ["careers", facultyId],
    queryFn: () =>
      fetchJson<CareerOption[]>(`/api/careers?facultyId=${facultyId}`),
    enabled: !!facultyId,
  });
}

/**
 * Campus de una carrera. La query se deshabilita si no hay carrera. Si la
 * carrera tiene un solo campus, el formulario lo selecciona automáticamente.
 */
export function useCampuses(careerId?: string, initialData?: CampusOption[]) {
  return useQuery({
    queryKey: ["campuses", careerId],
    queryFn: () =>
      fetchJson<CampusOption[]>(`/api/campuses?careerId=${careerId}`),
    enabled: !!careerId,
    initialData,
  });
}
