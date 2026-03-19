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
      <div className="border-b md:hidden overflow-x-auto">
        <nav className="flex gap-1 p-2">
          {SETTINGS_NAV.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                    "flex shrink-0 items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-medium transition-colors whitespace-nowrap",
                  isActive
                    ? "bg-primary/8 font-semibold text-primary shadow-sm shadow-primary/5"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
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
        <div className="flex h-14 items-center border-b px-5">
          <h2 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/50">ตั้งค่า</h2>
        </div>
        <ScrollArea className="h-[calc(100%-3.5rem)]">
          <nav className="flex flex-col gap-0.5 p-3">
            {SETTINGS_NAV.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                    isActive
                      ? "bg-primary/8 font-semibold text-primary shadow-sm shadow-primary/5"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-full bg-primary" />
                  )}
                  <item.icon className="h-4.5 w-4.5" />
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
