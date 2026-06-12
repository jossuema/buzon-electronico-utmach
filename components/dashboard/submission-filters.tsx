"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Download, X } from "lucide-react";

import {
  PRIORITIES,
  PRIORITY_LABELS,
  SUBMISSION_TYPES,
  SUBMISSION_TYPE_LABELS,
} from "@/lib/constants";
import type { FacultyOption } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ALL = "__all__";

export function SubmissionFilters({
  faculties,
}: {
  faculties: FacultyOption[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function setParam(key: string, value?: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (!value || value === ALL) params.delete(key);
    else params.set(key, value);
    params.delete("page"); // al filtrar, vuelve a la página 1
    router.push(`/dashboard/submissions?${params.toString()}`);
  }

  function get(key: string) {
    return searchParams.get(key) ?? undefined;
  }

  const exportHref = `/api/submissions/export?${searchParams.toString()}`;
  const hasFilters = Array.from(searchParams.keys()).some((k) => k !== "page");

  return (
    <div className="space-y-3 rounded-lg border bg-background p-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-1.5">
          <Label className="text-xs">Buscar</Label>
          <Input
            defaultValue={get("q")}
            placeholder="Título o descripción"
            onKeyDown={(e) => {
              if (e.key === "Enter")
                setParam("q", (e.target as HTMLInputElement).value);
            }}
          />
        </div>

        <FilterSelect
          label="Tipo"
          value={get("type")}
          onChange={(v) => setParam("type", v)}
          options={SUBMISSION_TYPES.map((t) => ({
            value: t,
            label: SUBMISSION_TYPE_LABELS[t],
          }))}
        />

        <FilterSelect
          label="Prioridad"
          value={get("priority")}
          onChange={(v) => setParam("priority", v)}
          options={PRIORITIES.map((p) => ({
            value: p,
            label: PRIORITY_LABELS[p],
          }))}
        />

        <FilterSelect
          label="Facultad"
          value={get("facultyId")}
          onChange={(v) => setParam("facultyId", v)}
          options={faculties.map((f) => ({ value: f.id, label: f.name }))}
        />

        <div className="space-y-1.5">
          <Label className="text-xs">Desde</Label>
          <Input
            type="date"
            defaultValue={get("from")}
            onChange={(e) => setParam("from", e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Hasta</Label>
          <Input
            type="date"
            defaultValue={get("to")}
            onChange={(e) => setParam("to", e.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button asChild variant="outline" size="sm">
          <a href={exportHref}>
            <Download className="h-4 w-4" /> Exportar CSV
          </a>
        </Button>
        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/dashboard/submissions")}
          >
            <X className="h-4 w-4" /> Limpiar filtros
          </Button>
        )}
      </div>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value?: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <Select value={value ?? ALL} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder="Todos" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Todos</SelectItem>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
