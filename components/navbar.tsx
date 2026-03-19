"use client";

import { NotificationBell } from "@/components/notification-bell";
import { ThemeToggle } from "@/components/theme-toggle";
import { MobileSidebar } from "@/components/sidebar";

interface NavbarProps {
  user: {
    name: string;
    email: string;
    orgId: string;
    orgName: string;
    roleName: string;
    userId: string;
  };
}

export function Navbar({ user }: NavbarProps) {
  return (
    <header className="flex h-12 shrink-0 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur-sm">
      <div className="lg:hidden">
        <MobileSidebar user={user} />
      </div>
      <div className="flex-1" />
      <div className="flex items-center gap-1">
        <NotificationBell userId={user.userId} />
        <ThemeToggle />
      </div>
    </header>
  );
}
