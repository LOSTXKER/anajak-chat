"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Building2,
  Users,
  MessageSquareCode,
  Bot,
  BookOpen,
  MessageCircle,
  Clock,
  ShieldAlert,
  Plug,
  BarChart3,
} from "lucide-react";

const SETTINGS_NAV = [
  { href: "/settings/general", label: "ทั่วไป", icon: Building2 },
  { href: "/settings/team", label: "ทีม", icon: Users },
  { href: "/settings/channels", label: "ช่องทาง", icon: MessageSquareCode },
  { href: "/settings/ai-bot", label: "AI Bot", icon: Bot },
  { href: "/settings/knowledge-base", label: "ฐานความรู้", icon: BookOpen },
  { href: "/settings/templates", label: "ข้อความด่วน", icon: MessageCircle },
  { href: "/settings/business-hours", label: "เวลาทำการ", icon: Clock },
  { href: "/settings/sla", label: "SLA", icon: ShieldAlert },
  { href: "/settings/erp", label: "ERP", icon: Plug },
  { href: "/settings/capi", label: "CAPI", icon: BarChart3 },
];

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col md:flex-row">
      {/* Mobile horizontal nav */}
      <div className="border-b md:hidden overflow-x-auto">
        <nav className="flex gap-1 p-2">
          {SETTINGS_NAV.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors whitespace-nowrap",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                )}
              >
                <item.icon className="h-3.5 w-3.5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden w-56 shrink-0 border-r md:block">
        <div className="flex h-14 items-center border-b px-4">
          <h2 className="text-lg font-semibold">ตั้งค่า</h2>
        </div>
        <ScrollArea className="h-[calc(100%-3.5rem)]">
          <nav className="flex flex-col gap-1 p-3">
            {SETTINGS_NAV.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary font-medium border-l-2 border-primary"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </ScrollArea>
      </aside>
      <div className="flex-1 overflow-y-auto h-full p-4 md:p-6 animate-in fade-in duration-300">{children}</div>
    </div>
  );
}
