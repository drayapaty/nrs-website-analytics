import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
  className?: string;
}

export function StatCard({ label, value, icon, trend, className }: StatCardProps) {
  return (
    <Card className={cn("relative overflow-hidden py-4", className)}>
      <div className="absolute inset-y-0 left-0 w-1 rounded-l-lg bg-orange-500 dark:bg-orange-400/60" />
      <CardContent className="flex flex-col gap-3 pl-5">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-orange-100 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400">
            {icon}
          </div>
          <span className="text-[11px] font-medium uppercase leading-tight tracking-wider text-muted-foreground">{label}</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-foreground">
            {typeof value === "number" ? value.toLocaleString() : value}
          </span>
          {trend && (
            <span className="text-xs font-medium text-chart-2">{trend}</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
