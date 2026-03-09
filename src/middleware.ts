/**
 * 認証ガード: 未ログインで /dashboard にアクセスした場合は / へリダイレクト。
 * ログイン済みで / または /login / /register にアクセスした場合は /dashboard へリダイレクト。
 */
import { auth } from "@/auth";

export default auth((req) => {
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

export const config = {
  matcher: ["/dashboard/:path*", "/", "/login", "/register"],
};
