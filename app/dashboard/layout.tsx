import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { DashboardSidebar } from "@/components/dashboard/sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Defensa en profundidad: además del middleware, se valida la sesión del
  // lado del servidor en cada request al panel. Si el middleware se evadiera
  // (p. ej. por un bug del framework), el dashboard seguiría protegido.
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <div className="flex min-h-screen bg-muted/20">
      <DashboardSidebar />
      <main className="flex-1 overflow-x-hidden">
        <div className="container max-w-6xl py-8">{children}</div>
      </main>
    </div>
  );
}
