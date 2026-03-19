"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useSidebar } from "@/hooks/use-sidebar";
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
import {
  MessageSquare,
  Users,
  BarChart3,
  Megaphone,
  ImageIcon,
  Settings,
  LogOut,
  Menu,
  Bot,
  BookOpen,
  MessageCircle,
  LayoutGrid,
  Sparkles,
  ChevronsLeft,
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

interface NavSection {
  title: string;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: "หลัก",
    items: [
      { href: "/inbox", label: "แชท", icon: MessageSquare },
      { href: "/contacts", label: "รายชื่อ", icon: Users },
    ],
  },
  {
    title: "เนื้อหา",
    items: [
      { href: "/auto-reply", label: "ข้อความตอบกลับ", icon: Bot },
      { href: "/ai-bot", label: "อินเทนต์", icon: Sparkles },
      { href: "/templates", label: "ข้อความด่วน", icon: MessageCircle },
      { href: "/knowledge-base", label: "ฐานความรู้", icon: BookOpen },
      { href: "/line-rich-menu", label: "ริชเมนู", icon: LayoutGrid },
    ],
  },
  {
    title: "เครื่องมือ",
    items: [
      { href: "/analytics", label: "วิเคราะห์", icon: BarChart3 },
      { href: "/ads", label: "โฆษณา", icon: Megaphone },
      { href: "/media-library", label: "คลังสื่อ", icon: ImageIcon },
    ],
  },
];

function NavLink({
  item,
  collapsed,
  onClick,
}: {
  item: NavItem;
  collapsed: boolean;
  onClick?: () => void;
}) {
  const pathname = usePathname();
  const isActive =
    pathname === item.href || pathname.startsWith(item.href + "/");

  return (
    <Link
      href={item.href}
      onClick={onClick}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors duration-150",
        collapsed && "justify-center px-2",
        isActive
          ? "bg-primary/10 font-medium text-primary"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
      title={collapsed ? item.label : undefined}
    >
      <item.icon className="h-[18px] w-[18px] shrink-0" />
      {!collapsed && <span className="truncate">{item.label}</span>}
    </Link>
  );
}

function UserMenu({ user, collapsed }: { user: UserInfo; collapsed: boolean }) {
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
      <DropdownMenuTrigger
        className={cn(
          "flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors hover:bg-muted",
          collapsed && "justify-center px-2"
        )}
      >
        <Avatar className="h-8 w-8 shrink-0 rounded-lg">
          <AvatarFallback className="rounded-lg bg-primary/10 text-xs font-semibold text-primary">
            {initials}
          </AvatarFallback>
        </Avatar>
        {!collapsed && (
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{user.name}</p>
            <p className="truncate text-xs text-muted-foreground">{user.orgName}</p>
          </div>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align={collapsed ? "center" : "start"}
        side="right"
        sideOffset={8}
        className="w-56"
      >
        <div className="px-2 py-2 text-sm">
          <p className="font-medium">{user.name}</p>
          <p className="text-xs text-muted-foreground">{user.email}</p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => (window.location.href = "/settings/general")}>
          <Settings className="mr-2 h-4 w-4" />
          ตั้งค่า
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
          <LogOut className="mr-2 h-4 w-4" />
          ออกจากระบบ
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function SidebarContent({
  user,
  collapsed,
  onToggle,
  onNavClick,
}: {
  user: UserInfo;
  collapsed: boolean;
  onToggle?: () => void;
  onNavClick?: () => void;
}) {
  const pathname = usePathname();
  const isSettingsActive = pathname.startsWith("/settings");

  return (
    <div className="flex h-full flex-col border-r bg-sidebar">
      {/* Header */}
      <div className={cn(
        "flex h-14 shrink-0 items-center border-b px-4",
        collapsed ? "justify-center px-2" : "justify-between"
      )}>
        <Link href="/inbox" className="flex items-center gap-2.5" onClick={onNavClick}>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary">
            <MessageSquare className="h-4 w-4 text-primary-foreground" />
          </div>
          {!collapsed && (
            <span className="text-sm font-bold tracking-tight">Anajak</span>
          )}
        </Link>
        {!collapsed && onToggle && (
          <button
            onClick={onToggle}
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <ChevronsLeft className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-3">
        <div className="space-y-6">
          {NAV_SECTIONS.map((section) => (
            <div key={section.title}>
              {!collapsed && (
                <p className="mb-1.5 px-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">
                  {section.title}
                </p>
              )}
              <div className="space-y-0.5">
                {section.items.map((item) => (
                  <NavLink
                    key={item.href}
                    item={item}
                    collapsed={collapsed}
                    onClick={onNavClick}
                  />
                ))}
              </div>
            </div>
          ))}

          {/* Settings */}
          {collapsed && <div className="mx-auto h-px w-6 bg-border" />}
          <Link
            href="/settings/general"
            onClick={onNavClick}
            aria-current={isSettingsActive ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors duration-150",
              collapsed && "justify-center px-2",
              isSettingsActive
                ? "bg-primary/10 font-medium text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
            title={collapsed ? "ตั้งค่า" : undefined}
          >
            <Settings className="h-[18px] w-[18px] shrink-0" />
            {!collapsed && <span>ตั้งค่า</span>}
          </Link>
        </div>
      </ScrollArea>

      {/* User */}
      <div className="shrink-0 border-t p-3">
        <UserMenu user={user} collapsed={collapsed} />
      </div>
    </div>
  );
}

export function DesktopSidebar({ user }: { user: UserInfo }) {
  const { collapsed, hydrated, toggle } = useSidebar();

  return (
    <aside
      className={cn(
        "hidden shrink-0 lg:block",
        hydrated
          ? "transition-[width] duration-200 ease-in-out"
          : "transition-none",
        collapsed ? "w-16" : "w-60"
      )}
    >
      <SidebarContent
        user={user}
        collapsed={collapsed}
        onToggle={toggle}
      />
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
      <SheetContent side="left" className="w-60 p-0">
        <SidebarContent user={user} collapsed={false} />
      </SheetContent>
    </Sheet>
  );
}
