import { PrismaClient } from "@prisma/client";

// Singleton de PrismaClient para evitar múltiples conexiones en desarrollo
// (Next.js recarga módulos en caliente y crearía un cliente por recarga).
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
