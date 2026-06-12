import Link from "next/link";
import { Inbox, LayoutDashboard, Table2, LogOut, Home } from "lucide-react";
import { logout } from "@/actions/auth";
import { Button } from "@/components/ui/button";

const NAV = [
  { href: "/dashboard", label: "Indicadores", icon: LayoutDashboard },
  { href: "/dashboard/submissions", label: "Aportes", icon: Table2 },
];

export function DashboardSidebar() {
  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r bg-background md:flex">
      <div className="flex h-16 items-center gap-2.5 border-b px-5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-secondary text-primary-foreground shadow-sm">
          <Inbox className="h-4 w-4" />
        </span>
        <div className="leading-tight">
          <span className="block text-sm font-semibold">Buzón UTMACH</span>
          <span className="block text-xs text-muted-foreground">
            Panel administrativo
          </span>
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="space-y-1 border-t p-3">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <Home className="h-4 w-4" />
          Ir al sitio
        </Link>
        <form action={logout}>
          <Button
            type="submit"
            variant="ghost"
            className="w-full justify-start gap-3 px-3 text-muted-foreground"
          >
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </Button>
        </form>
      </div>
    </aside>
  );
}
