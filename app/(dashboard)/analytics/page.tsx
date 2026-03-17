"use client";

import { useState, useEffect, useCallback, Fragment } from "react";
import {
  BarChart3, MessageSquare, Users, TrendingUp, Clock,
  RefreshCw, Download,
} from "lucide-react";
import { SkeletonKpiRow, SkeletonTable } from "@/components/skeleton";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
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

const DAYS_OPTIONS = [7, 14, 30, 90];

function KpiCard({ icon: Icon, label, value, sub }: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-muted-foreground font-medium">{label}</span>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <p className="text-3xl font-light">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </div>
  );
}

const SEGMENT_COLORS: Record<string, string> = {
  "VIP": "bg-amber-500",
  "Regular": "bg-blue-500",
  "Window Shopper": "bg-violet-400",
  "One-timer": "bg-zinc-400",
  "At-risk": "bg-red-400",
};

export default function AnalyticsPage() {
  const [days, setDays] = useState(30);
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
    if (ovRes.ok) setOverview(await ovRes.json() as Overview);
    if (agRes.ok) {
      const d = await agRes.json() as { agents: AgentStat[] };
      setAgents(d.agents);
    }
    if (fnRes.ok) {
      const d = await fnRes.json() as { funnel: FunnelStage[] };
      setFunnel(d.funnel);
    }
    if (sgRes.ok) {
      const d = await sgRes.json() as { segments: Segment[] };
      setSegments(d.segments);
    }
    setLoading(false);
  }, [days]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const fmtMin = (m: number | null) =>
    m == null ? "—" : m < 60 ? `${m} นาที` : `${Math.round(m / 60)} ชม.`;

  const fmtBaht = (n: number) =>
    new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB", maximumFractionDigits: 0 }).format(n);

  return (
    <div className="p-6 overflow-y-auto h-full space-y-6">
      <PageHeader
        title="วิเคราะห์"
        subtitle="ภาพรวมประสิทธิภาพทีม"
        actions={
          <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            {DAYS_OPTIONS.map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={cn(
                  "rounded-full px-4 py-1.5 text-xs font-medium transition-colors",
                  days === d ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"
                )}
              >
                {d} วัน
              </button>
            ))}
          </div>
          <div className="relative">
            <button
              onClick={() => setExportOpen(!exportOpen)}
              aria-haspopup="menu"
              aria-expanded={exportOpen}
              className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors"
            >
              <Download className="h-3.5 w-3.5" />ส่งออก
            </button>
            {exportOpen && (
              <div className="absolute right-0 top-8 z-20 w-40 rounded-lg border bg-background shadow-lg py-1">
                {["conversations", "orders", "contacts"].map((t) => (
                  <a
                    key={t}
                    href={`/api/analytics/export?type=${t}&days=${days}`}
                    download
                    className="block px-3 py-1.5 text-xs hover:bg-muted capitalize"
                    onClick={() => setExportOpen(false)}
                  >
                    {t === "conversations" ? "สนทนา" : t === "orders" ? "ออเดอร์" : "ลูกค้า"}
                  </a>
                ))}
              </div>
            )}
          </div>
          <button onClick={fetchAll} aria-label="รีเฟรช" className="rounded-lg border p-1.5 hover:bg-muted transition-colors">
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </button>
          </div>
        }
      />

      {loading && !overview ? (
        <div className="space-y-6">
          <SkeletonKpiRow />
          <SkeletonTable />
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          {overview && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <KpiCard icon={MessageSquare} label="สนทนาทั้งหมด" value={overview.totalConversations.toLocaleString()} sub={`เปิดอยู่ ${overview.openConversations}`} />
              <KpiCard icon={Users} label="ลูกค้า" value={overview.totalContacts.toLocaleString()} sub={`resolve rate ${overview.resolveRate}%`} />
              <KpiCard icon={Clock} label="เวลาตอบเฉลี่ย" value={fmtMin(overview.avgFirstResponseMinutes)} sub={`SLA breach ${overview.slaBreaches}`} />
              <KpiCard icon={TrendingUp} label="รายได้" value={fmtBaht(overview.totalRevenue)} sub={`${overview.totalOrders} ออเดอร์`} />
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Conversion Funnel */}
            <div className="rounded-xl border p-4">
              <h2 className="mb-4 text-sm font-semibold">Funnel การขาย</h2>
              {funnel.length === 0 ? (
                <EmptyState icon={TrendingUp} message="ไม่มีข้อมูล Funnel" className="border-0 py-8" />
              ) : (
                <div className="space-y-3">
                  {funnel.map((stage, i) => {
                    const maxCount = funnel[0]?.count ?? 1;
                    const pct = maxCount > 0 ? (stage.count / maxCount) * 100 : 0;
                    const convRate = i > 0 && funnel[i - 1].count > 0
                      ? Math.round((stage.count / funnel[i - 1].count) * 100)
                      : null;
                    return (
                      <div key={stage.stage}>
                        <div className="mb-1 flex justify-between text-xs">
                          <span>{stage.stage}</span>
                          <span className="font-medium">{stage.count.toLocaleString()}
                            {convRate !== null && <span className="ml-2 text-muted-foreground">({convRate}%)</span>}
                          </span>
                        </div>
                        <div className="h-5 rounded-full bg-muted overflow-hidden">
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

            {/* Customer Segments */}
            <div className="rounded-xl border p-4">
              <h2 className="mb-4 text-sm font-semibold">กลุ่มลูกค้า</h2>
              {segments.length === 0 ? (
                <EmptyState icon={Users} message="ไม่มีข้อมูลกลุ่มลูกค้า" className="border-0 py-8" />
              ) : (
                <div className="space-y-2">
                  {segments.map((s) => (
                    <div key={s.name}>
                      <div className="mb-1 flex justify-between text-xs">
                        <span className="flex items-center gap-2">
                          <span className={cn("h-2.5 w-2.5 rounded-full", SEGMENT_COLORS[s.name] ?? "bg-gray-400")} />
                          {s.name}
                        </span>
                        <span className="font-medium">{s.count.toLocaleString()} ({s.pct}%)</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className={cn("h-full rounded-full transition-all", SEGMENT_COLORS[s.name] ?? "bg-gray-400")}
                          style={{ width: `${s.pct}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Agent Performance */}
          <div className="rounded-xl border overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <h2 className="text-sm font-semibold">ประสิทธิภาพทีม</h2>
              <span className="text-xs text-muted-foreground">{agents.length} คน</span>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">ชื่อ</th>
                  <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">สนทนา</th>
                  <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">เปิด</th>
                  <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">แก้ไขแล้ว</th>
                  <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">เวลาตอบเฉลี่ย</th>
                  <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">SLA</th>
                </tr>
              </thead>
              <tbody>
                {agents.map((a) => (
                  <Fragment key={a.id}>
                    <tr
                      className="border-b last:border-b-0 hover:bg-muted/30 transition-colors cursor-pointer"
                      onClick={() => setExpandedAgent(expandedAgent === a.id ? null : a.id)}
                    >
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                            {a.name[0]?.toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{a.name}</p>
                            <p className="text-xs text-muted-foreground">{a.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-right">{a.totalConversations}</td>
                      <td className="px-4 py-2.5 text-right text-yellow-600 dark:text-yellow-400">{a.openConversations}</td>
                      <td className="px-4 py-2.5 text-right text-green-600 dark:text-green-400">{a.resolvedConversations}</td>
                      <td className="px-4 py-2.5 text-right">{fmtMin(a.avgFirstResponseMinutes)}</td>
                      <td className="px-4 py-2.5 text-right">
                        <span className={cn(
                          "text-xs font-medium",
                          a.slaCompliance >= 90 ? "text-green-600 dark:text-green-400" : a.slaCompliance >= 70 ? "text-yellow-600 dark:text-yellow-400" : "text-red-600 dark:text-red-400"
                        )}>
                          {a.slaCompliance}%
                        </span>
                      </td>
                    </tr>
                    {expandedAgent === a.id && (
                      <tr className="bg-muted/30 border-b">
                        <td colSpan={6} className="px-8 py-3">
                          <div className="flex gap-6 text-xs text-muted-foreground">
                            <span>SLA เกิน: <strong className="text-foreground">{a.slaBreached}</strong></span>
                            <span>อัตราแก้ไข: <strong className="text-foreground">{a.totalConversations > 0 ? Math.round((a.resolvedConversations / a.totalConversations) * 100) : 0}%</strong></span>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
                {agents.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-sm text-muted-foreground">
                      ไม่มีข้อมูล agent
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
