import { FolderKanban, Radio, CheckSquare, Clock } from "lucide-react";
import type { DashboardStats } from "@/lib/types";

interface StatCardsProps {
  stats: DashboardStats;
}

export default function StatCards({ stats }: StatCardsProps) {
  const items = [
    {
      label: "Total projects",
      value: stats.totalProjects,
      icon: FolderKanban,
    },
    {
      label: "Active sessions",
      value: stats.activeSessions,
      icon: Radio,
      live: stats.activeSessions > 0,
    },
    {
      label: "Completed tasks",
      value: stats.completedTasks,
      icon: CheckSquare,
    },
    {
      label: "Hours logged",
      value: stats.totalHoursLogged.toFixed(1),
      icon: Clock,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {items.map(({ label, value, icon: Icon, live }) => (
        <div
          key={label}
          className="rounded-lg border border-border bg-surface p-4"
        >
          <div className="flex items-center justify-between">
            <span className="rounded-md bg-surface-2 p-2 text-accent">
              <Icon size={18} />
            </span>
            {live && (
              <span className="flex items-center gap-1 text-xs font-medium text-success">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" />
                live
              </span>
            )}
          </div>
          <p className="mt-3 font-data text-2xl font-semibold">{value}</p>
          <p className="text-xs text-text-muted">{label}</p>
        </div>
      ))}
    </div>
  );
}
