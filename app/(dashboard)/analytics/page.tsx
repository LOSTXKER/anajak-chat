"use client";

import { useState, useCallback, useEffect } from "react";
import {
  MessageSquare,
  Users,
  TrendingUp,
  Clock,
  RefreshCw,
  Download,
} from "lucide-react";
import { SkeletonKpiRow, SkeletonTable } from "@/components/skeleton";
import { KpiCard } from "@/components/kpi-card";
import { EmptyState } from "@/components/empty-state";
import { PageShell, PageToolbar } from "@/components/page-shell";
import { PageHeader } from "@/components/page-header";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { DataTable, type Column } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatMinutes } from "@/lib/format";
import { cn } from "@/lib/utils";

interface Overview {
  totalConversations: number;
  openConversations: number;
  resolvedConversations: number;
  resolveRate: number;
  totalContacts: number;
  totalOrders: number;
  totalRevenue: number;
  avgFirstResponseMinutes: number | null;
  slaBreaches: number;
}

interface AgentStat {
  id: string;
  name: string;
  email: string;
  totalConversations: number;
  openConversations: number;
  resolvedConversations: number;
  avgFirstResponseMinutes: number | null;
  slaBreached: number;
  slaCompliance: number;
}

interface FunnelStage {
  stage: string;
  count: number;
}

interface Segment {
  name: string;
  count: number;
  pct: number;
}

const DAYS_OPTIONS = [
  { value: "7" as const, label: "7 วัน" },
  { value: "14" as const, label: "14 วัน" },
  { value: "30" as const, label: "30 วัน" },
  { value: "90" as const, label: "90 วัน" },
];

const SEGMENT_COLORS: Record<string, string> = {
  VIP: "bg-foreground",
  Regular: "bg-muted-foreground/40",
  "Window Shopper": "bg-muted-foreground/60",
  "One-timer": "bg-muted-foreground/40",
  "At-risk": "bg-foreground/80",
};

const EXPORT_LABELS: Record<string, string> = {
  conversations: "สนทนา",
  orders: "ออเดอร์",
  contacts: "ลูกค้า",
};

