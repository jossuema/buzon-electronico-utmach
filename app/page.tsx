import Link from "next/link";
import {
  MessageSquareWarning,
  Lightbulb,
  FlaskConical,
  Award,
  ArrowRight,
  QrCode,
  ShieldCheck,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteFooter } from "@/components/site-footer";

const FEATURES = [
  {
    icon: MessageSquareWarning,
    title: "Quejas y sugerencias",
    desc: "Reporta problemas y propón mejoras para tu facultad o carrera.",
  },
  {
    icon: Lightbulb,
    title: "Ideas de proyectos",
    desc: "Comparte iniciativas que aporten valor a la comunidad universitaria.",
  },
  {
    icon: FlaskConical,
    title: "Investigación",
    desc: "Presenta propuestas de investigación e innovación académica.",
  },
  {
    icon: Award,
    title: "Reconocimientos",
    desc: "Destaca el buen trabajo de docentes, personal y compañeros.",
  },
];

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden border-b">
          {/* Fondo decorativo */}
          <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-accent/60 to-background" />
          <div className="pointer-events-none absolute -left-24 -top-24 -z-10 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
          <div className="pointer-events-none absolute -right-24 top-12 -z-10 h-72 w-72 rounded-full bg-secondary/20 blur-3xl" />

          <div className="container flex flex-col items-center py-24 text-center">
            <span className="mb-5 inline-flex items-center gap-2 rounded-full border bg-background/70 px-4 py-1.5 text-sm font-medium text-muted-foreground shadow-sm backdrop-blur">
              <span className="flex h-2 w-2 rounded-full bg-secondary" />
              Universidad Técnica de Machala
            </span>
            <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-6xl">
              Tu voz construye una mejor{" "}
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                UTMACH
              </span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
              Como estudiante de la UTMACH puedes enviar quejas, sugerencias,
              ideas, propuestas de investigación y reconocimientos de forma
              sencilla y, si lo prefieres, anónima.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="gap-2">
                <Link href="/form">
                  Enviar un aporte <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>

            {/* Mini-features de confianza */}
            <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" /> Envío anónimo
                opcional
              </span>
              <span className="inline-flex items-center gap-2">
                <QrCode className="h-4 w-4 text-primary" /> Acceso por QR
              </span>
              <span className="inline-flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" /> Analítica para la
                institución
              </span>
            </div>
          </div>
        </section>

        {/* Características */}
        <section className="container py-20">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight">
              ¿Qué puedes compartir?
            </h2>
            <p className="mt-3 text-muted-foreground">
              Un solo lugar para canalizar la participación de toda la comunidad
              universitaria.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="group rounded-2xl border bg-card p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
              >
                <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10 text-primary ring-1 ring-primary/10">
                  <f.icon className="h-6 w-6" />
                </span>
                <h3 className="font-semibold">{f.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* QR / parametrización */}
        <section className="border-t bg-muted/30">
          <div className="container grid items-center gap-10 py-20 md:grid-cols-2">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
                <QrCode className="h-3.5 w-3.5" /> Códigos QR
              </span>
              <h2 className="mt-4 text-3xl font-bold tracking-tight">
                Un QR para cada facultad
              </h2>
              <p className="mt-3 leading-relaxed text-muted-foreground">
                El formulario se personaliza mediante la URL para preseleccionar
                facultad y carrera. Así cada facultad puede imprimir su propio
                código QR y recibir aportes ya clasificados.
              </p>
              <ul className="mt-5 space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-secondary" />
                  <code className="rounded bg-background px-2 py-1 text-foreground shadow-sm">
                    /form?faculty=ingenieria-civil
                  </code>
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-secondary" />
                  <code className="rounded bg-background px-2 py-1 text-foreground shadow-sm">
                    /form?faculty=ingenieria-civil&career=ingenieria-civil
                  </code>
                </li>
              </ul>
              <Button asChild className="mt-7" variant="secondary">
                <Link href="/form">Probar el formulario</Link>
              </Button>
            </div>
            <div className="flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 -z-10 rounded-3xl bg-gradient-to-br from-primary/20 to-secondary/20 blur-2xl" />
                <div className="flex h-60 w-60 items-center justify-center rounded-3xl border-2 border-dashed border-primary/30 bg-background shadow-sm">
                  <QrCode className="h-32 w-32 text-primary/40" />
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
