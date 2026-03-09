/**
 * NextAuth v5 設定: 認証プロバイダー・セッション・コールバックを定義する
 */
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compareSync } from "bcryptjs";
import { prisma } from "@/lib/prisma";

function isBcryptHash(str: string): boolean {
  return /^\$2[aby]?\$\d+\$/.test(str);
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const email = (credentials.email as string).trim().toLowerCase();
        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user) return null;

        const plainPassword = credentials.password as string;
        const matches =
          isBcryptHash(user.password)
            ? compareSync(plainPassword, user.password)
            : user.password === plainPassword;

        if (matches) {
          return { id: user.id, email: user.email, name: user.name };
        }
        return null;
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) token.sub = user.id;
      return token;
    },
    session: async ({ session, token }) => {
      if (session.user) session.user.id = token.sub as string;
      return session;
    },
  },
  // Vercel では AUTH_SECRET を必須で設定すること（未設定だとビルド/実行時エラー）
  secret: process.env.AUTH_SECRET,
});
