"use client";

import { useState } from "react";

interface Task {
  id: string;
  isCompleted: boolean;
}

interface Project {
  id: string;
  title: string;
  client: string | null;
  status: string;
  priority: string;
  progressPercentage: number;
  taskCount: number;
  completedTaskCount: number;
}

interface ProjectListProps {
  projects: Project[];
  onOpenScanner: () => void;
}

export default function ProjectList({ projects, onOpenScanner }: ProjectListProps) {
  const [selectedQr, setSelectedQr] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Daftar Proyek & Aktivitas</h2>
        <button
          onClick={onOpenScanner}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-blue-700 transition"
        >
          📷 Scan / Input QR Clock-In
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {projects.map((p) => (
          <div key={p.id} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-mono font-semibold text-blue-600 dark:text-blue-400">{p.id}</span>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">{p.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Client: {p.client ?? "-"}</p>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                p.status === "COMPLETED" ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"
              }`}>
                {p.status}
              </span>
            </div>

            {/* Progress Bar Section */}
            <div className="mt-4">
              <div className="flex justify-between text-xs font-medium text-gray-600 dark:text-gray-300">
                <span>Progress Kerja</span>
                <span>{p.progressPercentage}% ({p.completedTaskCount}/{p.taskCount} Tasks)</span>
              </div>
              <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                <div
                  className="h-full bg-blue-600 transition-all duration-300"
                  style={{ width: `${p.progressPercentage}%` }}
                />
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
              <button
                onClick={() => setSelectedQr(p.id)}
                className="text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
              >
                🔍 Tampilkan QR Code
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* QR Code Preview Modal */}
      {selectedQr && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 text-center shadow-xl dark:bg-gray-800">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">QR Code Proyek</h3>
            <p className="text-xs text-gray-500 mt-1">Gunakan Token di bawah ini pada modal Clock-In</p>
            
            <div className="my-4 rounded-lg bg-gray-100 p-4 font-mono text-sm break-all dark:bg-gray-700 text-gray-800 dark:text-gray-200">
              {selectedQr}
            </div>

            <button
              onClick={() => setSelectedQr(null)}
              className="w-full rounded-lg bg-gray-200 py-2 text-sm font-medium text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-white"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
