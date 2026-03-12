import { auth, isAdminUser } from "@/auth";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/app/dashboard/DashboardShell";

export const dynamic = "force-dynamic";

/**
 * スマホ（lg未満）絶対ルール:
 * - サイドバーは display: none !important で完全消去（Shell側でDOMに出さない）
 * - メインは margin-left: 0、横幅 100%
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let session = null;
  try {
    session = await auth();
  } catch (e) {
    console.error("[DashboardLayout] auth() failed:", e);
    redirect("/");
  }
  if (!session) redirect("/");

  const userName =
    (session?.user &&
      typeof session.user === "object" &&
      ("name" in session.user
        ? session.user.name
        : "email" in session.user
          ? session.user.email
          : null)) ??
    "—";
  const displayName = typeof userName === "string" ? userName : "—";
  const isAdmin = isAdminUser(session);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @media (max-width: 1023px) {
          [data-dashboard-main] { margin-left: 0 !important; width: 100% !important; max-width: 100% !important; }
          [data-dashboard-sidebar] { display: none !important; }
        }
      `}} />
      <DashboardShell displayName={displayName} isAdmin={isAdmin}>
        {children}
      </DashboardShell>
    </>
  );
}
