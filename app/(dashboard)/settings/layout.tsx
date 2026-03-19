"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Building2,
  Users,
  MessageSquareCode,
  Clock,
  ShieldAlert,
  Plug,
  BarChart3,
} from "lucide-react";

const SETTINGS_NAV = [
  { href: "/settings/general", label: "ทั่วไป", icon: Building2 },
  { href: "/settings/team", label: "ทีม", icon: Users },
  { href: "/settings/channels", label: "ช่องทาง", icon: MessageSquareCode },
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
      <div className="border-b border-border/60 md:hidden overflow-x-auto">
        <nav className="flex gap-2 p-3">
          {SETTINGS_NAV.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-medium transition-colors whitespace-nowrap",
                  isActive
                    ? "bg-primary/8 text-primary font-medium"
                    : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                )}
              >
                <item.icon className="h-3.5 w-3.5 shrink-0 opacity-80" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden h-full w-60 shrink-0 border-r border-border/60 md:flex md:flex-col">
        <div className="flex min-h-14 shrink-0 items-center border-b border-border/60 px-6 py-4">
          <h2 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60">
            ตั้งค่า
          </h2>
        </div>
        <ScrollArea className="min-h-0 flex-1">
          <nav className="flex flex-col gap-1.5 p-4">
            {SETTINGS_NAV.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm transition-colors",
                    isActive
                      ? "bg-primary/8 text-primary font-medium"
                      : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                  )}
                >
                  <item.icon className="h-4.5 w-4.5 shrink-0 opacity-80" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </ScrollArea>
      </aside>
      <div className="flex-1 overflow-hidden h-full">
        {children}
      </div>
    </div>
  );
}
