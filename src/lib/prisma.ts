/**
 * Prisma クライアントのシングルトン。
 * 本番（Vercel 等）では DATABASE_URL（Pooler）を優先し接続数・タイムアウトを防ぐ。
 * .env の引用符を除去してから使用する。
 */
import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

function sanitizeDbUrl(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  let url = raw.trim().replace(/^["']|["']$/g, "");
  if (!url.startsWith("postgresql://") && !url.startsWith("postgres://")) return undefined;
  // Supabase では SSL が必須のことが多い（本番・Vercel で接続エラーを防ぐ）
  if (url.includes("supabase") && !url.includes("sslmode=")) {
    url += url.includes("?") ? "&sslmode=require" : "?sslmode=require";
  }
  return url;
}

// サーバーレスでは Pooler (DATABASE_URL) を優先。未設定時は DIRECT_URL にフォールバック
const dbUrl = sanitizeDbUrl(process.env.DATABASE_URL || process.env.DIRECT_URL);

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    ...(dbUrl ? { datasources: { db: { url: dbUrl } } } : {}),
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : undefined,
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
