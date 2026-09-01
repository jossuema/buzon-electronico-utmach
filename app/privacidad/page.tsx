import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { SiteFooter } from "@/components/site-footer";
import {
  CONTACT_EMAIL_RETENTION_MONTHS,
  PRIVACY_CONTACT_EMAIL,
  PRIVACY_LAST_UPDATED,
} from "@/lib/privacy";

export const metadata: Metadata = {
  title: "Aviso de privacidad",
  description:
    "Cómo trata el Buzón Inteligente de la Universidad Técnica de Machala los datos personales de quienes envían aportes.",
};

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-8">
      <h2 className="text-lg font-semibold text-foreground sm:text-xl">
        {title}
      </h2>
      <div className="mt-2 space-y-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
        {children}
      </div>
    </section>
  );
}

export default function PrivacyPage() {
  const updated = new Intl.DateTimeFormat("es-EC", {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(new Date(`${PRIVACY_LAST_UPDATED}T00:00:00Z`));

  return (
    <div className="flex min-h-screen flex-col">
      <main className="relative isolate flex-1 overflow-hidden bg-[#004a82]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(180deg,#005ca2_0%,#005ca2_28%,#004a82_100%)]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[2px] bg-[#C2354A]/70"
        />

        <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
          <div className="mb-8 text-center">
            <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-medium text-white/90 shadow-sm backdrop-blur">
              <ShieldCheck className="h-3.5 w-3.5" />
              Protección de datos
            </span>
            <h1 className="text-balance text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Aviso de privacidad
            </h1>
            <p className="mx-auto mt-3 max-w-xl text-pretty text-white/90">
              Buzón Inteligente · Universidad Técnica de Machala
            </p>
          </div>

          <article className="overflow-hidden rounded-2xl border border-white/15 bg-card shadow-[0_20px_50px_-12px_rgba(0,40,74,0.45)] ring-1 ring-black/5">
            <div className="h-1.5 w-full bg-gradient-to-r from-primary via-secondary to-primary" />
            <div className="p-6 sm:p-8">
              <p className="text-sm text-muted-foreground">
                Última actualización: {updated}
              </p>

              <Section title="1. Responsable del tratamiento">
                <p>
                  La <strong>Universidad Técnica de Machala (UTMACH)</strong> es
                  la responsable del tratamiento de los datos recogidos a través
                  del Buzón Inteligente. Para consultas sobre privacidad puedes
                  escribir a{" "}
                  <a
                    className="font-medium text-primary underline underline-offset-2"
                    href={`mailto:${PRIVACY_CONTACT_EMAIL}`}
                  >
                    {PRIVACY_CONTACT_EMAIL}
                  </a>
                  .
                </p>
              </Section>

              <Section title="2. Qué datos recogemos">
                <p>
                  El formulario está diseñado para recoger{" "}
                  <strong>la mínima cantidad de datos personales posible</strong>
                  :
                </p>
                <ul className="ml-5 list-disc space-y-1">
                  <li>
                    <strong>Correo de contacto</strong> — <em>opcional</em>. Es
                    el único dato que puede identificarte. Si eliges{" "}
                    <em>enviar de forma anónima</em>, no se guarda.
                  </li>
                  <li>
                    <strong>Contenido del aporte</strong>: tipo, título y
                    descripción que tú redactas.
                  </li>
                  <li>
                    <strong>Datos académicos no identificativos</strong>:
                    facultad, carrera y campus.
                  </li>
                  <li>
                    <strong>Fecha de envío</strong> y un indicador técnico del
                    origen del formulario.
                  </li>
                </ul>
                <p>
                  No solicitamos tu nombre, cédula, teléfono ni matrícula. No
                  usamos cookies de publicidad ni de seguimiento de terceros.
                </p>
                <p className="rounded-md bg-muted/60 p-3">
                  <strong>Datos técnicos de seguridad.</strong> Para evitar el
                  uso abusivo del buzón (envíos masivos automatizados) se guarda
                  una <strong>huella irreversible</strong> de tu dirección IP y
                  de un identificador aleatorio de tu navegador, junto con una
                  huella del texto enviado para detectar duplicados. No se
                  almacena tu IP en claro y esas huellas{" "}
                  <strong>no permiten reconstruir</strong> el dato original ni
                  identificarte. Se eliminan a los <strong>30 días</strong>.
                  Además, los envíos solo se aceptan desde direcciones de
                  Ecuador.
                </p>
                <p className="rounded-md bg-muted/60 p-3">
                  <strong>Importante:</strong> evita incluir datos personales
                  (tuyos o de terceros) dentro del texto de la descripción. Si
                  necesitas denunciar un hecho sensible, describe la situación
                  sin identificar a las personas involucradas.
                </p>
              </Section>

              <Section title="3. Para qué usamos los datos">
                <ul className="ml-5 list-disc space-y-1">
                  <li>Gestionar y dar seguimiento a tu aporte.</li>
                  <li>
                    Contactarte <strong>únicamente</strong> si dejaste tu correo
                    y se requiere ampliar la información o darte una respuesta.
                  </li>
                  <li>
                    Elaborar <strong>estadísticas institucionales agregadas</strong>{" "}
                    (por facultad, carrera, campus y tipo de aporte) para mejorar
                    los servicios universitarios.
                  </li>
                </ul>
                <p>
                  A futuro, la Universidad podrá aplicar técnicas de análisis
                  automático de texto sobre el <em>contenido</em> de los aportes
                  para clasificarlos y priorizarlos. Ese análisis no se aplicará
                  al correo de contacto ni se usará para tomar decisiones
                  automatizadas que te afecten individualmente.
                </p>
              </Section>

              <Section title="4. Base legal y voluntariedad">
                <p>
                  El envío del formulario es <strong>voluntario</strong>.
                  Proporcionar el correo de contacto es opcional y constituye tu{" "}
                  <strong>consentimiento</strong> para que la Universidad te
                  responda. El tratamiento se realiza conforme a la{" "}
                  <strong>
                    Ley Orgánica de Protección de Datos Personales (LOPDP)
                  </strong>{" "}
                  del Ecuador y a la normativa interna de la UTMACH.
                </p>
              </Section>

              <Section title="5. Cuánto tiempo conservamos tus datos">
                <ul className="ml-5 list-disc space-y-1">
                  <li>
                    <strong>Correo de contacto</strong>: se conserva un máximo de{" "}
                    <strong>{CONTACT_EMAIL_RETENTION_MONTHS} meses</strong> desde
                    el envío. Cumplido ese plazo se elimina de forma automática y
                    permanente.
                  </li>
                  <li>
                    <strong>Contenido del aporte y datos académicos</strong>: se
                    conservan de forma <strong>anónima</strong> (sin el correo)
                    con fines estadísticos e históricos.
                  </li>
                </ul>
                <p>
                  Los aportes enviados de forma anónima nacen ya sin ningún dato
                  identificativo.
                </p>
              </Section>

              <Section title="6. Quién puede ver tus datos">
                <p>
                  Solo el <strong>personal administrativo autorizado</strong> de
                  la UTMACH accede al panel, mediante credenciales y sesión
                  protegida. No vendemos, cedemos ni compartimos tus datos con
                  terceros con fines comerciales. La información se aloja en
                  servidores de <strong>Microsoft Azure</strong>, proveedor de
                  infraestructura que actúa como encargado del tratamiento.
                </p>
              </Section>

              <Section title="7. Cómo protegemos la información">
                <ul className="ml-5 list-disc space-y-1">
                  <li>Cifrado en tránsito (HTTPS/TLS) en toda la plataforma.</li>
                  <li>Conexión cifrada y restringida a la base de datos.</li>
                  <li>
                    Acceso al panel protegido con contraseña almacenada como
                    hash y límite de intentos de acceso.
                  </li>
                  <li>
                    Medidas contra abuso automatizado del formulario y cabeceras
                    de seguridad del navegador.
                  </li>
                </ul>
              </Section>

              <Section title="8. Tus derechos">
                <p>
                  Puedes solicitar el <strong>acceso, rectificación,
                  eliminación u oposición</strong> respecto de tus datos
                  personales escribiendo a{" "}
                  <a
                    className="font-medium text-primary underline underline-offset-2"
                    href={`mailto:${PRIVACY_CONTACT_EMAIL}`}
                  >
                    {PRIVACY_CONTACT_EMAIL}
                  </a>
                  . Para poder localizar tu aporte necesitaremos el correo con el
                  que lo enviaste.
                </p>
                <p>
                  Ten en cuenta que los aportes <strong>anónimos</strong> no
                  pueden vincularse a una persona, por lo que no es posible
                  atender solicitudes individuales sobre ellos.
                </p>
              </Section>

              <Section title="9. Cambios en este aviso">
                <p>
                  Podemos actualizar este aviso para reflejar mejoras en la
                  plataforma o cambios normativos. La fecha de la última
                  actualización siempre aparece al inicio de esta página.
                </p>
              </Section>

              <div className="mt-10 border-t pt-6">
                <Link
                  href="/form"
                  className="inline-flex items-center gap-2 text-sm font-medium text-primary underline-offset-4 hover:underline"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Volver al formulario
                </Link>
              </div>
            </div>
          </article>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
