/**
 * 認証ガード: 未ログインで /dashboard にアクセスした場合は /login へリダイレクト。
 * ログイン済みで /login または /register にアクセスした場合は /dashboard へリダイレクト。
 */
import { auth } from "@/auth";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isLoginPage = req.nextUrl.pathname === "/login";
  const isRegisterPage = req.nextUrl.pathname === "/register";

  if (isLoginPage || isRegisterPage) {
    if (isLoggedIn) {
      return Response.redirect(new URL("/dashboard", req.url));
    }
    return;
  }

  if (!isLoggedIn && req.nextUrl.pathname.startsWith("/dashboard")) {
    return Response.redirect(new URL("/login", req.url));
  }
});

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/register"],
};
