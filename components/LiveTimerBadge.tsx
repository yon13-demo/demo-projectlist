"use client";

import { useEffect, useState } from "react";
import { Square, Pause } from "lucide-react";
import type { ActiveWorkSession } from "@/lib/types";

interface LiveTimerBadgeProps {
  session: ActiveWorkSession;
  onClockOut: () => void;
}

function formatDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds].map((n) => String(n).padStart(2, "0")).join(":");
}

export default function LiveTimerBadge({ session, onClockOut }: LiveTimerBadgeProps) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const elapsedMs = now - new Date(session.clockIn).getTime();

  return (
    <div className="fixed bottom-4 left-1/2 z-40 flex -translate-x-1/2 items-center gap-3 rounded-full border border-border bg-surface px-4 py-2 shadow-lg sm:bottom-6">
      <span className="relative flex h-2.5 w-2.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-60" />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-success" />
      </span>

      <div className="leading-tight">
        <p className="text-[11px] text-text-muted">
          {session.project?.title ?? session.projectId}
        </p>
        <p className="font-data text-lg font-semibold tracking-wide">
          {formatDuration(elapsedMs)}
        </p>
      </div>

      <button
        className="rounded-full p-2 text-text-muted hover:bg-surface-2"
        aria-label="Pause (visual only — pausing is not persisted server-side)"
        title="Pause"
      >
        <Pause size={16} />
      </button>
      <button
        onClick={onClockOut}
        className="flex items-center gap-1 rounded-full bg-danger px-3 py-1.5 text-sm font-medium text-white"
      >
        <Square size={14} />
        Clock out
      </button>
    </div>
  );
}
