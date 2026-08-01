import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Site Ledger — Project & Time Tracking",
  description: "Project management with QR-code live time tracking.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // Fonts are loaded via @import in globals.css using a preconnect-safe
    // pattern, so next/font (which requires build-time network access to
    // Google Fonts) is intentionally not used here. Swap to next/font/google
    // when deploying to Vercel where Google Fonts is reachable at build time.
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Loaded async — the stylesheet itself is not critical-path */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap"
        />
      </head>
      <body className="font-body">{children}</body>
    </html>
  );
}
