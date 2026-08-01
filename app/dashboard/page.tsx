"use client";

import { useCallback, useEffect, useState } from "react";
import DashboardHeader from "@/components/DashboardHeader";
import StatCards from "@/components/StatCards";
import ProjectList from "@/components/ProjectList";
import QRScannerModal from "@/components/QRScannerModal";
import LiveTimerBadge from "@/components/LiveTimerBadge";
import type { ProjectSummary, ActiveWorkSession, DashboardStats } from "@/lib/types";

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error ?? `Request to ${url} failed`);
  }
  return data as T;
}

export default function DashboardPage() {
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [activeSession, setActiveSession] = useState<ActiveWorkSession | null>(null);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [banner, setBanner] = useState<{ tone: "success" | "danger"; text: string } | null>(null);

  const refresh = useCallback(async () => {
    const [{ projects }, { session }] = await Promise.all([
      fetchJson<{ projects: ProjectSummary[] }>("/api/v1/projects"),
      fetchJson<{ session: ActiveWorkSession | null }>("/api/v1/sessions/active"),
    ]);
    setProjects(projects);
    setActiveSession(session);
  }, []);

  useEffect(() => {
    refresh()
      .catch((err) => setBanner({ tone: "danger", text: err.message }))
      .finally(() => setLoading(false));
  }, [refresh]);

  async function handleScanSuccess(decodedText: string) {
    await fetchJson<{ session: ActiveWorkSession }>("/api/v1/sessions/clock-in", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ qrToken: decodedText, deviceInfo: navigator.userAgent }),
    });
    setScannerOpen(false);
    setBanner({ tone: "success", text: "Clocked in — timer is running." });
    await refresh();
  }

  async function handleClockOut() {
    try {
      await fetchJson("/api/v1/sessions/clock-out", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      setBanner({ tone: "success", text: "Clocked out. Nice work." });
      await refresh();
    } catch (err) {
      setBanner({ tone: "danger", text: err instanceof Error ? err.message : "Clock-out failed." });
    }
  }

  const stats: DashboardStats = {
    totalProjects: projects.length,
    activeSessions: projects.reduce((sum, p) => sum + p.activeWorkerCount, 0),
    completedTasks: projects.reduce((sum, p) => sum + p.completedTaskCount, 0),
    totalHoursLogged: 0, // populate from /api/v1/reports/timesheet aggregate if surfaced here
  };

  return (
    <div className="min-h-screen bg-bg pb-24">
      <DashboardHeader userName="there" onOpenScanner={() => setScannerOpen(true)} />

      <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6">
        {banner && (
          <div
            className={`rounded-md px-4 py-3 text-sm ${
              banner.tone === "success" ? "bg-success/10 text-success" : "bg-danger/10 text-danger"
            }`}
          >
            {banner.text}
          </div>
        )}

        <StatCards stats={stats} />

        <section>
          <h2 className="mb-3 font-display text-xl">Projects</h2>
          {loading ? (
            <p className="text-sm text-text-muted">Loading projects…</p>
          ) : (
            <ProjectList projects={projects} />
          )}
        </section>
      </main>

      <QRScannerModal
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScanSuccess={handleScanSuccess}
      />

      {activeSession && <LiveTimerBadge session={activeSession} onClockOut={handleClockOut} />}
    </div>
  );
}
