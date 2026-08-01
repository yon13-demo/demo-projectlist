import crypto from "crypto";

/**
 * Dynamic QR Code payload contract.
 *
 * Payload = Base64Url(JSON({ projectId, userId, timestamp, nonce, signature }))
 * signature = HMAC-SHA256(`${projectId}:${userId}:${timestamp}:${nonce}`, QR_SECRET_KEY)
 *
 * The QR code embedded at a project workstation is regenerated every
 * 30–60s client-side (see components/QRScannerModal.tsx generator demo,
 * or a dedicated kiosk route) so that a photographed/leaked code becomes
 * useless shortly after capture.
 */

const QR_SECRET_KEY = process.env.QR_SECRET_KEY;
const MAX_TOKEN_AGE_MS = 60_000; // 60 seconds

export interface QrPayload {
  projectId: string;
  userId: string;
  timestamp: number; // ms epoch
  nonce: string;
  signature: string;
}

function getSecret(): string {
  if (!QR_SECRET_KEY) {
    throw new Error(
      "QR_SECRET_KEY is not set. Add it to your environment before generating or validating QR tokens."
    );
  }
  return QR_SECRET_KEY;
}

function sign(projectId: string, userId: string, timestamp: number, nonce: string): string {
  const message = `${projectId}:${userId}:${timestamp}:${nonce}`;
  return crypto.createHmac("sha256", getSecret()).update(message).digest("hex");
}

/**
 * Generates a fresh signed QR payload for a given project/workstation.
 * `userId` may be a placeholder (e.g. "kiosk") for station-generated codes
 * that are scanned by a specific user's phone, since the user's real
 * identity is bound to the *session* created by the authenticated caller
 * of /api/v1/sessions/clock-in — the payload only needs to prove the
 * *station* is genuine and the code is fresh.
 */
export function generateQrToken(projectId: string, userId: string): string {
  const timestamp = Date.now();
  const nonce = crypto.randomBytes(16).toString("hex");
  const signature = sign(projectId, userId, timestamp, nonce);

  const payload: QrPayload = { projectId, userId, timestamp, nonce, signature };
  return Buffer.from(JSON.stringify(payload)).toString("base64url");
}

export type QrValidationError =
  | "MALFORMED"
  | "EXPIRED"
  | "BAD_SIGNATURE";

export type QrValidationResult =
  | { ok: true; payload: QrPayload }
  | { ok: false; error: QrValidationError };

/**
 * Decodes + verifies a scanned QR token. Does NOT check replay (nonce
 * reuse) — that requires the atomic Vercel KV SETNX check performed by
 * the caller (see app/api/v1/sessions/clock-in/route.ts), since a pure
 * function has no access to shared KV state.
 */
export function verifyQrToken(token: string): QrValidationResult {
  let payload: QrPayload;
  try {
    const json = Buffer.from(token, "base64url").toString("utf8");
    payload = JSON.parse(json);
    if (
      !payload ||
      typeof payload.projectId !== "string" ||
      typeof payload.userId !== "string" ||
      typeof payload.timestamp !== "number" ||
      typeof payload.nonce !== "string" ||
      typeof payload.signature !== "string"
    ) {
      return { ok: false, error: "MALFORMED" };
    }
  } catch {
    return { ok: false, error: "MALFORMED" };
  }

  const age = Date.now() - payload.timestamp;
  if (age > MAX_TOKEN_AGE_MS || age < -5_000) {
    // small negative tolerance for clock skew
    return { ok: false, error: "EXPIRED" };
  }

  const expected = sign(payload.projectId, payload.userId, payload.timestamp, payload.nonce);
  const expectedBuf = Buffer.from(expected, "hex");
  const actualBuf = Buffer.from(payload.signature, "hex");

  const validSignature =
    expectedBuf.length === actualBuf.length &&
    crypto.timingSafeEqual(expectedBuf, actualBuf);

  if (!validSignature) {
    return { ok: false, error: "BAD_SIGNATURE" };
  }

  return { ok: true, payload };
}
