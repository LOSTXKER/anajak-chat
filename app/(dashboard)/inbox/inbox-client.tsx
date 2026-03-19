"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { MessageSquare, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { cn } from "@/lib/utils";
import { ConversationList } from "./conversation-list";
import type { MainTab, LabelFilter, ChannelFilter } from "./conversation-list";
import { ChatView } from "./chat-view";
import { createClient } from "@/lib/supabase/client";
import type { Conversation } from "./types";

export default function InboxPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [mainTab, setMainTab] = useState<MainTab>("pending");
  const [labelFilter, setLabelFilter] = useState<LabelFilter>("");
  const [channelFilter, setChannelFilter] = useState<ChannelFilter>("");
  const [search, setSearch] = useState("");
  const [statusCounts, setStatusCounts] = useState({ pending: 0, open: 0, resolved: 0 });
  const [newPendingAlert, setNewPendingAlert] = useState(false);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const realtimeDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const mainTabRef = useRef(mainTab);
  const labelFilterRef = useRef(labelFilter);
  const channelFilterRef = useRef(channelFilter);
  const searchRef = useRef(search);

  mainTabRef.current = mainTab;
  labelFilterRef.current = labelFilter;
  channelFilterRef.current = channelFilter;
  searchRef.current = search;

  const fetchConversations = useCallback(
    async (opts: {
      search: string;
      label: LabelFilter;
      channel: ChannelFilter;
      tab: MainTab;
    }) => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (opts.tab !== "all") params.set("status", opts.tab);
        if (opts.label) params.set("label", opts.label);
        if (opts.channel) params.set("platform", opts.channel);
        if (opts.search) params.set("search", opts.search);

        const res = await fetch(`/api/conversations?${params}`);
        if (res.ok) {
          const data = await res.json();
          setConversations(data.conversations);
          if (data.counts) setStatusCounts(data.counts);
        }
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const refetch = useCallback(() => {
    fetchConversations({
      search: searchRef.current,
      label: labelFilterRef.current,
      channel: channelFilterRef.current,
      tab: mainTabRef.current,
    });
  }, [fetchConversations]);

  useEffect(() => {
    refetch();
  }, [mainTab, labelFilter, channelFilter, refetch]);

  const debouncedRefetch = useCallback(() => {
    if (realtimeDebounce.current) clearTimeout(realtimeDebounce.current);
    realtimeDebounce.current = setTimeout(() => refetch(), 300);
  }, [refetch]);

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel("inbox-conversations")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "conversations" },
        () => {
          if (mainTabRef.current !== "pending" && mainTabRef.current !== "all") {
            setNewPendingAlert(true);
          }
          debouncedRefetch();
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "conversations" },
        () => {
          debouncedRefetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      if (realtimeDebounce.current) clearTimeout(realtimeDebounce.current);
    };
  }, [debouncedRefetch]);

  function handleSearchChange(value: string) {
    setSearch(value);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      fetchConversations({
        search: value,
        label: labelFilter,
        channel: channelFilter,
        tab: mainTab,
      });
    }, 400);
  }

  function handleMainTabChange(tab: MainTab) {
    setMainTab(tab);
    if (tab === "pending" || tab === "all") {
      setNewPendingAlert(false);
    }
  }

  function handleConversationUpdate(updated: Partial<Conversation> & { id: string }) {
    setConversations((prev) =>
      prev.map((c) => (c.id === updated.id ? { ...c, ...updated } : c))
    );
    setSelectedConv((prev) =>
      prev && prev.id === updated.id ? { ...prev, ...updated } : prev
    );
  }

  const handleNewMessage = useCallback((conversationId: string) => {
    setConversations((prev) =>
      prev.map((c) =>
        c.id === conversationId ? { ...c, lastMessageAt: new Date().toISOString() } : c
      )
    );
  }, []);

  const foundInList = conversations.find((c) => c.id === selectedId);
  const selected = foundInList ?? selectedConv;

  useEffect(() => {
    if (foundInList) setSelectedConv(foundInList);
  }, [foundInList]);

  return (
    <div className="flex h-full overflow-hidden">
      {/* Conversation list - full width on mobile when no conversation selected, fixed width on desktop */}
      <div className={cn(
        "shrink-0 h-full lg:block",
        selected ? "hidden lg:block" : "w-full lg:w-auto"
      )}>
        <ConversationList
          conversations={conversations}
          selectedId={selectedId}
          loading={loading}
          mainTab={mainTab}
          labelFilter={labelFilter}
          channelFilter={channelFilter}
          search={search}
          statusCounts={statusCounts}
          newPendingAlert={newPendingAlert}
          onSelectConversation={(id) => {
            setSelectedId(id);
            const conv = conversations.find((c) => c.id === id);
            if (conv) setSelectedConv({ ...conv, unreadCount: 0 });
            setConversations((prev) =>
              prev.map((c) => (c.id === id ? { ...c, unreadCount: 0 } : c))
            );
          }}
          onMainTabChange={handleMainTabChange}
          onLabelFilterChange={setLabelFilter}
          onChannelFilterChange={setChannelFilter}
          onSearchChange={handleSearchChange}
          onRefresh={refetch}
        />
      </div>
      {/* Chat area - full width on mobile when conversation selected */}
      <div className={cn(
        "flex-1 overflow-hidden",
        selected ? "block" : "hidden lg:block"
      )}>
        {selected ? (
          <div className="flex h-full flex-col">
            {/* Mobile back button */}
            <div className="flex items-center gap-2 border-b px-3 py-2 lg:hidden">
              <Button variant="ghost" size="icon-sm" onClick={() => { setSelectedId(null); setSelectedConv(null); }}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium truncate">
                {selected.contact.displayName ?? selected.contact.platformId}
              </span>
            </div>
            <div className="flex-1 overflow-hidden">
              <ChatView
                key={selected.id}
                conversation={selected}
                onConversationUpdate={handleConversationUpdate}
                onNewMessage={handleNewMessage}
              />
            </div>
          </div>
        ) : (
          <div className="flex h-full items-center justify-center">
            <EmptyState
              icon={MessageSquare}
              message="เลือกการสนทนาเพื่อเริ่มแชท"
              description="คลิกที่การสนทนาทางซ้ายเพื่อเปิดแชท"
              className="border-0"
            />
          </div>
        )}
      </div>
    </div>
  );
}
