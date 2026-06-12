import { DashboardSidebar } from "@/components/dashboard/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-muted/20">
      <DashboardSidebar />
      <main className="flex-1 overflow-x-hidden">
        <div className="container max-w-6xl py-8">{children}</div>
      </main>
    </div>
  );
}
