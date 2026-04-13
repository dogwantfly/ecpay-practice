import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaClient } from "@/generated/prisma/client";
import path from "path";

/**
 * Resolve the libsql URL from DATABASE_URL env var.
 * - Linux (Zeabur): file:/data/prod.db  → used as-is
 * - Windows dev:    file:./dev.db        → resolved to absolute with forward slashes
 * - Fallback:       cwd/dev.db
 */
function getDbUrl(): string {
  const env = process.env.DATABASE_URL;
  if (env) {
    // Absolute file URL (Linux production): file:/data/prod.db
    if (/^file:\/.+/.test(env)) return env;
    // Relative file URL: file:./dev.db  or  file:dev.db
    if (env.startsWith("file:")) {
      const rel = env.replace(/^file:/, "");
      const abs = path.resolve(process.cwd(), rel);
      return "file:" + abs.split(path.sep).join("/");
    }
  }
  // Dev fallback
  const abs = path.resolve(process.cwd(), "dev.db");
  return "file:" + abs.split(path.sep).join("/");
}

function createPrismaClient() {
  const adapter = new PrismaLibSql({ url: getDbUrl() });
  return new PrismaClient({ adapter });
}

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient>;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
