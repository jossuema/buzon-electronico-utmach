import type { Metadata } from "next";
import { AlertTriangle, MapPin } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { placeFormUrl, publicBaseUrl } from "@/lib/places";
import { PlaceCreateForm } from "@/components/dashboard/place-create-form";
import { PlaceCard } from "@/components/dashboard/place-card";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = { title: "Lugares" };
export const dynamic = "force-dynamic";

export default async function PlacesPage() {
  const places = await prisma.place.findMany({
    orderBy: [{ active: "desc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      slug: true,
      defaultType: true,
      active: true,
      _count: { select: { submissions: true } },
    },
  });
  const baseUrl = publicBaseUrl();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Lugares</h1>
        <p className="max-w-2xl text-muted-foreground">
          Cada lugar tiene su propio enlace y su código QR. Quien lo escanee llega al
          formulario con el lugar ya indicado, y no puede cambiarlo.
        </p>
      </div>

      {!baseUrl && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
          <p>
            Falta configurar <code>PUBLIC_BASE_URL</code> (o <code>AUTH_URL</code>) con la
            URL pública del sitio. Sin ella no se generan enlaces ni QR, para no imprimir
            carteles que apunten a un host equivocado.
          </p>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Nuevo lugar</CardTitle>
          <CardDescription>
            Por ejemplo, un baño, un laboratorio o la biblioteca.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PlaceCreateForm baseUrl={baseUrl} />
        </CardContent>
      </Card>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">
          {places.length} lugar{places.length === 1 ? "" : "es"}
        </h2>

        {places.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed bg-background px-6 py-12 text-center">
            <MapPin className="h-6 w-6 text-muted-foreground" />
            <p className="font-medium">Todavía no hay lugares</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Crea el primero para obtener su enlace y su QR listo para imprimir.
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {places.map((p) => (
              <PlaceCard
                key={p.id}
                url={placeFormUrl(p.slug)}
                place={{
                  id: p.id,
                  name: p.name,
                  slug: p.slug,
                  defaultType: p.defaultType,
                  active: p.active,
                  submissions: p._count.submissions,
                }}
              />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
