"use client";

import { Plus, Trash2, Loader2, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { th } from "date-fns/locale";

export interface Channel {
  id: string;
  platform: string;
  name: string;
}

export interface CapiDataset {
  id: string;
  channelId: string;
  datasetId: string;
  platform: string;
  isActive: boolean;
  createdAt: string;
  channel: Channel;
  _count: { capiEvents: number };
}

const STATUS_STYLES: Record<string, string> = {
  sent: "bg-green-100 text-green-700",
  failed: "bg-red-100 text-red-700",
};

const PLATFORM_LABELS: Record<string, string> = {
  facebook: "Facebook",
  instagram: "Instagram",
};

export interface CapiDatasetListProps {
  datasets: CapiDataset[];
  channelsWithoutDataset: Channel[];
  loading: boolean;
  creatingFor: string | null;
  onCreateDataset: (channelId: string) => void;
  onDeactivateDataset: (id: string) => void;
}

export function CapiDatasetList({
  datasets,
  channelsWithoutDataset,
  loading,
  creatingFor,
  onCreateDataset,
  onDeactivateDataset,
}: CapiDatasetListProps) {
  return (
    <section className="mb-8">
      <h2 className="mb-3 text-lg font-semibold">CAPI Datasets</h2>

      {loading ? (
        <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          กำลังโหลด...
        </div>
      ) : (
        <div className="space-y-3">
          {datasets.map((dataset) => (
            <div
              key={dataset.id}
              className={cn(
                "rounded-xl border bg-card p-4 flex items-center gap-4 transition-all",
                !dataset.isActive && "opacity-50"
              )}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="font-medium text-sm">{dataset.channel.name}</p>
                  <Badge className={cn("text-[10px] py-0", STATUS_STYLES[dataset.isActive ? "sent" : "failed"])}>
                    {dataset.isActive ? "Active" : "Inactive"}
                  </Badge>
                  <span className="text-xs text-muted-foreground capitalize">
                    {PLATFORM_LABELS[dataset.platform] ?? dataset.platform}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground font-mono">
                  Dataset ID: {dataset.datasetId}
                </p>
                <p className="text-xs text-muted-foreground">
                  {dataset._count.capiEvents} events ·{" "}
                  {formatDistanceToNow(new Date(dataset.createdAt), { addSuffix: true, locale: th })}
                </p>
              </div>
              {dataset.isActive && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
                  onClick={() => onDeactivateDataset(dataset.id)}
                  title="ปิดการใช้งาน"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}

          {channelsWithoutDataset.map((channel) => (
            <div
              key={channel.id}
              className="rounded-xl border border-dashed p-4 flex items-center gap-4"
            >
              <div className="flex-1">
                <p className="font-medium text-sm">{channel.name}</p>
                <p className="text-xs text-muted-foreground">
                  {PLATFORM_LABELS[channel.platform] ?? channel.platform} · ยังไม่มี Dataset
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => onCreateDataset(channel.id)}
                disabled={creatingFor === channel.id}
              >
                {creatingFor === channel.id ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="mr-2 h-4 w-4" />
                )}
                สร้าง Dataset
              </Button>
            </div>
          ))}

          {datasets.length === 0 && channelsWithoutDataset.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-8">
              <BarChart3 className="h-8 w-8 text-muted-foreground/30" />
              <p className="mt-2 text-sm text-muted-foreground">
                ยังไม่มี Facebook / Instagram channel ที่เชื่อมต่อ
              </p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
