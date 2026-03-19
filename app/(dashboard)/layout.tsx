import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { DesktopSidebar } from "@/components/sidebar";
import { Navbar } from "@/components/navbar";
import { NewMessageNotifier } from "@/components/new-message-notifier";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const userInfo = {
    name: user.name,
    email: user.email,
    orgId: user.orgId,
    orgName: user.organization.name,
    roleName: user.role.name,
    userId: user.id,
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <NewMessageNotifier orgId={user.orgId} />
      <DesktopSidebar user={userInfo} />

      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar user={userInfo} />
        <main className="flex-1 overflow-hidden bg-muted/20 dark:bg-background">
          {children}
        </main>
      </div>
    </div>
  );
}
