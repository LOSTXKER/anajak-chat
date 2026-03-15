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
  { href: "/settings/general", label: "General", icon: Building2 },
  { href: "/settings/team", label: "Team", icon: Users },
  { href: "/settings/channels", label: "Channels", icon: MessageSquareCode },
  { href: "/settings/ai-bot", label: "AI Bot", icon: Bot },
  { href: "/settings/knowledge-base", label: "Knowledge Base", icon: BookOpen },
  { href: "/settings/templates", label: "Templates", icon: MessageCircle },
  {
    href: "/settings/business-hours",
    label: "Business Hours",
    icon: Clock,
  },
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
    <div className="flex h-full">
      <aside className="hidden w-56 shrink-0 border-r md:block">
        <div className="flex h-14 items-center border-b px-4">
          <h2 className="text-lg font-semibold">Settings</h2>
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
      <div className="flex-1 overflow-y-auto h-full p-6 animate-in fade-in duration-300">{children}</div>
    </div>
  );
}
