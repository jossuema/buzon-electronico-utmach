import type { Metadata } from "next";
import Link from "next/link";
import { Inbox } from "lucide-react";
import { LoginForm } from "@/components/login-form";

export const metadata: Metadata = { title: "Acceso administrativo" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl } = await searchParams;

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-muted/30 p-4">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-secondary to-primary" />
      <div className="pointer-events-none absolute -left-24 top-1/4 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-1/4 h-72 w-72 rounded-full bg-secondary/15 blur-3xl" />

      <div className="w-full max-w-sm">
        <Link href="/" className="mb-7 flex items-center justify-center gap-2.5">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-secondary text-primary-foreground shadow-sm">
            <Inbox className="h-6 w-6" />
          </span>
          <div className="leading-tight">
            <span className="block font-semibold">Buzón Inteligente</span>
            <span className="block text-xs uppercase tracking-wide text-muted-foreground">
              UTMACH
            </span>
          </div>
        </Link>
        <LoginForm callbackUrl={callbackUrl ?? "/dashboard"} />
      </div>
    </div>
  );
}
