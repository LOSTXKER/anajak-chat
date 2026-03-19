"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Users,
  Search,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  ShoppingBag,
  StickyNote,
  RefreshCw,
  ExternalLink,
  X,
  ArrowLeft,
} from "lucide-react";
import { SkeletonConversation } from "@/components/skeleton";
import { EmptyState } from "@/components/empty-state";
import { SplitLayout } from "@/components/page-shell";
import { TabBar } from "@/components/ui/tab-bar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { PLATFORM_BADGE_COLORS } from "@/lib/constants";
import { formatCurrency } from "@/lib/format";
import { format } from "date-fns";
import { th } from "date-fns/locale";

interface Contact {
  id: string;
  displayName: string | null;
  avatarUrl: string | null;
  platform: string;
  phone: string | null;
  email: string | null;
  segment: string | null;
  tags: string[];
  totalOrders: number;
  totalRevenue: number;
  totalConversations: number;
  lastSeenAt: string;
  firstSeenAt: string;
  erpCustomerId: string | null;
}

interface TimelineEvent {
  type: "conversation" | "order" | "note";
  date: string;
  id: string;
  [key: string]: unknown;
}

const PAGE_SIZE = 20;
const CONTACT_TABS = [
  { value: "journey" as const, label: "ประวัติ" },
  { value: "info" as const, label: "ข้อมูล" },
];

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Contact | null>(null);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"info" | "journey">("journey");

  const fetchContacts = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
    if (search) params.set("q", search);
    const res = await fetch(`/api/contacts?${params}`);
    if (res.ok) {
      const data = (await res.json()) as { contacts: Contact[]; total: number };
      setContacts(data.contacts);
      setTotal(data.total);
    }
    setLoading(false);
  }, [page, search]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  async function openContact(c: Contact) {
    setSelected(c);
    setActiveTab("journey");
    setTimelineLoading(true);
    const res = await fetch(`/api/contacts/${c.id}/timeline`);
    if (res.ok) {
      const data = (await res.json()) as { events: TimelineEvent[] };
      setTimeline(data.events);
    }
    setTimelineLoading(false);
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const master = (
    <div className="flex h-full flex-col">
      <div className="space-y-3 border-b p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="heading-page">รายชื่อลูกค้า</h1>
            <p className="text-sm text-muted-foreground mt-1">จัดการข้อมูลลูกค้าและรายชื่อผู้ติดต่อ</p>
            <p className="text-xs text-muted-foreground mt-0.5">{total} รายชื่อ</p>
          </div>
          <Button variant="ghost" size="icon-sm" onClick={fetchContacts}>
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </Button>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setSearch(searchInput);
            setPage(1);
          }}
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="ค้นหาชื่อ, เบอร์, อีเมล..."
              className="pl-9 text-sm"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
        </form>
      </div>

      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="space-y-2 p-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <SkeletonConversation key={i} />
            ))}
          </div>
        ) : contacts.length === 0 ? (
          <EmptyState icon={Users} message="ยังไม่มีข้อมูลลูกค้า" className="border-0" />
        ) : (
          <div className="space-y-1 p-2">
            {contacts.map((c) => (
              <button
                key={c.id}
                className={cn(
                  "flex w-full cursor-pointer items-center gap-3 rounded-xl px-4 py-3 text-left transition-colors hover:bg-muted/50",
                  selected?.id === c.id && "bg-primary/8 ring-1 ring-primary/20"
                )}
                onClick={() => openContact(c)}
              >
                <div
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl text-sm font-semibold",
                    c.avatarUrl ? "bg-muted" : "bg-primary/10 text-primary"
                  )}
                >
                  {c.avatarUrl ? (
                    <img src={c.avatarUrl} alt="" className="h-full w-full rounded-xl object-cover" />
                  ) : (
                    (c.displayName?.[0] ?? "?").toUpperCase()
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium">{c.displayName ?? "ไม่ระบุชื่อ"}</p>
                    <span
                      className={cn(
                        "shrink-0 rounded-md px-1.5 py-0.5 text-xs font-medium",
                        PLATFORM_BADGE_COLORS[c.platform] ?? "bg-muted text-muted-foreground"
                      )}
                    >
                      {c.platform}
                    </span>
                  </div>
                  <p className="truncate text-xs text-muted-foreground">
                    {c.phone ?? c.email ?? c.id.slice(0, 8)}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-xs font-medium">{formatCurrency(Number(c.totalRevenue))}</p>
                  <p className="text-xs text-muted-foreground">{c.totalOrders} ออเดอร์</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t p-3 text-xs text-muted-foreground">
          <span>
            {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} จาก {total}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <span className="px-2 font-medium">
              {page}/{totalPages}
            </span>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              disabled={page === totalPages}
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );

  const detail = selected ? (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex items-center gap-3 border-b px-6 py-4">
        <Button
          variant="ghost"
          size="icon-sm"
          className="md:hidden"
          onClick={() => setSelected(null)}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl text-sm font-semibold",
            selected.avatarUrl ? "bg-muted" : "bg-primary/10 text-primary"
          )}
        >
          {selected.avatarUrl ? (
            <img src={selected.avatarUrl} alt="" className="h-full w-full rounded-xl object-cover" />
          ) : (
            (selected.displayName?.[0] ?? "?").toUpperCase()
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold">{selected.displayName ?? "ไม่ระบุชื่อ"}</p>
          <p className="text-xs text-muted-foreground">
            {selected.phone ?? selected.email ?? selected.platform}
          </p>
        </div>
        <Button variant="ghost" size="icon-sm" onClick={() => setSelected(null)}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-3 border-b px-6 py-4">
        <div className="rounded-lg bg-muted/50 p-3 text-center">
          <p className="text-3xl font-bold">{selected.totalConversations}</p>
          <p className="text-xs font-semibold text-muted-foreground">สนทนา</p>
        </div>
        <div className="rounded-lg bg-muted/50 p-3 text-center">
          <p className="text-3xl font-bold">{selected.totalOrders}</p>
          <p className="text-xs font-semibold text-muted-foreground">ออเดอร์</p>
        </div>
        <div className="rounded-lg bg-muted/50 p-3 text-center">
          <p className="text-3xl font-bold">{formatCurrency(Number(selected.totalRevenue))}</p>
          <p className="text-xs font-semibold text-muted-foreground">รายได้รวม</p>
        </div>
      </div>

      <div className="border-b px-6">
        <TabBar tabs={CONTACT_TABS} value={activeTab} onChange={(v) => setActiveTab(v)} />
      </div>

      <div className="flex-1 overflow-auto p-6">
        {activeTab === "info" ? (
          <div className="space-y-3 text-sm">
            {[
              { label: "แพลตฟอร์ม", value: selected.platform },
              { label: "กลุ่ม", value: selected.segment ?? "—" },
              { label: "แท็ก", value: selected.tags.join(", ") || "—" },
              { label: "ERP ID", value: selected.erpCustomerId ?? "ไม่ได้ link" },
              {
                label: "เห็นครั้งแรก",
                value: format(new Date(selected.firstSeenAt), "d MMM yyyy", { locale: th }),
              },
              {
                label: "เห็นล่าสุด",
                value: format(new Date(selected.lastSeenAt), "d MMM yyyy HH:mm", { locale: th }),
              },
            ].map(({ label, value }) => (
              <div key={label} className="flex gap-3">
                <span className="w-28 shrink-0 text-muted-foreground">{label}</span>
                <span className="font-medium">{value}</span>
              </div>
            ))}
          </div>
        ) : timelineLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <SkeletonConversation key={i} />
            ))}
          </div>
        ) : timeline.length === 0 ? (
          <EmptyState icon={MessageSquare} message="ไม่มีประวัติ" className="border-0 py-8" />
        ) : (
          <div className="relative">
            <div className="absolute left-3.5 top-0 bottom-0 w-px bg-border" />
            <div className="space-y-4">
              {timeline.map((event) => (
                <div key={event.id + event.type} className="relative flex gap-4">
                  <div className="z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-background bg-muted">
                    {event.type === "conversation" ? (
                      <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
                    ) : event.type === "order" ? (
                      <ShoppingBag className="h-3.5 w-3.5 text-muted-foreground" />
                    ) : (
                      <StickyNote className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1 pb-1">
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(event.date), "d MMM yyyy HH:mm", { locale: th })}
                    </p>
                    {event.type === "conversation" && (
                      <div>
                        <p className="text-sm font-medium">
                          สนทนา ({event.platform as string})
                          <span
                            className={cn(
                              "ml-2 rounded-md px-1.5 py-0.5 text-xs",
                              event.status === "resolved"
                                ? "bg-primary/10 text-primary"
                                : "bg-muted text-foreground"
                            )}
                          >
                            {event.status as string}
                          </span>
                        </p>
                        {typeof event.firstMessage === "string" && (
                          <p className="truncate text-xs text-muted-foreground">{event.firstMessage}</p>
                        )}
                        {typeof event.aiSummary === "string" && (
                          <p className="mt-0.5 line-clamp-2 text-xs italic text-muted-foreground">
                            {event.aiSummary}
                          </p>
                        )}
                        <a
                          href={`/inbox?conversationId=${event.id}`}
                          className="mt-0.5 flex items-center gap-0.5 text-xs text-accent-foreground hover:underline"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          ดูแชท
                        </a>
                      </div>
                    )}
                    {event.type === "order" && (
                      <div>
                        <p className="text-sm font-medium">
                          Order #{event.orderNumber as string}
                          <span className="ml-2 text-xs text-muted-foreground">
                            {formatCurrency(event.amount as number)}
                          </span>
                          <span
                            className={cn(
                              "ml-2 rounded-md px-1.5 py-0.5 text-xs",
                              event.status === "delivered"
                                ? "bg-primary/10 text-primary"
                                : event.status === "cancelled"
                                  ? "bg-destructive/10 text-destructive"
                                  : "bg-muted text-foreground"
                            )}
                          >
                            {event.status as string}
                          </span>
                        </p>
                      </div>
                    )}
                    {event.type === "note" && <p className="text-sm">{event.content as string}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  ) : (
    <div className="flex flex-1 items-center justify-center">
      <EmptyState
        icon={Users}
        message="เลือกลูกค้าเพื่อดูรายละเอียด"
        description="เลือกจากรายการทางซ้าย"
      />
    </div>
  );

  return (
    <SplitLayout
      master={master}
      detail={detail}
      masterWidth={360}
      hideMasterOnMobile={!!selected}
      masterClassName="bg-background"
    />
  );
}
