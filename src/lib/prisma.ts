/**
 * Prisma クライアントのシングルトン。
 * Supabase 本番（Vercel 等）では必ず DATABASE_URL に「トランザクションモード Pooler」
 * （port 6543 + ?pgbouncer=true）を設定し、DIRECT_URL に直接接続（port 5432）を設定してください。
 */
import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

function sanitizeDbUrl(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  let url = raw.trim().replace(/^["']|["']$/g, "");
  if (!url.startsWith("postgresql://") && !url.startsWith("postgres://")) return undefined;
  // Supabase: SSL 必須 & 本番では Pooler(6543) を推奨（db.xxx:5432 は Vercel から届かないことがある）
  if (url.includes("supabase") && !url.includes("sslmode=")) {
    url += url.includes("?") ? "&sslmode=require" : "?sslmode=require";
  }
  return url;
}

// ランタイムは DATABASE_URL のみ使用（Pooler 推奨）。DIRECT_URL は prisma migrate 用
const dbUrl = sanitizeDbUrl(process.env.DATABASE_URL);

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    ...(dbUrl ? { datasources: { db: { url: dbUrl } } } : {}),
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : undefined,
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
