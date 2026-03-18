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
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
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

const DAYS_OPTIONS = [7, 14, 30, 90];
const PLATFORM_LABELS: Record<string, string> = {
  facebook: "Facebook",
  instagram: "Instagram",
  line: "LINE",
};

function formatCurrency(value: number) {
  return `฿${value.toLocaleString("th-TH")}`;
}

export default function AdsPage() {
  const [data, setData] = useState<AdPerformanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);
  const [platformFilter, setPlatformFilter] = useState<string>("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ days: String(days) });
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

  return (
    <div className="overflow-auto h-full">
      <div className="p-6 max-w-7xl space-y-6">
        <PageHeader
          title="วิเคราะห์โฆษณา"
          subtitle="วิเคราะห์ผลโฆษณา"
          actions={
            <div className="flex items-center gap-2">
            {/* Platform filter */}
            <div className="flex rounded-lg border overflow-hidden">
              {["", "facebook", "instagram"].map((p) => (
                <button
                  key={p}
                  onClick={() => setPlatformFilter(p)}
                  className={cn(
                    "px-3 py-1.5 text-xs font-medium transition-colors",
                    platformFilter === p
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  )}
                >
                  {p === "" ? "ทุก Platform" : PLATFORM_LABELS[p]}
                </button>
              ))}
            </div>
            {/* Days filter */}
            <div className="flex rounded-lg border overflow-hidden">
              {DAYS_OPTIONS.map((d) => (
                <button
                  key={d}
                  onClick={() => setDays(d)}
                  className={cn(
                    "px-3 py-1.5 text-xs font-medium transition-colors",
                    days === d
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  )}
                >
                  {d} วัน
                </button>
              ))}
            </div>
            <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            </Button>
            </div>
          }
        />

        {loading ? (
          <div className="space-y-6">
            <SkeletonKpiRow count={3} />
            <SkeletonTable />
          </div>
        ) : !data || data.ads.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-20">
            <Megaphone className="h-12 w-12 text-muted-foreground/30" />
            <p className="mt-4 text-sm text-muted-foreground">ยังไม่มีข้อมูลแอดใน {days} วันที่ผ่านมา</p>
            <p className="mt-1 text-xs text-muted-foreground">
              เชื่อมต่อ Facebook / Instagram แล้วเริ่มรับแชทจากแอด
            </p>
          </div>
        ) : (
          <>
            {/* Summary cards */}
            <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <SummaryCard
                icon={<Megaphone className="h-5 w-5 text-muted-foreground" />}
                label="แชทจากแอด"
                value={data.summary.totalConversations.toLocaleString()}
                sub={`${days} วันล่าสุด`}
              />
              <SummaryCard
                icon={<TrendingUp className="h-5 w-5 text-muted-foreground" />}
                label="รายได้จากแอด"
                value={formatCurrency(data.summary.totalRevenue)}
                sub={`${data.summary.totalOrders} ออเดอร์`}
              />
              <SummaryCard
                icon={<ShoppingCart className="h-5 w-5 text-muted-foreground" />}
                label="ออเดอร์ทั้งหมด"
                value={data.summary.totalOrders.toLocaleString()}
                sub="จากแชทที่มาจากแอด"
              />
              <SummaryCard
                icon={<BarChart3 className="h-5 w-5 text-muted-foreground" />}
                label="อัตรา Conversion เฉลี่ย"
                value={`${data.summary.avgConversionRate}%`}
                sub="แชท → ออเดอร์"
              />
            </div>

            {/* Ads table */}
            <div className="mb-6 rounded-xl border overflow-hidden">
              <div className="px-4 py-3 flex items-center justify-between border-b">
                <h2 className="text-sm font-semibold">Performance ต่อ Ad</h2>
                <span className="text-xs text-muted-foreground">{data.ads.length} แอด</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Ad</th>
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Platform</th>
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Placement</th>
                      <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">แชท</th>
                      <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">ออเดอร์</th>
                      <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">รายได้</th>
                      <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">CR%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.ads.map((ad) => (
                      <tr
                        key={ad.adId}
                        className="border-b last:border-b-0 hover:bg-muted/30 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-xs truncate max-w-[140px]">
                              {ad.adName ?? ad.adId}
                            </span>
                            <a
                              href={`https://www.facebook.com/adsmanager/manage/ads?act=&selected_ad_ids=${ad.adId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-muted-foreground hover:text-foreground"
                              title="View in Ads Manager"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                          <span className="text-xs text-muted-foreground font-mono">
                            {ad.adId.slice(0, 15)}...
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", PLATFORM_BADGE_COLORS[ad.platform] ?? PLATFORM_BADGE_FALLBACK)}>
                            {PLATFORM_LABELS[ad.platform] ?? ad.platform}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          {ad.placement ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">{ad.conversationCount}</td>
                        <td className="px-4 py-3 text-right tabular-nums">{ad.orderCount}</td>
                        <td className="px-4 py-3 text-right tabular-nums font-medium">
                          {formatCurrency(ad.revenue)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className={cn(
                            "font-medium",
                            ad.conversionRate >= 30 ? "text-green-600" :
                            ad.conversionRate >= 10 ? "text-yellow-600" : "text-red-600"
                          )}>
                            {ad.conversionRate}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Placement performance */}
            {data.placements.length > 0 && (
              <div className="rounded-xl border overflow-hidden">
                <div className="px-4 py-3 border-b">
                  <h2 className="text-sm font-semibold">Performance ต่อ Placement</h2>
                </div>
                <div className="divide-y">
                  {data.placements.map((p) => {
                    const maxRevenue = Math.max(...data.placements.map((x) => x.revenue), 1);
                    const pct = Math.round((p.revenue / maxRevenue) * 100);
                    return (
                      <div key={p.placement} className="flex items-center gap-4 px-4 py-3">
                        <span className="w-40 text-sm font-medium truncate">{p.placement}</span>
                        <div className="flex-1 h-2 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-primary transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-sm tabular-nums w-24 text-right">
                          {formatCurrency(p.revenue)}
                        </span>
                        <span className="text-xs text-muted-foreground w-16 text-right">
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
      </div>
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <p className="text-3xl font-light tabular-nums">{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
    </div>
  );
}
