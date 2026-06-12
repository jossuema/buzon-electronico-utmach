import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export function StatCard({
  label,
  value,
  icon: Icon,
  className,
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border bg-card p-5 shadow-sm",
        className
      )}
    >
      {/* Acento de marca en el borde superior */}
      <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary to-secondary" />
      <div className="flex items-center justify-between">
        <div>
          <p className="text-3xl font-bold leading-none tracking-tight">
            {value}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">{label}</p>
        </div>
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10 text-primary ring-1 ring-primary/10">
          <Icon className="h-6 w-6" />
        </span>
      </div>
    </div>
  );
}
