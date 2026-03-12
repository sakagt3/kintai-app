import { auth, isAdminUser } from "@/auth";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/app/dashboard/DashboardShell";

export const dynamic = "force-dynamic";

/**
 * スマホ（lg未満）時: メインエリアの左マージンを !important で 0 に固定。
 * サイドバーは DashboardShell 内で「React条件分岐 {isMobile ? null : <Sidebar />}」により DOM から物理削除。
 */
const MOBILE_FORCE_STYLES = `
@media (max-width: 1023px) {
  [data-dashboard-main] {
    margin-left: 0 !important;
    margin-right: 0 !important;
    width: 100% !important;
    max-width: 100% !important;
    padding-left: 0 !important;
  }
}
`;

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
      <style dangerouslySetInnerHTML={{ __html: MOBILE_FORCE_STYLES }} />
      <DashboardShell displayName={displayName} isAdmin={isAdmin}>
        {children}
      </DashboardShell>
    </>
  );
}
