import { Inbox } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="container flex items-center justify-center py-8">
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
      </div>
    </footer>
  );
}
