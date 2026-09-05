import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "@/generated/prisma/client";

// Next dev does hot reloads, and each one would otherwise open a fresh pool
// until the database refuses connections. Stash the client on globalThis so a
// reload reuses it. In production the module is only evaluated once.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createClient() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Copy .env.example to .env and fill in your " +
        "Neon connection string.",
    );
  }

  // Prisma 7 connects through a driver adapter rather than a bundled engine.
  // PrismaPg wraps node-postgres, which talks to Neon's pooled endpoint fine.
  const adapter = new PrismaPg({ connectionString });

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

function getClient(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createClient();
  }
  return globalForPrisma.prisma;
}

/**
 * Constructed on first use rather than at import time. `next build` imports
 * every module to collect metadata, and a build machine legitimately may not
 * have DATABASE_URL set — connecting eagerly would turn that into a build
 * failure instead of a runtime error on the one route that needs the database.
 */
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, property, receiver) {
    return Reflect.get(getClient(), property, receiver);
  },
  has(_target, property) {
    return property in getClient();
  },
});
