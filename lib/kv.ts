import { kv } from "@vercel/kv";

const NONCE_PREFIX = "qr_nonce:";
const NONCE_TTL_SECONDS = 60; // matches MAX_TOKEN_AGE_MS in lib/qr.ts

/**
 * Atomically claims a nonce so a scanned QR token can only ever be
 * redeemed once. Returns true if this call successfully claimed the
 * nonce (i.e. it's the first time it's been seen), false if the nonce
 * was already claimed (replay attack, or a double-submit from the client).
 *
 * Uses SET NX so the check-and-set is a single atomic Redis operation —
 * two concurrent requests racing on the same nonce can never both win.
 */
export async function claimNonce(nonce: string): Promise<boolean> {
  const result = await kv.set(NONCE_PREFIX + nonce, "1", {
    nx: true,
    ex: NONCE_TTL_SECONDS,
  });
  // Upstash/Vercel KV returns "OK" (or truthy) on success, null when NX fails.
  return result !== null;
}

/**
 * Tracks which userId currently holds an ACTIVE session, as a fast
 * cache in front of the Postgres uniqueness check, so we can reject
 * overlapping clock-ins without a round trip to the DB on the hot path.
 * The DB row remains the source of truth; this is purely an optimization
 * + belt-and-suspenders guard against race conditions.
 */
export async function markUserActive(userId: string, sessionId: string): Promise<void> {
  await kv.set(`active_session:${userId}`, sessionId);
}

export async function clearUserActive(userId: string): Promise<void> {
  await kv.del(`active_session:${userId}`);
}

export async function getActiveSessionId(userId: string): Promise<string | null> {
  return (await kv.get<string>(`active_session:${userId}`)) ?? null;
}
