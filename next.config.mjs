/** @type {import('next').NextConfig} */

const isDev = process.env.NODE_ENV !== "production";

// Content-Security-Policy. En producción es estricta; en desarrollo se relaja
// lo mínimo para que funcionen el HMR y el eval de Next.
// Nota: next/font auto-hospeda las fuentes (no hay dominios externos), Recharts
// renderiza SVG inline y React Query solo llama a /api (mismo origen).
const TURNSTILE_ORIGIN = "https://challenges.cloudflare.com";

const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "font-src 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "img-src 'self' data:",
  "object-src 'none'",
  // challenges.cloudflare.com: script e iframe del widget de Turnstile.
  // Sin frame-src el iframe caería en default-src 'self' y quedaría bloqueado.
  `script-src 'self' 'unsafe-inline' ${TURNSTILE_ORIGIN}${isDev ? " 'unsafe-eval'" : ""}`,
  `frame-src ${TURNSTILE_ORIGIN}`,
  "style-src 'self' 'unsafe-inline'",
  `connect-src 'self'${isDev ? " ws:" : ""}`,
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
  // HSTS solo en producción (localhost es HTTP; los navegadores lo ignoran ahí).
  ...(isDev
    ? []
    : [
        {
          key: "Strict-Transport-Security",
          value: "max-age=63072000; includeSubDomains; preload",
        },
      ]),
];

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false, // no revelar "X-Powered-By: Next.js"
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
