"use client";

import { useState } from "react";
import { verifyQrToken } from "@/lib/qr";

interface QRScannerModalProps {
  open: boolean;
  onClose: () => void;
  onScanSuccess: (projectId: string) => Promise<void> | void;
}

export default function QRScannerModal({ open, onClose, onScanSuccess }: QRScannerModalProps) {
  const [tokenInput, setTokenInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await verifyQrToken(tokenInput.trim());
      
      // Menggunakan discriminated union guard untuk menangani ketersediaan properti error
      if (!res || !res.ok) {
        const errorMessage = res && "error" in res && typeof res.error === "string" 
          ? res.error 
          : "Token QR tidak valid atau sudah kadaluwarsa";
        setError(errorMessage);
        return;
      }

      await onScanSuccess(res.payload.projectId);
      setTokenInput("");
      onClose();
    } catch (err) {
      setError("Gagal memverifikasi token QR");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Scan / Input QR Token</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Masukkan token QR project untuk melakukan Clock-In.
        </p>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              QR Token
            </label>
            <input
              type="text"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="Paste QR Token di sini..."
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              required
            />
          </div>

          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? "Verifikasi..." : "Clock In"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
