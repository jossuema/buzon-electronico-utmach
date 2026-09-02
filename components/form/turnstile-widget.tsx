"use client";

import Script from "next/script";
import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { Loader2, ShieldAlert } from "lucide-react";

type WidgetId = string;

interface TurnstileApi {
  render: (
    container: HTMLElement,
    options: {
      sitekey: string;
      action?: string;
      theme?: "light" | "dark" | "auto";
      language?: string;
      callback?: (token: string) => void;
      "expired-callback"?: () => void;
      "timeout-callback"?: () => void;
      "error-callback"?: (code?: string) => void;
    }
  ) => WidgetId;
  reset: (widgetId: WidgetId) => void;
  remove: (widgetId: WidgetId) => void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

interface Props {
  siteKey: string;
  action: string;
  /** Recibe el token al resolverse el reto, y "" al caducar o fallar. */
  onToken: (token: string) => void;
  /**
   * El padre guarda aquí una función para reiniciar el widget. Es obligatorio
   * llamarla tras CADA intento de envío: los tokens son de un solo uso y
   * Cloudflare ya lo consumió en siteverify.
   */
  resetRef: RefObject<(() => void) | null>;
}

/**
 * Widget de Cloudflare Turnstile con renderizado explícito.
 *
 * Se renderiza explícitamente (y no con la clase `cf-turnstile`) para conservar
 * el ID del widget: es lo que permite reiniciarlo tras un envío sin recargar
 * la página, que es justo lo que necesita este formulario porque permanece
 * montado después de un error.
 */
export function TurnstileWidget({ siteKey, action, onToken, resetRef }: Props) {
  const container = useRef<HTMLDivElement>(null);
  const widgetId = useRef<WidgetId | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");

  // onToken cambia en cada render del padre; se guarda en una ref para que los
  // callbacks registrados en Cloudflare no queden congelados con una versión
  // vieja y para no tener que volver a montar el widget.
  const onTokenRef = useRef(onToken);
  useEffect(() => {
    onTokenRef.current = onToken;
  }, [onToken]);

  const render = useCallback(() => {
    if (!container.current || widgetId.current !== null) return;
    if (!window.turnstile) return;

    try {
      widgetId.current = window.turnstile.render(container.current, {
        sitekey: siteKey,
        action,
        theme: "light",
        language: "es",
        callback: (token) => {
          setState("ready");
          onTokenRef.current(token);
        },
        "expired-callback": () => onTokenRef.current(""),
        "timeout-callback": () => onTokenRef.current(""),
        "error-callback": () => {
          setState("error");
          onTokenRef.current("");
        },
      });
      setState((s) => (s === "error" ? s : "ready"));
    } catch (err) {
      console.error("Turnstile: no se pudo renderizar el widget", err);
      setState("error");
    }
  }, [siteKey, action]);

  // Expone el reinicio al formulario padre.
  useEffect(() => {
    resetRef.current = () => {
      if (widgetId.current !== null && window.turnstile) {
        window.turnstile.reset(widgetId.current);
      }
      onTokenRef.current("");
    };
    return () => {
      resetRef.current = null;
    };
  }, [resetRef]);

  // El script puede haberse cargado ya (por ejemplo al volver a montar el
  // formulario tras "Enviar otro aporte"), en cuyo caso onReady no basta.
  useEffect(() => {
    if (window.turnstile) render();
  }, [render]);

  useEffect(() => {
    return () => {
      if (widgetId.current !== null && window.turnstile) {
        window.turnstile.remove(widgetId.current);
        widgetId.current = null;
      }
    };
  }, []);

  return (
    <div className="min-w-0">
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onReady={render}
        onError={() => setState("error")}
      />

      <div ref={container} className="flex justify-center [&>*]:max-w-full" />

      {state === "loading" && (
        <p className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Comprobando que eres una persona…
        </p>
      )}

      {state === "error" && (
        <p
          role="alert"
          className="flex items-start justify-center gap-2 rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive"
        >
          <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          No se pudo cargar la verificación de seguridad. Revisa tu conexión y
          recarga la página.
        </p>
      )}
    </div>
  );
}
