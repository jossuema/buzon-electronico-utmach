import type { Metadata } from "next";
import "./globals.css";
import { ReactQueryProvider } from "@/lib/react-query";

export const metadata: Metadata = {
  title: {
    default: "Buzón Inteligente UTMACH",
    template: "%s | Buzón Inteligente UTMACH",
  },
  description:
    "Plataforma de participación de la Universidad Técnica de Machala: quejas, sugerencias, ideas, investigación y reconocimientos.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ReactQueryProvider>{children}</ReactQueryProvider>
      </body>
    </html>
  );
}
