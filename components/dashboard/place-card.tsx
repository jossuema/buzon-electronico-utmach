"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { useFormStatus } from "react-dom";
import { Check, Copy, Download, Loader2, Pencil, Power, Trash2, X } from "lucide-react";
import type { SubmissionType } from "@prisma/client";

import {
  deletePlace,
  setPlaceActive,
  updatePlace,
  type PlaceActionState,
} from "@/actions/places";
import { SUBMISSION_TYPES, SUBMISSION_TYPE_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
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

export interface PlaceCardData {
  id: string;
  name: string;
  slug: string;
  defaultType: SubmissionType | null;
  active: boolean;
  submissions: number;
}

function Pending({ icon, children, ...props }: React.ComponentProps<typeof Button> & { icon: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} {...props}>
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : icon}
      {children}
    </Button>
  );
}

export function PlaceCard({ place, url }: { place: PlaceCardData; url: string | null }) {
  const [editing, setEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [editState, editAction] = useActionState<PlaceActionState, FormData>(updatePlace, {});
  const [toggleState, toggleAction] = useActionState<PlaceActionState, FormData>(setPlaceActive, {});
  const [deleteState, deleteAction] = useActionState<PlaceActionState, FormData>(deletePlace, {});

  useEffect(() => {
    if (editState.ok) setEditing(false);
  }, [editState]);

  async function copy() {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* el navegador no dio permiso: el enlace sigue visible para copiarlo a mano */
    }
  }

  const error = editState.error ?? toggleState.error ?? deleteState.error;
  const qr = `/api/lugares/${place.id}/qr`;

  return (
    <li
      className={cn(
        "rounded-xl border bg-background p-4 sm:p-5",
        !place.active && "bg-muted/40"
      )}
    >
      <div className="flex gap-4">
        {/* Vista previa del QR (misma URL que se imprime) */}
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`${qr}?format=svg`}
            alt={`Código QR de ${place.name}`}
            width={76}
            height={76}
            className={cn(
              "h-[76px] w-[76px] shrink-0 rounded-md border bg-white p-1",
              !place.active && "opacity-40 grayscale"
            )}
          />
        ) : (
          <div className="h-[76px] w-[76px] shrink-0 rounded-md border border-dashed" />
        )}

        <div className="min-w-0 flex-1 space-y-2">
          {editing ? (
            <form action={editAction} className="space-y-3">
              <input type="hidden" name="id" value={place.id} />
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor={`name-${place.id}`} className="text-xs">
                    Nombre
                  </Label>
                  <Input
                    id={`name-${place.id}`}
                    name="name"
                    defaultValue={place.name}
                    required
                    maxLength={80}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor={`type-${place.id}`} className="text-xs">
                    Tipo preseleccionado
                  </Label>
                  <Select name="defaultType" defaultValue={place.defaultType ?? NO_TYPE}>
                    <SelectTrigger id={`type-${place.id}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NO_TYPE}>Ninguno</SelectItem>
                      {SUBMISSION_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>
                          {SUBMISSION_TYPE_LABELS[t]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                El identificador <span className="font-mono">{place.slug}</span> no cambia:
                los QR ya impresos siguen funcionando.
              </p>
              <div className="flex gap-2">
                <Pending size="sm" icon={<Check className="h-4 w-4" />}>
                  Guardar
                </Pending>
                <Button type="button" size="sm" variant="ghost" onClick={() => setEditing(false)}>
                  <X className="h-4 w-4" /> Cancelar
                </Button>
              </div>
            </form>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-semibold leading-tight">{place.name}</h3>
                {place.active ? (
                  <Badge variant="secondary">Activo</Badge>
                ) : (
                  <Badge variant="muted">Inactivo</Badge>
                )}
              </div>

              {url && (
                <div className="flex items-center gap-1.5">
                  <code className="min-w-0 truncate rounded bg-muted px-1.5 py-0.5 text-xs">
                    /form?lugar={place.slug}
                  </code>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2"
                    onClick={copy}
                    aria-label="Copiar enlace completo"
                  >
                    {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    <span className="text-xs">{copied ? "Copiado" : "Copiar"}</span>
                  </Button>
                </div>
              )}

              <p className="text-xs text-muted-foreground">
                {place.defaultType
                  ? `Abre con «${SUBMISSION_TYPE_LABELS[place.defaultType]}» marcado`
                  : "No preselecciona ningún tipo"}
                {" · "}
                {place.submissions > 0 ? (
                  <Link
                    href={`/dashboard/submissions?placeId=${place.id}`}
                    className="font-medium text-primary underline-offset-2 hover:underline"
                  >
                    {place.submissions} aporte{place.submissions === 1 ? "" : "s"}
                  </Link>
                ) : (
                  "sin aportes todavía"
                )}
              </p>
            </>
          )}
        </div>
      </div>

      {!editing && (
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t pt-3">
          <Button type="button" size="sm" variant="outline" onClick={() => setEditing(true)}>
            <Pencil className="h-4 w-4" /> Editar
          </Button>

          {url && (
            <>
              <Button asChild size="sm" variant="outline">
                <a href={`${qr}?format=png&download=1`}>
                  <Download className="h-4 w-4" /> QR (PNG)
                </a>
              </Button>
              <Button asChild size="sm" variant="outline">
                <a href={`${qr}?format=svg&download=1`}>
                  <Download className="h-4 w-4" /> QR (SVG)
                </a>
              </Button>
            </>
          )}

          <form action={toggleAction}>
            <input type="hidden" name="id" value={place.id} />
            <input type="hidden" name="active" value={String(!place.active)} />
            <Pending size="sm" variant="ghost" icon={<Power className="h-4 w-4" />}>
              {place.active ? "Desactivar" : "Activar"}
            </Pending>
          </form>

          {/* Solo se ofrece borrar si no hay aportes: con aportes se desactiva. */}
          {place.submissions === 0 && (
            <form
              action={deleteAction}
              onSubmit={(e) => {
                if (!window.confirm(`¿Eliminar «${place.name}»? Su QR dejará de mostrar el lugar.`)) {
                  e.preventDefault();
                }
              }}
            >
              <input type="hidden" name="id" value={place.id} />
              <Pending
                size="sm"
                variant="ghost"
                className="text-destructive hover:text-destructive"
                icon={<Trash2 className="h-4 w-4" />}
              >
                Eliminar
              </Pending>
            </form>
          )}
        </div>
      )}

      {error && (
        <p role="alert" className="mt-3 text-sm text-destructive">
          {error}
        </p>
      )}
    </li>
  );
}
