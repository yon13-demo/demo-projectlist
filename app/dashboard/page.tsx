"use client";

import { useState, useEffect } from "react";
import ProjectList from "@/components/ProjectList";
import QRScannerModal from "@/components/QRScannerModal";

export default function DashboardPage() {
  const [scannerOpen, setScannerOpen] = useState(false);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchProjects = async () => {
    try {
      const res = await fetch("/api/v1/projects");
      if (res.ok) {
        const data = await res.json();
        setProjects(data.projects || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleScanSuccess = async (projectId: string) => {
    try {
      const res = await fetch("/api/v1/sessions/clock-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qrToken: projectId }),
      });

      if (res.ok) {
        alert("Berhasil Clock-In ke Proyek: " + projectId);
        fetchProjects();
      } else {
        const err = await res.json();
        alert(err.error || "Gagal Clock-In");
      }
    } catch (e) {
      alert("Terjadi kesalahan jaringan");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 dark:bg-gray-900">
      <div className="mx-auto max-w-5xl space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard Absensi</h1>
          <p className="mt-1 text-gray-500 dark:text-gray-400">
            Kelola sesi kerja proyek, absensi via QR, dan pantau progres proyek secara langsung.
          </p>
        </div>

        {loading ? (
          <p className="text-gray-500">Memuat data proyek...</p>
        ) : (
          <ProjectList
            projects={projects}
            onOpenScanner={() => setScannerOpen(true)}
          />
        )}

        <QRScannerModal
          open={scannerOpen}
          onClose={() => setScannerOpen(false)}
          onScanSuccess={handleScanSuccess}
        />
      </div>
    </div>
  );
}
