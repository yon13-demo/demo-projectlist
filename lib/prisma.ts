import { PrismaClient } from "@prisma/client";

// Prisma client is instantiated lazily so that Next.js "Collecting page
// data" (which imports every route module) does not throw
// "PrismaClient did not initialize yet" when the generated binary is
// absent (e.g. during local development before `prisma generate`, or in
// CI pipelines that defer generation to a separate step).
//
// On Vercel, `prisma generate` runs automatically as part of the build
// via the postinstall script / Vercel Postgres integration, so the
// binary is always present before the build runs.

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function getPrismaClient(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = new PrismaClient({
      log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
    });
  }
  return globalForPrisma.prisma;
}

// `prisma` is a Proxy that defers construction to the first property
// access, which only happens inside a request handler — never during
// module-level evaluation at build time.
export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getPrismaClient();
    const value = (client as unknown as Record<string | symbol, unknown>)[prop];
    return typeof value === "function" ? value.bind(client) : value;
  },
});
