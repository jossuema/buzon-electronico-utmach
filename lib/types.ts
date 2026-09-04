// Tipos compartidos entre cliente y servidor (DTOs de lectura ligeros).

export interface FacultyOption {
  id: string;
  name: string;
  slug: string;
}

export interface CareerOption {
  id: string;
  name: string;
  slug: string;
  facultyId: string;
}

export interface CampusOption {
  id: string;
  name: string;
  slug: string;
}

// Parámetros de personalización del formulario vía URL.
export interface FormParams {
  facultyId?: string;
  careerId?: string;
  campusId?: string;
  hideFaculty: boolean;
  hideCareer: boolean;
  readonly: boolean;
  type?: string;
}

export interface DashboardStats {
  total: number;
  byFaculty: { name: string; count: number }[];
  /** Top 10 para el gráfico. Para contar usa careersWithSubmissions. */
  byCareer: { name: string; count: number }[];
  /** Conteos completos: los gráficos van recortados, los KPI no deben estarlo. */
  careersWithSubmissions: number;
  facultiesWithSubmissions: number;
  byType: { type: string; label: string; count: number }[];
  byPriority: { priority: string; label: string; count: number }[];
  overTime: { date: string; count: number }[];
}
