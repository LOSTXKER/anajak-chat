"use client";

import { useState, useEffect, useCallback } from "react";
import { RefreshCw, Users, AlertCircle } from "lucide-react";
import { SkeletonCard } from "@/components/skeleton";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface AgentWorkload {
  id: string;
  name: string;
  avatarUrl: string | null;
  roleName: string;
  maxConcurrentChats: number;
  openCount: number;
  pendingCount: number;
  totalActive: number;
  capacityPercent: number;
  avgResponseMs: number | null;
}

function formatResponseTime(ms: number | null): string {
  if (ms === null) return "—";
  const minutes = Math.round(ms / 60000);
  if (minutes < 60) return `${minutes} นาที`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
}

export default function WorkloadPage() {
  const [agents, setAgents] = useState<AgentWorkload[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWorkload = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/workload");
      if (res.ok) setAgents(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWorkload();
  }, [fetchWorkload]);

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="ปริมาณงาน"
        subtitle="ปริมาณงานทีม"
        actions={
          <Button variant="outline" onClick={fetchWorkload} disabled={loading}>
            <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
            รีเฟรช
          </Button>
        }
      />

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : agents.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
          <Users className="h-10 w-10 text-muted-foreground/30" />
          <p className="mt-3 text-sm text-muted-foreground">ไม่พบสมาชิกในทีม</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {agents.map((agent) => {
            const isOverloaded = agent.capacityPercent >= 100;
            const isWarning = agent.capacityPercent >= 80 && !isOverloaded;

            return (
              <div key={agent.id} className="rounded-xl border bg-card p-5 space-y-4">
                {/* Agent header */}
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={agent.avatarUrl ?? undefined} />
                    <AvatarFallback>{agent.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{agent.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{agent.roleName}</p>
                  </div>
                  {isOverloaded && (
                    <Badge variant="destructive" className="text-xs shrink-0">
                      <AlertCircle className="mr-1 h-3 w-3" />
                      เต็ม
                    </Badge>
                  )}
                </div>

                {/* Capacity bar */}
                <div>
                  <div className="mb-1.5 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Capacity</span>
                    <span
                      className={cn(
                        "font-medium",
                        isOverloaded
                          ? "text-red-600 dark:text-red-400"
                          : isWarning
                          ? "text-yellow-600 dark:text-yellow-400"
                          : "text-green-600 dark:text-green-400"
                      )}
                    >
                      {agent.totalActive} / {agent.maxConcurrentChats}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        isOverloaded
                          ? "bg-red-500"
                          : isWarning
                          ? "bg-yellow-500"
                          : "bg-green-500"
                      )}
                      style={{ width: `${Math.min(agent.capacityPercent, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-md bg-muted/50 p-2">
                    <p className="text-lg font-semibold text-green-600 dark:text-green-400">{agent.openCount}</p>
                    <p className="text-[10px] text-muted-foreground">เปิด</p>
                  </div>
                  <div className="rounded-md bg-muted/50 p-2">
                    <p className="text-lg font-semibold text-yellow-600 dark:text-yellow-400">{agent.pendingCount}</p>
                    <p className="text-[10px] text-muted-foreground">รอ</p>
                  </div>
                  <div className="rounded-md bg-muted/50 p-2">
                    <p className="text-lg font-semibold text-muted-foreground">
                      {formatResponseTime(agent.avgResponseMs)}
                    </p>
                    <p className="text-[10px] text-muted-foreground">เวลาตอบ</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Team summary */}
      {agents.length > 0 && (
        <div className="mt-6 rounded-xl border bg-card p-6">
          <h2 className="mb-3 text-lg font-semibold">สรุปทีม</h2>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold">
                {agents.reduce((s, a) => s + a.totalActive, 0)}
              </p>
              <p className="text-xs text-muted-foreground">แชทที่กำลังดูแล</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{agents.length}</p>
              <p className="text-xs text-muted-foreground">สมาชิก</p>
            </div>
            <div>
              <p className="text-2xl font-bold">
                {Math.round(
                  agents.reduce((s, a) => s + a.capacityPercent, 0) / agents.length
                )}
                %
              </p>
              <p className="text-xs text-muted-foreground">Capacity เฉลี่ย</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