export default function AnalyticsPage() {
  const [days, setDays] = useState<"7" | "14" | "30" | "90">("30");
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [agents, setAgents] = useState<AgentStat[]>([]);
  const [funnel, setFunnel] = useState<FunnelStage[]>([]);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null);
  const [exportOpen, setExportOpen] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [ovRes, agRes, fnRes, sgRes] = await Promise.all([
      fetch(`/api/analytics/overview?days=${days}`),
      fetch(`/api/analytics/agents?days=${days}`),
      fetch(`/api/analytics/funnel?days=${days}`),
      fetch(`/api/analytics/segments?days=${days}`),
    ]);
    if (ovRes.ok) setOverview((await ovRes.json()) as Overview);
    if (agRes.ok) {
      const d = (await agRes.json()) as { agents: AgentStat[] };
      setAgents(d.agents);
    }
    if (fnRes.ok) {
      const d = (await fnRes.json()) as { funnel: FunnelStage[] };
      setFunnel(d.funnel);
    }
    if (sgRes.ok) {
      const d = (await sgRes.json()) as { segments: Segment[] };
      setSegments(d.segments);
    }
    setLoading(false);
  }, [days]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const agentColumns: Column<AgentStat>[] = [
    {
      key: "name",
      header: "ชื่อ",
      headerClassName: "text-left",
      render: (a) => (
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-primary/10 text-xs font-semibold text-primary">
            {a.name[0]?.toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-medium">{a.name}</p>
            <p className="text-xs text-muted-foreground">{a.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: "totalConversations",
      header: "สนทนา",
      headerClassName: "text-right",
      className: "text-right",
      render: (a) => a.totalConversations,
    },
    {
      key: "openConversations",
      header: "เปิด",
      headerClassName: "text-right",
      className: "text-right text-warning",
      render: (a) => a.openConversations,
    },
    {
      key: "resolvedConversations",
      header: "แก้ไขแล้ว",
      headerClassName: "text-right",
      className: "text-right text-success",
      render: (a) => a.resolvedConversations,
    },
    {
      key: "avgFirstResponseMinutes",
      header: "เวลาตอบเฉลี่ย",
      headerClassName: "text-right",
      className: "text-right",
      render: (a) => formatMinutes(a.avgFirstResponseMinutes),
    },
    {
      key: "slaCompliance",
      header: "SLA",
      headerClassName: "text-right",
      className: "text-right",
      render: (a) => (
        <span
          className={cn(
            "text-xs font-medium",
            a.slaCompliance >= 90
              ? "text-success"
              : a.slaCompliance >= 70
                ? "text-warning"
                : "text-destructive"
          )}
        >
          {a.slaCompliance}%
        </span>
      ),
    },
  ];

  return (
    <PageShell>
      <PageHeader title="วิเคราะห์" subtitle="ภาพรวมผลการดำเนินงานและข้อมูลเชิงลึก" />
      <PageToolbar>
        <SegmentedControl
          options={DAYS_OPTIONS}
          value={days}
          onChange={(v) => setDays(v)}
          size="sm"
        />
        <div className="relative">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setExportOpen(!exportOpen)}
            aria-haspopup="menu"
            aria-expanded={exportOpen}
            className="gap-1.5"
          >
            <Download className="h-3.5 w-3.5" />
            ส่งออก
          </Button>
          {exportOpen && (
            <div className="absolute right-0 top-full z-20 mt-1 w-40 rounded-lg border bg-background py-1 shadow-lg">
              {(["conversations", "orders", "contacts"] as const).map((t) => (
                <a
                  key={t}
                  href={`/api/analytics/export?type=${t}&days=${days}`}
                  download
                  className="block px-3 py-1.5 text-xs capitalize hover:bg-muted"
                  onClick={() => setExportOpen(false)}
                >
                  {EXPORT_LABELS[t]}
                </a>
              ))}
            </div>
          )}
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={fetchAll}
          aria-label="รีเฟรช"
          disabled={loading}
        >
          <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
        </Button>
      </PageToolbar>

      {loading && !overview ? (
        <div className="space-y-6">
          <SkeletonKpiRow />
          <SkeletonTable />
        </div>
      ) : (
        <>
          {overview && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <KpiCard
                icon={MessageSquare}
                label="สนทนาทั้งหมด"
                value={overview.totalConversations.toLocaleString()}
                sub={`เปิดอยู่ ${overview.openConversations}`}
              />
              <KpiCard
                icon={Users}
                label="ลูกค้า"
                value={overview.totalContacts.toLocaleString()}
                sub={`resolve rate ${overview.resolveRate}%`}
              />
              <KpiCard
                icon={Clock}
                label="เวลาตอบเฉลี่ย"
                value={formatMinutes(overview.avgFirstResponseMinutes)}
                sub={`SLA breach ${overview.slaBreaches}`}
              />
              <KpiCard
                icon={TrendingUp}
                label="รายได้"
                value={formatCurrency(overview.totalRevenue)}
                sub={`${overview.totalOrders} ออเดอร์`}
              />
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-xl border bg-card p-6">
              <h2 className="heading-section">Funnel การขาย</h2>
              {funnel.length === 0 ? (
                <EmptyState
                  icon={TrendingUp}
                  message="ไม่มีข้อมูล Funnel"
                  className="border-0 py-8"
                />
              ) : (
                <div className="space-y-4">
                  {funnel.map((stage, i) => {
                    const maxCount = funnel[0]?.count ?? 1;
                    const pct = maxCount > 0 ? (stage.count / maxCount) * 100 : 0;
                    const convRate =
                      i > 0 && funnel[i - 1].count > 0
                        ? Math.round((stage.count / funnel[i - 1].count) * 100)
                        : null;
                    return (
                      <div key={stage.stage}>
                        <div className="mb-1 flex justify-between text-xs">
                          <span>{stage.stage}</span>
                          <span className="font-medium">
                            {stage.count.toLocaleString()}
                            {convRate !== null && (
                              <span className="ml-2 text-muted-foreground">
                                ({convRate}%)
                              </span>
                            )}
                          </span>
                        </div>
                        <div className="h-6 overflow-hidden rounded-full bg-muted/50">
                          <div
                            className="h-full rounded-full bg-primary transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="rounded-xl border bg-card p-6">
              <h2 className="heading-section">กลุ่มลูกค้า</h2>
              {segments.length === 0 ? (
                <EmptyState
                  icon={Users}
                  message="ไม่มีข้อมูลกลุ่มลูกค้า"
                  className="border-0 py-8"
                />
              ) : (
                <div className="space-y-4">
                  {segments.map((s) => (
                    <div key={s.name}>
                      <div className="mb-1 flex justify-between text-xs">
                        <span className="flex items-center gap-2">
                          <span
                            className={cn(
                              "h-2.5 w-2.5 rounded-full",
                              SEGMENT_COLORS[s.name] ?? "bg-muted-foreground/40"
                            )}
                          />
                          {s.name}
                        </span>
                        <span className="font-medium">
                          {s.count.toLocaleString()} ({s.pct}%)
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-muted">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all",
                            SEGMENT_COLORS[s.name] ?? "bg-muted-foreground/40"
                          )}
                          style={{ width: `${s.pct}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="rounded-xl border bg-card overflow-hidden">
            <div className="flex items-center justify-between border-b bg-muted/30 px-6 py-4">
              <h2 className="heading-section">ประสิทธิภาพทีม</h2>
              <span className="text-xs text-muted-foreground">
                {agents.length} คน
              </span>
            </div>
            <DataTable<AgentStat>
              columns={agentColumns}
              data={agents}
              keyField="id"
              emptyMessage="ไม่มีข้อมูล agent"
              expandableContent={(a) => (
                <div className="flex gap-6 text-xs text-muted-foreground">
                  <span>
                    SLA เกิน:{" "}
                    <strong className="text-foreground">{a.slaBreached}</strong>
                  </span>
                  <span>
                    อัตราแก้ไข:{" "}
                    <strong className="text-foreground">
                      {a.totalConversations > 0
                        ? Math.round(
                            (a.resolvedConversations / a.totalConversations) * 100
                          )
                        : 0}
                      %
                    </strong>
                  </span>
                </div>
              )}
              expandedRowKey={expandedAgent}
              onExpandedRowKeyChange={setExpandedAgent}
            />
          </div>
        </>
      )}
    </PageShell>
  );
}
