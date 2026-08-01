"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import ProjectCard from "./ProjectCard";
import type { ProjectSummary, ProjectStatus } from "@/lib/types";

const FILTERS: { label: string; value: ProjectStatus | "ALL" }[] = [
  { label: "All", value: "ALL" },
  { label: "In progress", value: "IN_PROGRESS" },
  { label: "Review", value: "REVIEW" },
  { label: "Completed", value: "COMPLETED" },
];

interface ProjectListProps {
  projects: ProjectSummary[];
  onSelectProject?: (project: ProjectSummary) => void;
}

export default function ProjectList({ projects, onSelectProject }: ProjectListProps) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<ProjectStatus | "ALL">("ALL");

  const filtered = useMemo(() => {
    return projects.filter((p) => {
      const matchesStatus = filter === "ALL" || p.status === filter;
      const q = query.trim().toLowerCase();
      const matchesQuery =
        !q ||
        p.title.toLowerCase().includes(q) ||
        p.client.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q);
      return matchesStatus && matchesQuery;
    });
  }, [projects, query, filter]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search projects or clients…"
            className="w-full rounded-md border border-border bg-surface py-2 pl-9 pr-3 text-sm outline-none focus:border-accent"
          />
        </div>

        <div className="flex gap-1 overflow-x-auto">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                filter === f.value
                  ? "bg-accent text-accent-ink"
                  : "text-text-muted hover:bg-surface-2"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="qr-grid-bg rounded-lg border border-dashed border-border py-16 text-center">
          <p className="font-display text-lg">No projects match that search</p>
          <p className="text-sm text-text-muted">Try a different keyword or filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((project) => (
            <ProjectCard key={project.id} project={project} onClick={onSelectProject} />
          ))}
        </div>
      )}
    </div>
  );
}
