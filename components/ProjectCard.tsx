import { Users } from "lucide-react";
import type { ProjectSummary } from "@/lib/types";

const STATUS_STYLES: Record<ProjectSummary["status"], string> = {
  PENDING: "bg-surface-2 text-text-muted",
  IN_PROGRESS: "bg-accent/15 text-accent",
  REVIEW: "bg-warning/15 text-warning",
  COMPLETED: "bg-success/15 text-success",
};

const PRIORITY_STYLES: Record<ProjectSummary["priority"], string> = {
  LOW: "border-border text-text-muted",
  MEDIUM: "border-warning/40 text-warning",
  HIGH: "border-danger/40 text-danger",
};

const STATUS_LABEL: Record<ProjectSummary["status"], string> = {
  PENDING: "Pending",
  IN_PROGRESS: "In progress",
  REVIEW: "In review",
  COMPLETED: "Completed",
};

interface ProjectCardProps {
  project: ProjectSummary;
  onClick?: (project: ProjectSummary) => void;
}

export default function ProjectCard({ project, onClick }: ProjectCardProps) {
  return (
    <button
      onClick={() => onClick?.(project)}
      className="flex w-full flex-col gap-3 rounded-lg border border-border bg-surface p-4 text-left transition-colors hover:border-accent/50"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-data text-xs text-text-muted">{project.id}</p>
          <h3 className="font-display text-base leading-tight">{project.title}</h3>
          <p className="text-xs text-text-muted">{project.client}</p>
        </div>
        <span
          className={`whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[project.status]}`}
        >
          {STATUS_LABEL[project.status]}
        </span>
      </div>

      <div>
        <div className="mb-1 flex items-center justify-between text-xs text-text-muted">
          <span>Progress</span>
          <span className="font-data">{project.progressPercentage}%</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
          <div
            className="progress-fill h-full rounded-full bg-accent"
            style={{ width: `${project.progressPercentage}%` }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-text-muted">
        <span className={`rounded-full border px-2 py-0.5 ${PRIORITY_STYLES[project.priority]}`}>
          {project.priority}
        </span>
        <span className="flex items-center gap-1">
          <Users size={12} />
          {project.activeWorkerCount} on site
        </span>
      </div>
    </button>
  );
}
