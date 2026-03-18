"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Users, Search, ChevronLeft, ChevronRight,
  MessageSquare, ShoppingBag, StickyNote, RefreshCw,
  ExternalLink, X, ArrowLeft,
} from "lucide-react";
import { SkeletonConversation } from "@/components/skeleton";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { PLATFORM_BADGE_COLORS } from "@/lib/constants";
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
      const data = await res.json() as { contacts: Contact[]; total: number };
      setContacts(data.contacts);
      setTotal(data.total);
    }
    setLoading(false);
  }, [page, search]);

  useEffect(() => { fetchContacts(); }, [fetchContacts]);

  async function openContact(c: Contact) {
    setSelected(c);
    setActiveTab("journey");
    setTimelineLoading(true);
    const res = await fetch(`/api/contacts/${c.id}/timeline`);
    if (res.ok) {
      const data = await res.json() as { events: TimelineEvent[] };
      setTimeline(data.events);
    }
    setTimelineLoading(false);
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const fmtBaht = (n: number) =>
    new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB", maximumFractionDigits: 0 }).format(n);


  return (
    <div className="p-6 overflow-y-auto h-full flex flex-col gap-4">
      <PageHeader
        title="รายชื่อลูกค้า"
        subtitle="ข้อมูลลูกค้าทั้งหมด"
      />
      <div className="flex flex-1 min-h-0 overflow-hidden rounded-xl border bg-card">
        {/* Contact List */}
        <div className={cn("flex flex-col overflow-hidden transition-all", selected ? "hidden md:flex md:w-1/2 border-r" : "w-full")}>
          <div className="p-4 border-b">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Users className="h-5 w-5" />
                รายชื่อ
                <span className="text-sm font-normal text-muted-foreground">({total})</span>
              </h2>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={fetchContacts}>
                <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
              </Button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); setSearch(searchInput); setPage(1); }}>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="ค้นหาชื่อ, เบอร์, อีเมล..."
                  className="pl-9 rounded-xl h-10"
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
              <EmptyState
                icon={Users}
                message="ยังไม่มีข้อมูลลูกค้า"
                className="border-0"
              />
            ) : (
              <div className="space-y-2 p-3">
                {contacts.map((c) => (
                  <div
                    key={c.id}
                    className={cn(
                      "flex items-center gap-3 rounded-lg border bg-card p-3 transition-colors cursor-pointer hover:bg-muted/30",
                      selected?.id === c.id && "bg-muted/50"
                    )}
                    onClick={() => openContact(c)}
                  >
                    <div className={cn(
                      "h-9 w-9 shrink-0 rounded-full flex items-center justify-center text-sm font-medium overflow-hidden",
                      c.avatarUrl ? "bg-muted" : "bg-zinc-200 text-zinc-700 dark:bg-muted dark:text-foreground/80"
                    )}>
                      {c.avatarUrl ? (
                        <img src={c.avatarUrl} alt="" className="h-full w-full object-cover" />
                      ) : (
                        (c.displayName?.[0] ?? "?").toUpperCase()
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm truncate">{c.displayName ?? "ไม่ระบุชื่อ"}</p>
                        <span className={cn("rounded-full px-1.5 py-0.5 text-[10px] font-medium shrink-0", PLATFORM_BADGE_COLORS[c.platform] ?? "bg-gray-100 dark:bg-card")}>
                          {c.platform}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{c.phone ?? c.email ?? c.id.slice(0, 8)}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-medium">{fmtBaht(Number(c.totalRevenue))}</p>
                      <p className="text-xs text-muted-foreground">{c.totalOrders} ออเดอร์</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {totalPages > 1 && (
            <div className="p-3 border-t flex items-center justify-between text-xs text-muted-foreground">
              <span>{(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} จาก {total}</span>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="icon" className="h-7 w-7 rounded-lg" onClick={() => setPage((p) => Math.max(p - 1, 1))} disabled={page === 1}>
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
                <span className="px-2 font-medium">{page}/{totalPages}</span>
                <Button variant="outline" size="icon" className="h-7 w-7 rounded-lg" onClick={() => setPage((p) => Math.min(p + 1, totalPages))} disabled={page === totalPages}>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Contact Detail + Journey */}
        {selected && (
          <div className="w-full md:w-1/2 flex flex-col overflow-hidden">
            <div className="p-4 border-b flex items-center gap-3">
              <Button variant="ghost" size="icon" className="h-8 w-8 md:hidden" onClick={() => setSelected(null)}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className={cn(
                "h-10 w-10 rounded-full flex items-center justify-center text-sm font-medium overflow-hidden",
                selected.avatarUrl ? "bg-muted" : "bg-zinc-200 text-zinc-700 dark:bg-muted dark:text-foreground/80"
              )}>
                {selected.avatarUrl ? (
                  <img src={selected.avatarUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  (selected.displayName?.[0] ?? "?").toUpperCase()
                )}
              </div>
              <div className="flex-1">
                <p className="font-semibold">{selected.displayName ?? "ไม่ระบุชื่อ"}</p>
                <p className="text-xs text-muted-foreground">{selected.phone ?? selected.email ?? selected.platform}</p>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelected(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Stats */}
            <div className="px-4 py-3 grid grid-cols-3 gap-3 border-b">
              <div className="rounded-lg bg-muted/50 p-3 text-center">
                <p className="text-lg font-bold">{selected.totalConversations}</p>
                <p className="text-xs text-muted-foreground">สนทนา</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-3 text-center">
                <p className="text-lg font-bold">{selected.totalOrders}</p>
                <p className="text-xs text-muted-foreground">ออเดอร์</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-3 text-center">
                <p className="text-lg font-bold">{fmtBaht(Number(selected.totalRevenue))}</p>
                <p className="text-xs text-muted-foreground">รายได้รวม</p>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b px-4 text-sm" role="tablist">
              {(["journey", "info"] as const).map((tab) => (
                <button
                  key={tab}
                  role="tab"
                  aria-selected={activeTab === tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "py-2.5 px-3 border-b-2 -mb-px font-medium transition-colors",
                    activeTab === tab ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
                >
                  {tab === "journey" ? "ประวัติ" : "ข้อมูล"}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-auto p-4">
              {activeTab === "info" ? (
                <div className="space-y-3 text-sm">
                  {[
                    { label: "แพลตฟอร์ม", value: selected.platform },
                    { label: "กลุ่ม", value: selected.segment ?? "—" },
                    { label: "แท็ก", value: selected.tags.join(", ") || "—" },
                    { label: "ERP ID", value: selected.erpCustomerId ?? "ไม่ได้ link" },
                    { label: "เห็นครั้งแรก", value: format(new Date(selected.firstSeenAt), "d MMM yyyy", { locale: th }) },
                    { label: "เห็นล่าสุด", value: format(new Date(selected.lastSeenAt), "d MMM yyyy HH:mm", { locale: th }) },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex gap-3">
                      <span className="w-28 text-muted-foreground shrink-0">{label}</span>
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
                <EmptyState
                  icon={MessageSquare}
                  message="ไม่มีประวัติ"
                  className="border-0 py-8"
                />
              ) : (
                <div className="relative">
                  <div className="absolute left-3.5 top-0 bottom-0 w-px bg-border" />
                  <div className="space-y-4">
                    {timeline.map((event) => (
                      <div key={event.id + event.type} className="flex gap-4 relative">
                        <div className={cn(
                          "h-7 w-7 rounded-full border-2 border-background flex items-center justify-center shrink-0 z-10",
                          event.type === "conversation" ? "bg-blue-100 dark:bg-blue-950/40" : event.type === "order" ? "bg-green-100 dark:bg-green-950/40" : "bg-yellow-100 dark:bg-yellow-950/40"
                        )}>
                          {event.type === "conversation" ? (
                            <MessageSquare className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                          ) : event.type === "order" ? (
                            <ShoppingBag className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                          ) : (
                            <StickyNote className="h-3.5 w-3.5 text-yellow-600 dark:text-yellow-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0 pb-1">
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(event.date), "d MMM yyyy HH:mm", { locale: th })}
                          </p>
                          {event.type === "conversation" && (
                            <div>
                              <p className="text-sm font-medium">
                                สนทนา ({event.platform as string})
                                <span className={cn(
                                  "ml-2 rounded-full px-1.5 py-0.5 text-[10px]",
                                  event.status === "resolved" ? "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400" : "bg-yellow-100 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-400"
                                )}>{event.status as string}</span>
                              </p>
                              {typeof event.firstMessage === "string" && (
                                <p className="text-xs text-muted-foreground truncate">{event.firstMessage}</p>
                              )}
                              {typeof event.aiSummary === "string" && (
                                <p className="text-xs italic text-muted-foreground mt-0.5 line-clamp-2">{event.aiSummary}</p>
                              )}
                              <a href={`/inbox?conversationId=${event.id}`} className="text-xs text-accent-foreground flex items-center gap-0.5 mt-0.5 hover:underline">
                                <ExternalLink className="h-3 w-3" />ดูแชท
                              </a>
                            </div>
                          )}
                          {event.type === "order" && (
                            <div>
                              <p className="text-sm font-medium">
                                Order #{event.orderNumber as string}
                                <span className="ml-2 text-xs text-muted-foreground">{fmtBaht(event.amount as number)}</span>
                                <span className={cn(
                                  "ml-2 rounded-full px-1.5 py-0.5 text-[10px]",
                                  event.status === "delivered" ? "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400" :
                                  event.status === "cancelled" ? "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400" : "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400"
                                )}>{event.status as string}</span>
                              </p>
                            </div>
                          )}
                          {event.type === "note" && (
                            <p className="text-sm">{event.content as string}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
