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
  { href: "/inbox", label: "แชท", icon: MessageSquare },
  { href: "/contacts", label: "รายชื่อ", icon: Users },
];

const CONTENT_NAV: NavItem[] = [
  { href: "/auto-reply", label: "ข้อความ", icon: Bot },
  { href: "/ai-bot", label: "อินเทนต์", icon: Sparkles },
  { href: "/templates", label: "ข้อความด่วน", icon: MessageCircle },
  { href: "/knowledge-base", label: "ฐานความรู้", icon: BookOpen },
  { href: "/line-rich-menu", label: "เมนู", icon: LayoutGrid },
];

const TOOLS_NAV: NavItem[] = [
  { href: "/analytics", label: "วิเคราะห์", icon: BarChart3 },
  { href: "/ads", label: "โฆษณา", icon: Megaphone },
  { href: "/media-library", label: "คลังสื่อ", icon: ImageIcon },
];

function NavLink({ item, onClick }: { item: NavItem; onClick?: () => void }) {
  const pathname = usePathname();
  const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

  return (
    <Link
      href={item.href}
      onClick={onClick}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "group relative flex flex-col items-center gap-1 rounded-xl px-1 py-2.5 text-xs font-medium transition-all duration-150",
        isActive
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
      )}
    >
      <item.icon className={cn("h-5 w-5 shrink-0", isActive && "text-primary")} />
      <span className="text-center leading-tight line-clamp-1">{item.label}</span>
    </Link>
  );
}

function NavGroup({ items, onClick }: { items: NavItem[]; onClick?: () => void }) {
  return (
    <div className="flex flex-col gap-0.5">
      {items.map((item) => (
        <NavLink key={item.href} item={item} onClick={onClick} />
      ))}
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
      <DropdownMenuTrigger className="flex items-center justify-center rounded-lg p-1 transition-colors hover:bg-muted/80">
        <Avatar className="h-8 w-8 rounded-lg ring-2 ring-border/50">
          <AvatarFallback className="rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 text-primary text-xs font-bold">
            {initials}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center" side="right" sideOffset={8} className="w-56">
        <div className="px-2 py-2 text-sm">
          <p className="font-semibold">{user.name}</p>
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

function SidebarContent({ user, onNavClick }: {
  user: UserInfo;
  onNavClick?: () => void;
}) {
  const pathname = usePathname();
  const isSettingsActive = pathname.startsWith("/settings");

  return (
    <div className="flex h-full flex-col bg-sidebar border-r border-sidebar-border">
      {/* Logo */}
      <div className="flex h-14 items-center justify-center shrink-0 border-b border-sidebar-border">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary shadow-sm shadow-primary/25">
          <MessageSquare className="h-4 w-4 text-primary-foreground" />
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-2 py-2">
        <NavGroup items={MAIN_NAV} onClick={onNavClick} />
        <div className="mx-auto my-2 h-px w-8 bg-border/60" />
        <NavGroup items={CONTENT_NAV} onClick={onNavClick} />
        <div className="mx-auto my-2 h-px w-8 bg-border/60" />
        <NavGroup items={TOOLS_NAV} onClick={onNavClick} />
        <div className="mx-auto my-2 h-px w-8 bg-border/60" />

        {/* Settings */}
        <Link
          href="/settings/general"
          onClick={onNavClick}
          aria-current={isSettingsActive ? "page" : undefined}
          className={cn(
            "flex flex-col items-center gap-1 rounded-xl px-1 py-2.5 text-xs font-medium transition-all duration-150",
            isSettingsActive
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
          )}
        >
          <Settings className={cn("h-5 w-5 shrink-0", isSettingsActive && "text-primary")} />
          <span className="text-center leading-tight">ตั้งค่า</span>
        </Link>
      </ScrollArea>

      {/* User */}
      <div className="shrink-0 border-t border-sidebar-border py-2 flex justify-center">
        <UserMenu user={user} />
      </div>
    </div>
  );
}

export function DesktopSidebar({ user }: { user: UserInfo }) {
  return (
    <aside className="hidden shrink-0 lg:block w-[76px]">
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
      <SheetContent side="left" className="w-[76px] p-0">
        <SidebarContent user={user} />
      </SheetContent>
    </Sheet>
  );
}
