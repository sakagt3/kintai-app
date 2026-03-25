import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";

function isBcryptHash(str: string): boolean {
  return /^\$2[aby]?\$\d+\$/.test(str);
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true, // AUTH_URL 未設定時はリクエストの Host から URL を解決（Invalid URL 回避）
  providers: [
    Credentials({
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) return null;

          const email = (credentials.email as string).trim().toLowerCase();
          const user = await prisma.user.findUnique({
            where: { email },
          });

          if (!user) return null;

          const plainPassword = credentials.password as string;
          const { compare } = await import("bcryptjs");
          const matches = isBcryptHash(user.password)
            ? await compare(plainPassword, user.password)
            : user.password === plainPassword;

          if (matches) {
            const u = user as { id: string; email: string; name: string | null; image?: string | null; role: string };
            await prisma.loginHistory
              .create({ data: { userId: u.id } })
              .catch((err: unknown) => console.error("[auth] LoginHistory create failed:", err));
            return {
              id: u.id,
              email: u.email,
              name: u.name,
              image: u.image ?? undefined,
              role: u.role ?? "member",
            };
          }
          return null;
        } catch (e) {
          console.error("[auth authorize]", e);
          return null;
        }
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/",
  },
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.sub = user.id;
        token.role = (user as { role?: string }).role;
      }
      return token;
    },
    session: async ({ session, token }) => {
      if (session.user) {
        session.user.id = token.sub as string;
        session.user.role = (token.role as string) ?? "member";
      }
      return session;
    },
  },
  secret: process.env.AUTH_SECRET ?? "dev-secret-at-least-32-characters-long",
});

/** 管理者かどうか（role === "admin" または 指定メールの特例） */
export function isAdminUser(session: { user?: { email?: string | null; role?: string } | null } | null): boolean {
  if (!session?.user) return false;
  const role = (session.user as { role?: string }).role;
  const email = (session.user as { email?: string | null }).email?.trim().toLowerCase();
  return role === "admin" || email === "yuohdai33@gmail.com";
}
