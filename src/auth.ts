import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        })

        if (user && user.password === (credentials.password as string)) {
          return { id: user.id, email: user.email, name: user.name }
        }
        return null
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) token.sub = user.id
      return token
    },
    session: async ({ session, token }) => {
      if (session.user) session.user.id = token.sub as string
      return session
    },
  },
  // Vercel では AUTH_SECRET を必須で設定すること（未設定だとビルド/実行時エラー）
  secret: process.env.AUTH_SECRET,
})
