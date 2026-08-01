# Site Ledger — Project Management & Live Time Tracking

A Next.js 14 (App Router) application for managing construction/field
projects with QR-code-based clock-in/clock-out time tracking.

## Stack

- Next.js 14 (App Router, Route Handlers, Server Components)
- TypeScript
- Prisma ORM + Vercel Postgres (Neon)
- Vercel KV (Upstash Redis) — atomic QR replay protection
- Auth.js v5 (NextAuth) with credentials login
- Tailwind CSS
- `html5-qrcode` for camera-based scanning
- Pusher Channels (stubbed) for the live activity feed

## Project layout

```
app/
  api/
    auth/[...nextauth]/route.ts     Auth.js handler
    v1/
      projects/route.ts             GET (list+filter), POST (create)
      sessions/
        clock-in/route.ts           HMAC verify + KV anti-replay + create session
        clock-out/route.ts          Close session, compute duration, update tasks
        active/route.ts             Caller's running session
      reports/timesheet/route.ts    JSON or CSV export
  dashboard/page.tsx                Main dashboard screen
components/
  DashboardHeader.tsx
  StatCards.tsx
  ProjectList.tsx
  ProjectCard.tsx
  QRScannerModal.tsx
  LiveTimerBadge.tsx
lib/
  prisma.ts   qr.ts   kv.ts   auth.ts   types.ts
prisma/
  schema.prisma   seed.ts
```

## QR anti-replay design

1. A station/kiosk (or `generateQrToken` in `lib/qr.ts`) mints a payload
   every 30–60s: `{ projectId, userId, timestamp, nonce, signature }`,
   base64url-encoded. `signature` is `HMAC-SHA256` over the other fields
   using `QR_SECRET_KEY`, so a payload can't be forged without the key.
2. `/api/v1/sessions/clock-in` decodes the token, rejects it if older
   than 60s, and re-derives the HMAC to confirm it hasn't been tampered
   with (constant-time comparison via `crypto.timingSafeEqual`).
3. It then calls `claimNonce()` (`lib/kv.ts`), which does an atomic
   `SET NX EX 60` in Vercel KV. Because this is a single atomic Redis
   op, two requests racing on the same nonce can never both succeed —
   the second gets HTTP 409 ("Replay Attack Detected").
4. Before creating the session, the route also checks Postgres for an
   existing `ACTIVE` `WorkSession` for that user and rejects overlap.

## Getting started

```bash
cp .env.example .env
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run prisma:seed
npm run dev
```

Seeded accounts (password `password123` for all):
- `admin@siteledger.dev` — ADMIN
- `manager@siteledger.dev` — MANAGER
- `member@siteledger.dev` — MEMBER

## Notes / next steps

- The `LiveTimerBadge` pause button is currently visual only — wire it
  to a `PAUSED` status + a paused-duration accumulator if you need real
  pause/resume, since `WorkSession.status` already has a `PAUSED` enum
  value reserved for this.
- Realtime broadcast calls are stubbed as comments in the clock-in/out
  routes; wire up a `lib/pusher.ts` (or Supabase Realtime channel) and
  subscribe to it from a `LiveActivityStream` component to complete the
  dashboard's audit-log feed.
- `reports/timesheet` returns CSV today; swap in a PDF library
  (e.g. `@react-pdf/renderer`) behind `?format=pdf` if you need a
  print-ready sheet.
- This scaffold was generated in a sandboxed environment without
  network access to install npm packages or run `next build` — review
  dependency versions in `package.json` and run a build locally before
  deploying.
