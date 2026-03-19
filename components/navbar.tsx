"use client";

import { NotificationBell } from "@/components/notification-bell";
import { ThemeToggle } from "@/components/theme-toggle";
import { MobileSidebar } from "@/components/sidebar";
import { Search } from "lucide-react";

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
    <header className="flex h-14 items-center gap-3 border-b bg-background/80 backdrop-blur-sm px-4 shrink-0">
      <div className="lg:hidden">
        <MobileSidebar user={user} />
      </div>

      <div className="flex-1" />

      <div className="hidden sm:flex items-center">
        <button className="group relative flex items-center gap-2 rounded-lg bg-muted/60 px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
          <Search className="h-3.5 w-3.5" />
          <span className="text-[13px]">ค้นหา...</span>
          <kbd className="pointer-events-none ml-4 hidden h-5 items-center gap-0.5 rounded border bg-background px-1.5 font-mono text-[10px] font-medium text-muted-foreground/70 sm:inline-flex">
            ⌘K
          </kbd>
        </button>
      </div>

      <div className="flex items-center gap-0.5">
        <NotificationBell userId={user.userId} />
        <ThemeToggle />
      </div>
    </header>
  );
}
