"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { MessageSquare } from "lucide-react";
import { ConversationList } from "./conversation-list";
import type { MainTab, StatusFilter, LabelFilter } from "./conversation-list";
import { ChatView } from "./chat-view";
import { createClient } from "@/lib/supabase/client";
import type { Conversation } from "./types";

export default function InboxPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [mainTab, setMainTab] = useState<MainTab>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [labelFilter, setLabelFilter] = useState<LabelFilter>("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const mainTabRef = useRef(mainTab);
  const statusFilterRef = useRef(statusFilter);
  const labelFilterRef = useRef(labelFilter);
  const searchRef = useRef(search);
  const currentUserIdRef = useRef(currentUserId);

  mainTabRef.current = mainTab;
  statusFilterRef.current = statusFilter;
  labelFilterRef.current = labelFilter;
  searchRef.current = search;
  currentUserIdRef.current = currentUserId;

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setCurrentUserId(data.user?.id ?? null);
    });
  }, []);

  const fetchConversations = useCallback(
    async (opts: {
      search: string;
      status: StatusFilter;
      label: LabelFilter;
      tab: MainTab;
      userId: string | null;
    }) => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (opts.status !== "all") params.set("status", opts.status);
        if (opts.label) params.set("label", opts.label);
        if (opts.search) params.set("search", opts.search);
        if (opts.tab === "inbox" && opts.userId) params.set("assignedTo", opts.userId);

        const res = await fetch(`/api/conversations?${params}`);
        if (res.ok) {
          const data = await res.json();
          setConversations(data.conversations);
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
      status: statusFilterRef.current,
      label: labelFilterRef.current,
      tab: mainTabRef.current,
      userId: currentUserIdRef.current,
    });
  }, [fetchConversations]);

  useEffect(() => {
    if (currentUserId !== null || mainTab !== "inbox") {
      refetch();
    }
  }, [mainTab, statusFilter, labelFilter, currentUserId, refetch]);

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel("inbox-conversations")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "conversations" },
        () => {
          refetch();
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "conversations" },
        (payload) => {
          const updated = payload.new as Record<string, unknown>;
          const id = updated.id as string;
          const status = updated.status as string | undefined;
          const labels = updated.labels as string[] | undefined;
          const assignedTo = updated.assigned_to as string | null | undefined;
          const rawDate = updated.last_message_at as string | null;
          const normalized = rawDate
            ? rawDate.endsWith("Z") || rawDate.includes("+")
              ? rawDate
              : rawDate + "Z"
            : null;
          const lastMessageAt =
            normalized && !isNaN(Date.parse(normalized))
              ? new Date(normalized).toISOString()
              : null;

          setConversations((prev) => {
            const exists = prev.find((c) => c.id === id);
            if (!exists) return prev;
            return prev.map((c) =>
              c.id === id
                ? {
                    ...c,
                    ...(lastMessageAt && { lastMessageAt }),
                    ...(status && { status: status as Conversation["status"] }),
                    ...(labels && { labels }),
                    ...(assignedTo !== undefined && {
                      assignedUser: assignedTo
                        ? c.assignedUser?.id === assignedTo
                          ? c.assignedUser
                          : { id: assignedTo, name: assignedTo, avatarUrl: null }
                        : null,
                    }),
                  }
                : c
            );
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetch]);

  function handleSearchChange(value: string) {
    setSearch(value);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      fetchConversations({
        search: value,
        status: statusFilter,
        label: labelFilter,
        tab: mainTab,
        userId: currentUserId,
      });
    }, 400);
  }

  function handleConversationUpdate(updated: Partial<Conversation> & { id: string }) {
    setConversations((prev) =>
      prev.map((c) => (c.id === updated.id ? { ...c, ...updated } : c))
    );
  }

  const handleNewMessage = useCallback((conversationId: string) => {
    setConversations((prev) =>
      prev.map((c) =>
        c.id === conversationId ? { ...c, lastMessageAt: new Date().toISOString() } : c
      )
    );
  }, []);

  const selected = conversations.find((c) => c.id === selectedId) ?? null;

  return (
    <div className="flex h-full overflow-hidden">
      <ConversationList
        conversations={conversations}
        selectedId={selectedId}
        loading={loading}
        mainTab={mainTab}
        statusFilter={statusFilter}
        labelFilter={labelFilter}
        search={search}
        currentUserId={currentUserId}
        onSelectConversation={(id) => {
          setSelectedId(id);
          setConversations((prev) =>
            prev.map((c) => (c.id === id ? { ...c, unreadCount: 0 } : c))
          );
        }}
        onMainTabChange={setMainTab}
        onStatusFilterChange={setStatusFilter}
        onLabelFilterChange={setLabelFilter}
        onSearchChange={handleSearchChange}
        onRefresh={refetch}
      />
      <div className="flex-1 overflow-hidden">
        {selected ? (
          <ChatView
            key={selected.id}
            conversation={selected}
            onConversationUpdate={handleConversationUpdate}
            onNewMessage={handleNewMessage}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center bg-muted rounded-full p-4">
                <MessageSquare className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-xl font-medium text-foreground/80">เลือกการสนทนาเพื่อเริ่มแชท</p>
              <p className="mt-1 text-sm text-muted-foreground">คลิกที่การสนทนาทางซ้ายเพื่อเปิดแชท</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
