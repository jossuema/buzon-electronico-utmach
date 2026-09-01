"use client";

import { useCallback, useEffect, useState } from "react";
import { Anton } from "next/font/google";

// Fuente display agresiva y rellena para la apertura.
const display = Anton({ subsets: ["latin"], weight: "400", display: "swap" });

const PHRASE = "Construyendo la universidad del futuro";
const MARQUEE = "FUTURO · INNOVACIÓN · UTMACH · CONOCIMIENTO · ";

const EXIT_MS = 500; // duración de la cortina de salida

/**
 * Animación de apertura cinética del formulario.
 * - Texto en mayúsculas distribuido en líneas, con fuente display (Anton).
 * - Las líneas entran cruzándose a velocidad desde lados alternos sobre un
 *   fondo de texto en marquee que corre en direcciones opuestas.
 * - La palabra FUTURO se resalta con un "pop" y color de acento celeste.
 * - El sello de la UTMACH se incluye si existe /utmach-sello.png.
 * - Se muestra en CADA carga de la página; se cierra con un toque o una tecla.
 * - Con prefers-reduced-motion sigue apareciendo, pero sin movimiento.
 */
export function FormIntro({ hasLogo = false }: { hasLogo?: boolean }) {
  // Arranca visible (también en SSR) para que cubra la página desde el
  // primer pintado, sin que el formulario asome antes de la hidratación.
  const [show, setShow] = useState(true);
  const [leaving, setLeaving] = useState(false);
  const [logoOk, setLogoOk] = useState(hasLogo);

  // Refuerzo: si la imagen ya falló antes de hidratar, onError no llega a
  // dispararse, así que se comprueba el estado real del elemento.
  const logoRef = useCallback((node: HTMLImageElement | null) => {
    if (node && node.complete && node.naturalWidth === 0) setLogoOk(false);
  }, []);

  useEffect(() => {
    // La animación NO se cierra sola: permanece hasta que el usuario haga clic
    // (o presione una tecla). Solo entonces se oculta.
    const dismiss = () => {
      setLeaving(true);
      setTimeout(() => setShow(false), EXIT_MS);
    };
    const onKey = () => dismiss();
    window.addEventListener("keydown", onKey);

    return () => {
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  if (!show) return null;

  const skip = () => {
    setLeaving(true);
    setTimeout(() => setShow(false), EXIT_MS);
  };

  const marqueeRow = (anim: string, opacity: string, extra = "") => (
    <div
      className={`absolute left-0 flex w-max whitespace-nowrap will-change-transform ${anim} ${extra}`}
    >
      <span
        className={`${display.className} px-4 text-6xl uppercase italic tracking-tight sm:text-8xl`}
        style={{ color: `rgba(255,255,255,${opacity})` }}
      >
        {MARQUEE.repeat(6)}
      </span>
      <span
        className={`${display.className} px-4 text-6xl uppercase italic tracking-tight sm:text-8xl`}
        style={{ color: `rgba(255,255,255,${opacity})` }}
      >
        {MARQUEE.repeat(6)}
      </span>
    </div>
  );

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={PHRASE}
      onClick={skip}
      className={`fixed inset-0 z-[60] flex cursor-pointer flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-[#005ca2] to-[#004a82] px-6 text-center transition-all duration-500 ease-out ${
        leaving ? "pointer-events-none scale-[1.05] opacity-0" : "opacity-100"
      }`}
    >
      {/* Fondo: texto en marquee cruzándose en direcciones opuestas */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute left-0 top-[15%] w-full">
          {marqueeRow("motion-safe:animate-marquee-l", "0.06")}
        </div>
        <div className="absolute left-0 top-[42%] w-full">
          {marqueeRow("motion-safe:animate-marquee-r", "0.05")}
        </div>
        <div className="absolute bottom-[15%] left-0 w-full">
          {marqueeRow("motion-safe:animate-marquee-l", "0.05", "[animation-duration:11s]")}
        </div>
      </div>

      {/* Halo de luz */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-1/3 h-72 bg-[radial-gradient(55%_60%_at_50%_50%,rgba(83,170,225,0.4),transparent_70%)]"
      />

      {/* Destello que barre la pantalla */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/2 h-48 w-2/3 -translate-y-1/2 motion-safe:animate-sweep-x motion-reduce:hidden bg-gradient-to-r from-transparent via-white/15 to-transparent blur-md [animation-delay:150ms]"
      />

      {/* Contenido central */}
      <div className="relative flex flex-col items-center gap-6">
        {/* Logo UTMACH (si existe /utmach-logo.png) */}
        {logoOk && (
          <div className="motion-safe:animate-intro-rise flex h-28 w-28 items-center justify-center rounded-full bg-white p-2.5 shadow-[0_10px_30px_-8px_rgba(0,40,74,0.6)] ring-1 ring-white/50 sm:h-32 sm:w-32">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={logoRef}
              src="/utmach-sello.png"
              alt="Universidad Técnica de Machala"
              className="h-full w-full object-contain"
              onError={() => setLogoOk(false)}
            />
          </div>
        )}

        {/* Frase en mayúsculas, distribuida en líneas */}
        <h2
          className={`${display.className} flex flex-col items-center uppercase leading-[0.92] tracking-tight text-white`}
        >
          <span
            className="motion-safe:animate-word-in-l text-3xl sm:text-5xl"
            style={{ animationDelay: "220ms" }}
          >
            Construyendo
          </span>
          <span
            className="motion-safe:animate-word-in-r text-3xl sm:text-5xl"
            style={{ animationDelay: "340ms" }}
          >
            La universidad
          </span>
          <span
            className="motion-safe:animate-word-in-l mt-1 text-xl text-white/70 sm:text-2xl"
            style={{ animationDelay: "460ms" }}
          >
            Del
          </span>
          <span
            className="motion-safe:animate-pop-in mt-1 text-7xl text-[#67bdec] drop-shadow-[0_0_28px_rgba(83,170,225,0.65)] sm:text-8xl"
            style={{ animationDelay: "600ms" }}
          >
            Futuro
          </span>
        </h2>
      </div>

      <span className="absolute bottom-8 flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-white/60">
        <span className="inline-block h-2 w-2 animate-ping rounded-full bg-[#67bdec]" />
        Toca para continuar
      </span>
    </div>
  );
}
