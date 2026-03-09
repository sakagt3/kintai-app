/**
 * Prisma クライアントのシングルトン。
 * Supabase 利用時は DIRECT_URL（直接接続）を優先。.env の引用符を除去してから使用する。
 */
import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

function sanitizeDbUrl(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  const url = raw.trim().replace(/^["']|["']$/g, "");
  if (!url.startsWith("postgresql://") && !url.startsWith("postgres://")) return undefined;
  return url;
}

const dbUrl = sanitizeDbUrl(process.env.DIRECT_URL || process.env.DATABASE_URL);

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    ...(dbUrl ? { datasources: { db: { url: dbUrl } } } : {}),
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : undefined,
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
