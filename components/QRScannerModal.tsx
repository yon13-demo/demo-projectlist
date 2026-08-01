"use client";

import { useEffect, useRef, useState } from "react";
import { X, AlertTriangle, Loader2 } from "lucide-react";

interface QRScannerModalProps {
  open: boolean;
  onClose: () => void;
  onScanSuccess: (decodedText: string) => Promise<void> | void;
}

const SCANNER_ELEMENT_ID = "qr-scanner-viewport";

export default function QRScannerModal({ open, onClose, onScanSuccess }: QRScannerModalProps) {
  const scannerRef = useRef<import("html5-qrcode").Html5Qrcode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    async function start() {
      try {
        // Dynamically imported so the ~200KB decoder never ships in the
        // main bundle for users who never open the scanner.
        const { Html5Qrcode } = await import("html5-qrcode");
        if (cancelled) return;

        const scanner = new Html5Qrcode(SCANNER_ELEMENT_ID);
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 240, height: 240 } },
          async (decodedText) => {
            if (submitting) return;
            setSubmitting(true);
            try {
              await scanner.stop();
            } catch {
              /* already stopped */
            }
            try {
              await onScanSuccess(decodedText);
            } catch (err) {
              setError(err instanceof Error ? err.message : "Clock-in failed.");
            } finally {
              setSubmitting(false);
            }
          },
          () => {
            // Per-frame decode failures are expected while the camera
            // hunts for a code — intentionally not surfaced as errors.
          }
        );
      } catch (err) {
        setError(
          err instanceof Error
            ? `Camera error: ${err.message}`
            : "Could not access the camera. Check permissions and try again."
        );
      }
    }

    start();

    return () => {
      cancelled = true;
      scannerRef.current
        ?.stop()
        .then(() => scannerRef.current?.clear())
        .catch(() => {});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center">
      <div className="w-full max-w-sm rounded-t-2xl border border-border bg-surface p-4 sm:rounded-2xl">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg">Scan station QR code</h2>
          <button onClick={onClose} className="rounded-md p-1.5 text-text-muted hover:bg-surface-2">
            <X size={18} />
          </button>
        </div>

        <div className="qr-grid-bg relative overflow-hidden rounded-lg border border-border">
          <div id={SCANNER_ELEMENT_ID} className="aspect-square w-full" />
          {submitting && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <Loader2 className="animate-spin text-white" size={28} />
            </div>
          )}
        </div>

        {error && (
          <div className="mt-3 flex items-start gap-2 rounded-md bg-danger/10 p-3 text-sm text-danger">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <p className="mt-3 text-center text-xs text-text-muted">
          Codes refresh every 30–60s. If it fails, ask the station to refresh and rescan.
        </p>
      </div>
    </div>
  );
}
