"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { Loader2, Plus } from "lucide-react";

import { createPlace, type PlaceActionState } from "@/actions/places";
import { slugifyPlace } from "@/lib/place-slug";
import { SUBMISSION_TYPES, SUBMISSION_TYPE_LABELS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const NO_TYPE = "__none__";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
      Crear lugar
    </Button>
  );
}

export function PlaceCreateForm({ baseUrl }: { baseUrl: string | null }) {
  const [state, action] = useActionState<PlaceActionState, FormData>(createPlace, {});
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  // Mientras el administrador no toque el identificador, se deriva del nombre.
  const [slugTouched, setSlugTouched] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const lastState = useRef(state);

  useEffect(() => {
    if (state === lastState.current) return;
    lastState.current = state;
    if (state.ok) {
      setName("");
      setSlug("");
      setSlugTouched(false);
      setFormKey((k) => k + 1); // reinicia el desplegable de tipo
    }
  }, [state]);

  const effectiveSlug = slugTouched ? slug : slugifyPlace(name);

  return (
    <form key={formKey} action={action} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="place-name">Nombre</Label>
          <Input
            id="place-name"
            name="name"
            required
            maxLength={80}
            placeholder="Baños bloque 3 – planta alta"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="place-type">Tipo preseleccionado</Label>
          <Select name="defaultType" defaultValue={NO_TYPE}>
            <SelectTrigger id="place-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NO_TYPE}>Ninguno (lo elige el estudiante)</SelectItem>
              {SUBMISSION_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {SUBMISSION_TYPE_LABELS[t]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="place-slug">Identificador del enlace</Label>
        <Input
          id="place-slug"
          name="slug"
          maxLength={60}
          className="font-mono text-sm"
          placeholder="se genera a partir del nombre"
          value={effectiveSlug}
          onChange={(e) => {
            setSlugTouched(true);
            setSlug(e.target.value.toLowerCase());
          }}
          aria-describedby="place-slug-hint"
        />
        <p id="place-slug-hint" className="text-xs text-muted-foreground">
          Va impreso dentro del QR, así que <strong>no se puede cambiar después</strong>. El
          nombre sí.
          {baseUrl && effectiveSlug && (
            <>
              {" "}
              Enlace:{" "}
              <span className="break-all font-mono text-foreground">
                {baseUrl}/form?lugar={effectiveSlug}
              </span>
            </>
          )}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton />
        {state.error && (
          <p role="alert" className="text-sm text-destructive">
            {state.error}
          </p>
        )}
        {state.ok && state.message && (
          <p role="status" className="text-sm text-primary">
            {state.message}
          </p>
        )}
      </div>
    </form>
  );
}
