"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationBell } from "@/components/notification-bell";
import { OrgSwitcher } from "@/components/org-switcher";
import {
  MessageSquare,
  Users,
  BarChart3,
  Megaphone,
  ImageIcon,
  Settings,
  LogOut,
  Menu,
  ChevronDown,
  Bot,
} from "lucide-react";

interface UserInfo {
  name: string;
  email: string;
  orgId: string;
  orgName: string;
  roleName: string;
  userId: string;
}

interface NavItem {
  href: string;
  label: string;
  icon: typeof MessageSquare;
}

const MAIN_NAV: NavItem[] = [
  { href: "/inbox", label: "กล่องข้อความ", icon: MessageSquare },
  { href: "/contacts", label: "รายชื่อ", icon: Users },
  { href: "/auto-reply", label: "รูปแบบตอบกลับอัตโนมัติ", icon: Bot },
];

const TOOLS_NAV: NavItem[] = [
  { href: "/analytics", label: "วิเคราะห์", icon: BarChart3 },
  { href: "/ads", label: "โฆษณา", icon: Megaphone },
  { href: "/media-library", label: "คลังสื่อ", icon: ImageIcon },
];

function NavGroup({ label, items, onClick }: { label: string; items: NavItem[]; onClick?: () => void }) {
  const pathname = usePathname();

  return (
    <div className="mb-4">
      <p className="mb-1 px-3 text-xs font-medium uppercase tracking-widest text-muted-foreground/60">
        {label}
      </p>
      <div className="flex flex-col">
        {items.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClick}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "relative flex items-center gap-3 px-3 py-2 text-sm transition-colors",
                isActive
                  ? "font-semibold text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {isActive && (
                <span className="absolute left-0 top-1/2 h-4 w-[2px] -translate-y-1/2 rounded-r bg-accent" />
              )}
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function UserMenu({ user }: { user: UserInfo }) {
  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-muted">
        <Avatar className="h-7 w-7">
          <AvatarFallback className="bg-zinc-100 text-zinc-600 text-xs font-medium dark:bg-zinc-800 dark:text-zinc-400">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 text-left min-w-0">
          <p className="truncate text-sm font-medium leading-none">{user.name}</p>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">{user.roleName}</p>
        </div>
        <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-2 py-1.5 text-sm">
          <p className="font-medium">{user.name}</p>
          <p className="text-muted-foreground">{user.email}</p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => (window.location.href = "/settings/general")}>
          <Settings className="mr-2 h-4 w-4" />
          ตั้งค่า
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="text-destructive">
          <LogOut className="mr-2 h-4 w-4" />
          ออกจากระบบ
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function SidebarContent({ user, onNavClick }: { user: UserInfo; onNavClick?: () => void }) {
  const pathname = usePathname();
  const isSettingsActive = pathname.startsWith("/settings");

  return (
    <div className="flex h-full flex-col border-r bg-background">
      <div className="flex h-12 items-center px-3 shrink-0">
        <OrgSwitcher currentOrgId={user.orgId} currentOrgName={user.orgName} />
      </div>

      <ScrollArea className="flex-1 py-2">
        <NavGroup label="หลัก" items={MAIN_NAV} onClick={onNavClick} />
        <NavGroup label="เครื่องมือ" items={TOOLS_NAV} onClick={onNavClick} />

        <div className="mb-4">
          <p className="mb-1 px-3 text-xs font-medium uppercase tracking-widest text-muted-foreground/60">
            จัดการ
          </p>
          <Link
            href="/settings/general"
            onClick={onNavClick}
            aria-current={isSettingsActive ? "page" : undefined}
            className={cn(
              "relative flex items-center gap-3 px-3 py-2 text-sm transition-colors",
              isSettingsActive
                ? "font-semibold text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {isSettingsActive && (
              <span className="absolute left-0 top-1/2 h-4 w-[2px] -translate-y-1/2 rounded-r bg-accent" />
            )}
            <Settings className="h-4 w-4 shrink-0" />
            ตั้งค่า
          </Link>
        </div>
      </ScrollArea>

      <div className="shrink-0 border-t px-3 py-2 space-y-1">
        <div className="flex items-center gap-1 px-1">
          <NotificationBell userId={user.userId} />
          <ThemeToggle />
        </div>
        <UserMenu user={user} />
      </div>
    </div>
  );
}

export function DesktopSidebar({ user }: { user: UserInfo }) {
  return (
    <aside className="hidden w-56 shrink-0 lg:block">
      <SidebarContent user={user} />
    </aside>
  );
}

export function MobileSidebar({ user }: { user: UserInfo }) {
  return (
    <Sheet>
      <SheetTrigger render={<Button variant="ghost" size="icon" className="lg:hidden" />}>
        <Menu className="h-5 w-5" />
        <span className="sr-only">เมนู</span>
      </SheetTrigger>
      <SheetContent side="left" className="w-56 p-0">
        <SidebarContent user={user} />
      </SheetContent>
    </Sheet>
  );
}
