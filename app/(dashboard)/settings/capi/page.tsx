"use client";

import { useState, useEffect, useCallback } from "react";
import { BarChart3 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { CapiDatasetList, type CapiDataset, type Channel } from "@/components/settings/capi-dataset-list";
import { CapiEventLog, type CapiEvent } from "@/components/settings/capi-event-log";

const PAGE_SIZE = 15;

export default function CAPIPage() {
  const { toast } = useToast();
  const [datasets, setDatasets] = useState<CapiDataset[]>([]);
  const [events, setEvents] = useState<CapiEvent[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loadingDatasets, setLoadingDatasets] = useState(true);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [creatingFor, setCreatingFor] = useState<string | null>(null);
  const [eventFilter, setEventFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [eventsPage, setEventsPage] = useState(1);
  const [totalEvents, setTotalEvents] = useState(0);

  const fetchDatasets = useCallback(async () => {
    setLoadingDatasets(true);
    const res = await fetch("/api/capi/datasets");
    if (res.ok) setDatasets(await res.json());
    setLoadingDatasets(false);
  }, []);

  const fetchEvents = useCallback(async () => {
    setLoadingEvents(true);
    const params = new URLSearchParams({
      page: String(eventsPage),
      limit: String(PAGE_SIZE),
    });
    if (eventFilter) params.set("eventName", eventFilter);
    if (statusFilter) params.set("status", statusFilter);
    const res = await fetch(`/api/capi/events?${params}`);
    if (res.ok) {
      const data = await res.json() as { events: CapiEvent[]; total: number };
      setEvents(data.events);
      setTotalEvents(data.total);
    }
    setLoadingEvents(false);
  }, [eventsPage, eventFilter, statusFilter]);

  const fetchChannels = useCallback(async () => {
    const res = await fetch("/api/channels");
    if (res.ok) {
      const all = await res.json() as Channel[];
      setChannels(all.filter((c) => ["facebook", "instagram"].includes(c.platform)));
    }
  }, []);

  useEffect(() => {
    fetchDatasets();
    fetchChannels();
  }, [fetchDatasets, fetchChannels]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  async function createDataset(channelId: string) {
    setCreatingFor(channelId);
    try {
      const res = await fetch("/api/capi/datasets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channelId }),
      });
      if (res.ok) {
        const data = await res.json() as { isNew: boolean; datasetId: string };
        toast({
          title: data.isNew ? "สร้าง Dataset สำเร็จ" : "Dataset มีอยู่แล้ว",
          description: `Dataset ID: ${data.datasetId}`,
        });
        fetchDatasets();
      } else {
        const err = await res.json() as { error: string };
        toast({ title: "เกิดข้อผิดพลาด", description: err.error, variant: "destructive" });
      }
    } finally {
      setCreatingFor(null);
    }
  }

  async function deactivateDataset(id: string) {
    await fetch(`/api/capi/datasets/${id}`, { method: "DELETE" });
    fetchDatasets();
  }

  async function retryEvent(id: string) {
    const res = await fetch(`/api/capi/events/${id}/retry`, { method: "POST" });
    if (res.ok) {
      const { success } = await res.json() as { success: boolean };
      toast({ title: success ? "ส่งสำเร็จ" : "ส่งไม่สำเร็จ" });
      fetchEvents();
    }
  }

  const datasetChannelIds = new Set(datasets.map((d) => d.channelId));
  const channelsWithoutDataset = channels.filter((c) => !datasetChannelIds.has(c.id));

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="mb-6">
        <h1 className="heading-page">Conversions API (CAPI)</h1>
        <p className="text-sm text-muted-foreground mt-1">
          จัดการ CAPI datasets และดู event log ที่ส่งไป Meta
        </p>
      </div>

      <CapiDatasetList
        datasets={datasets}
        channelsWithoutDataset={channelsWithoutDataset}
        loading={loadingDatasets}
        creatingFor={creatingFor}
        onCreateDataset={createDataset}
        onDeactivateDataset={deactivateDataset}
      />

      <CapiEventLog
        events={events}
        loading={loadingEvents}
        page={eventsPage}
        totalEvents={totalEvents}
        eventFilter={eventFilter}
        statusFilter={statusFilter}
        onPageChange={setEventsPage}
        onEventFilterChange={(v) => { setEventFilter(v); setEventsPage(1); }}
        onStatusFilterChange={(v) => { setStatusFilter(v); setEventsPage(1); }}
        onRefresh={fetchEvents}
        onRetry={retryEvent}
      />
    </div>
  );
}
