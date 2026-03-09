/**
 * 認証ガード: 未ログインで /dashboard にアクセスした場合は / へリダイレクト。
 * ログイン済みで / または /login / /register にアクセスした場合は /dashboard へリダイレクト。
 * auth() が例外を投げてもログイン・登録ページは表示できるようにする。
 */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/auth";

const withAuth = auth((req) => {
  const isLoggedIn = !!req.auth;
  const path = req.nextUrl.pathname;
  const isLoginPage = path === "/" || path === "/login";
  const isRegisterPage = path === "/register";

  if (isLoginPage || isRegisterPage) {
    if (isLoggedIn) {
      return Response.redirect(new URL("/dashboard", req.url));
    }
    return;
  }

  if (!isLoggedIn && path.startsWith("/dashboard")) {
    return Response.redirect(new URL("/", req.url));
  }
});

export default async function middleware(req: NextRequest) {
  try {
    return await withAuth(req);
  } catch (e) {
    console.error("[middleware auth]", e);
    return NextResponse.next();
  }
}

export const config = {
  matcher: ["/dashboard/:path*", "/", "/login", "/register"],
};
