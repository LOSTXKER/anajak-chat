import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { DesktopSidebar, MobileSidebar } from "@/components/sidebar";
import { NotificationBell } from "@/components/notification-bell";
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
        <header className="flex h-12 items-center gap-3 border-b px-4 lg:hidden">
          <MobileSidebar user={userInfo} />
          <span className="text-sm font-medium">{user.organization.name}</span>
          <div className="ml-auto">
            <NotificationBell userId={user.id} />
          </div>
        </header>

        <main className="flex-1 overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
