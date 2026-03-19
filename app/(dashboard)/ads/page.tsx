"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Megaphone,
  TrendingUp,
  ShoppingCart,
  BarChart3,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { SkeletonKpiRow, SkeletonTable } from "@/components/skeleton";
import { KpiCard } from "@/components/kpi-card";
import { PageShell, PageToolbar } from "@/components/page-shell";
import { PageHeader } from "@/components/page-header";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { DataTable, type Column } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import { PLATFORM_BADGE_COLORS, PLATFORM_BADGE_FALLBACK } from "@/lib/constants";

interface AdRow {
  adId: string;
  adName: string | null;
  placement: string | null;
  campaignId: string | null;
  platform: string;
  conversationCount: number;
  orderCount: number;
  revenue: number;
  conversionRate: number;
}

interface PlacementRow {
  placement: string;
  conversationCount: number;
  revenue: number;
}

interface Summary {
  totalConversations: number;
  totalRevenue: number;
  totalOrders: number;
  avgConversionRate: number;
}

interface AdPerformanceData {
  summary: Summary;
  ads: AdRow[];
  placements: PlacementRow[];
  days: number;
}

const DAYS_OPTIONS = [
  { value: "7", label: "7 วัน" },
  { value: "14", label: "14 วัน" },
  { value: "30", label: "30 วัน" },
  { value: "90", label: "90 วัน" },
];

const PLATFORM_OPTIONS = [
  { value: "", label: "ทุก Platform" },
  { value: "facebook", label: "Facebook" },
  { value: "instagram", label: "Instagram" },
];

const PLATFORM_LABELS: Record<string, string> = {
  facebook: "Facebook",
  instagram: "Instagram",
  line: "LINE",
};

