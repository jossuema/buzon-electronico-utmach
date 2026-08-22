import Link from "next/link";
import { Inbox } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="container flex flex-col items-center gap-3 py-8">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-secondary text-primary-foreground">
            <Inbox className="h-4 w-4" />
          </span>
          <div className="text-center text-sm leading-tight sm:text-left">
            <p className="font-medium">Buzón Inteligente UTMACH</p>
            <p className="text-muted-foreground">
              © {new Date().getFullYear()} Universidad Técnica de Machala
            </p>
          </div>
        </div>
        <Link
          href="/privacidad"
          className="text-xs text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
        >
          Aviso de privacidad
        </Link>
      </div>
    </footer>
  );
}
