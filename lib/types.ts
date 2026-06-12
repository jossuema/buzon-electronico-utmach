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

// Parámetros de personalización del formulario vía URL.
export interface FormParams {
  facultyId?: string;
  careerId?: string;
  hideFaculty: boolean;
  hideCareer: boolean;
  readonly: boolean;
  type?: string;
}

export interface DashboardStats {
  total: number;
  byFaculty: { name: string; count: number }[];
  byCareer: { name: string; count: number }[];
  byType: { type: string; label: string; count: number }[];
  byPriority: { priority: string; label: string; count: number }[];
  overTime: { date: string; count: number }[];
}
