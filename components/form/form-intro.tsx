"use client";

import { useEffect, useState } from "react";
import { Anton } from "next/font/google";

// Fuente display agresiva y rellena para la apertura.
const display = Anton({ subsets: ["latin"], weight: "400", display: "swap" });

const PHRASE = "Construyendo la universidad del futuro";
const MARQUEE = "FUTURO · INNOVACIÓN · UTMACH · CONOCIMIENTO · ";

const STORAGE_KEY = "utmach_intro_seen";
const TOTAL_MS = 2600; // duración total de la apertura
const EXIT_MS = 500; // duración de la cortina de salida

/**
 * Animación de apertura cinética del formulario.
 * - Texto en mayúsculas distribuido en líneas, con fuente display (Anton).
 * - Las líneas entran cruzándose a velocidad desde lados alternos sobre un
 *   fondo de texto en marquee que corre en direcciones opuestas.
 * - La palabra FUTURO se resalta con un "pop" y color de acento celeste.
 * - El logo de la UTMACH se incluye si existe /utmach-logo.png (carga elegante).
 * - Una sola vez por sesión, saltable (tap/Esc), respeta reduced-motion.
 */
export function FormIntro() {
  const [show, setShow] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [logoOk, setLogoOk] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    let seen = false;
    try {
      seen = sessionStorage.getItem(STORAGE_KEY) === "1";
    } catch {
      /* sessionStorage no disponible */
    }
    if (reduced || seen) return;

    try {
      sessionStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* noop */
    }
    setShow(true);

    const exitAt = setTimeout(() => setLeaving(true), TOTAL_MS - EXIT_MS);
    const doneAt = setTimeout(() => setShow(false), TOTAL_MS);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setLeaving(true);
        setTimeout(() => setShow(false), EXIT_MS);
      }
    };
    window.addEventListener("keydown", onKey);

    return () => {
      clearTimeout(exitAt);
      clearTimeout(doneAt);
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
      className={`fixed inset-0 z-[60] flex flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-[#005ca2] to-[#004a82] px-6 text-center transition-all duration-500 ease-out motion-reduce:hidden ${
        leaving ? "pointer-events-none scale-[1.05] opacity-0" : "opacity-100"
      }`}
    >
      {/* Fondo: texto en marquee cruzándose en direcciones opuestas */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute left-0 top-[15%] w-full">
          {marqueeRow("animate-marquee-l", "0.06")}
        </div>
        <div className="absolute left-0 top-[42%] w-full">
          {marqueeRow("animate-marquee-r", "0.05")}
        </div>
        <div className="absolute bottom-[15%] left-0 w-full">
          {marqueeRow("animate-marquee-l", "0.05", "[animation-duration:11s]")}
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
        className="pointer-events-none absolute top-1/2 h-48 w-2/3 -translate-y-1/2 animate-sweep-x bg-gradient-to-r from-transparent via-white/15 to-transparent blur-md [animation-delay:150ms]"
      />

      {/* Contenido central */}
      <div className="relative flex flex-col items-center gap-6">
        {/* Logo UTMACH (si existe /utmach-logo.png) */}
        {logoOk && (
          <div className="animate-intro-rise rounded-xl bg-white px-4 py-2 shadow-lg">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/utmach-logo.png"
              alt="Universidad Técnica de Machala"
              className="h-9 w-auto sm:h-10"
              onError={() => setLogoOk(false)}
            />
          </div>
        )}

        {/* Frase en mayúsculas, distribuida en líneas */}
        <h2
          className={`${display.className} flex flex-col items-center uppercase leading-[0.92] tracking-tight text-white`}
        >
          <span
            className="animate-word-in-l text-3xl sm:text-5xl"
            style={{ animationDelay: "220ms" }}
          >
            Construyendo
          </span>
          <span
            className="animate-word-in-r text-3xl sm:text-5xl"
            style={{ animationDelay: "340ms" }}
          >
            La universidad
          </span>
          <span
            className="animate-word-in-l mt-1 text-xl text-white/70 sm:text-2xl"
            style={{ animationDelay: "460ms" }}
          >
            Del
          </span>
          <span
            className="animate-pop-in mt-1 text-7xl text-[#67bdec] drop-shadow-[0_0_28px_rgba(83,170,225,0.65)] sm:text-8xl"
            style={{ animationDelay: "600ms" }}
          >
            Futuro
          </span>
        </h2>
      </div>

      <span className="absolute bottom-8 text-[11px] uppercase tracking-[0.22em] text-white/50">
        Universidad Técnica de Machala
      </span>
    </div>
  );
}