export default function AdsPage() {
  const [data, setData] = useState<AdPerformanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState("30");
  const [platformFilter, setPlatformFilter] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ days });
      if (platformFilter) params.set("platform", platformFilter);
      const res = await fetch(`/api/analytics/ad-performance?${params}`);
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  }, [days, platformFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const adColumns: Column<AdRow>[] = [
    {
      key: "ad",
      header: "Ad",
      headerClassName: "text-left",
      render: (ad) => (
        <div>
          <div className="flex items-center gap-2">
            <span className="max-w-[140px] truncate text-xs font-medium">
              {ad.adName ?? ad.adId}
            </span>
            <a
              href={`https://www.facebook.com/adsmanager/manage/ads?act=&selected_ad_ids=${ad.adId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground"
              title="View in Ads Manager"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
          <span className="font-mono text-xs text-muted-foreground">
            {ad.adId.slice(0, 15)}...
          </span>
        </div>
      ),
    },
    {
      key: "platform",
      header: "Platform",
      headerClassName: "text-left",
      render: (ad) => (
        <span
          className={cn(
            "rounded-xl px-2 py-0.5 text-xs font-medium",
            PLATFORM_BADGE_COLORS[ad.platform] ?? PLATFORM_BADGE_FALLBACK
          )}
        >
          {PLATFORM_LABELS[ad.platform] ?? ad.platform}
        </span>
      ),
    },
    {
      key: "placement",
      header: "Placement",
      headerClassName: "text-left",
      className: "text-muted-foreground text-xs",
      render: (ad) => ad.placement ?? "—",
    },
    {
      key: "conversationCount",
      header: "แชท",
      headerClassName: "text-right",
      className: "text-right tabular-nums",
      render: (ad) => ad.conversationCount,
    },
    {
      key: "orderCount",
      header: "ออเดอร์",
      headerClassName: "text-right",
      className: "text-right tabular-nums",
      render: (ad) => ad.orderCount,
    },
    {
      key: "revenue",
      header: "รายได้",
      headerClassName: "text-right",
      className: "text-right tabular-nums font-medium",
      render: (ad) => formatCurrency(ad.revenue),
    },
    {
      key: "conversionRate",
      header: "CR%",
      headerClassName: "text-right",
      className: "text-right",
      render: (ad) => (
        <span
          className={cn(
            "font-medium",
            ad.conversionRate >= 30
              ? "text-success"
              : ad.conversionRate >= 10
                ? "text-warning"
                : "text-destructive"
          )}
        >
          {ad.conversionRate}%
        </span>
      ),
    },
  ];

  return (
    <PageShell>
      <PageHeader title="โฆษณา" subtitle="ติดตามผลโฆษณาจากทุกแพลตฟอร์ม" />
      <PageToolbar>
        <SegmentedControl
          options={PLATFORM_OPTIONS}
          value={platformFilter}
          onChange={setPlatformFilter}
          size="sm"
        />
        <SegmentedControl
          options={DAYS_OPTIONS}
          value={days}
          onChange={setDays}
          size="sm"
        />
        <Button
          variant="outline"
          size="icon"
          onClick={fetchData}
          disabled={loading}
          aria-label="รีเฟรช"
        >
          <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
        </Button>
      </PageToolbar>

      {loading ? (
        <div className="space-y-6">
          <SkeletonKpiRow count={3} />
          <SkeletonTable />
        </div>
      ) : !data || data.ads.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          message={`ยังไม่มีข้อมูลแอดใน ${days} วันที่ผ่านมา`}
          description="เชื่อมต่อ Facebook / Instagram แล้วเริ่มรับแชทจากแอด"
          className="rounded-xl border border-dashed py-20"
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard
              icon={Megaphone}
              label="แชทจากแอด"
              value={data.summary.totalConversations.toLocaleString()}
              sub={`${days} วันล่าสุด`}
            />
            <KpiCard
              icon={TrendingUp}
              label="รายได้จากแอด"
              value={formatCurrency(data.summary.totalRevenue)}
              sub={`${data.summary.totalOrders} ออเดอร์`}
            />
            <KpiCard
              icon={ShoppingCart}
              label="ออเดอร์ทั้งหมด"
              value={data.summary.totalOrders.toLocaleString()}
              sub="จากแชทที่มาจากแอด"
            />
            <KpiCard
              icon={BarChart3}
              label="อัตรา Conversion เฉลี่ย"
              value={`${data.summary.avgConversionRate}%`}
              sub="แชท → ออเดอร์"
            />
          </div>

          <div className="rounded-xl border overflow-hidden shadow-sm">
            <div className="flex items-center justify-between border-b bg-muted/30 px-5 py-4">
              <h2 className="heading-section">Performance ต่อ Ad</h2>
              <span className="text-xs text-muted-foreground">
                {data.ads.length} แอด
              </span>
            </div>
            <DataTable<AdRow>
              columns={adColumns}
              data={data.ads}
              keyField="adId"
              emptyMessage="ไม่มีข้อมูลแอด"
              className="rounded-none border-0 shadow-none"
            />
          </div>

          {data.placements.length > 0 && (
            <div className="rounded-xl border overflow-hidden shadow-sm">
              <div className="border-b bg-muted/30 px-5 py-4">
                <h2 className="heading-section">
                  Performance ต่อ Placement
                </h2>
              </div>
              <div className="divide-y">
                {data.placements.map((p) => {
                  const maxRevenue = Math.max(
                    ...data.placements.map((x) => x.revenue),
                    1
                  );
                  const pct = Math.round((p.revenue / maxRevenue) * 100);
                  return (
                    <div
                      key={p.placement}
                      className="flex items-center gap-4 px-4 py-3"
                    >
                      <span className="w-40 truncate text-sm font-medium">
                        {p.placement}
                      </span>
                      <div className="h-3 flex-1 overflow-hidden rounded-full bg-muted/50">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="w-24 text-right text-sm tabular-nums">
                        {formatCurrency(p.revenue)}
                      </span>
                      <span className="w-16 text-right text-xs text-muted-foreground">
                        {p.conversationCount} แชท
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </PageShell>
  );
}
