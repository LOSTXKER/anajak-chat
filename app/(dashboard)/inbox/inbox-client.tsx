"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { MessageSquare } from "lucide-react";
import { ConversationList } from "./conversation-list";
import { ChatView } from "./chat-view";
import type { Conversation } from "./types";

export default function InboxPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"all" | "open" | "pending" | "resolved">("open");
  const [search, setSearch] = useState("");
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchConversations = useCallback(async (s: string, status: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ status, ...(s ? { search: s } : {}) });
      const res = await fetch(`/api/conversations?${params}`);
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations(search, statusFilter);
  }, [statusFilter, fetchConversations]);

  function handleSearchChange(value: string) {
    setSearch(value);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      fetchConversations(value, statusFilter);
    }, 400);
  }

  function handleConversationUpdate(updated: Partial<Conversation> & { id: string }) {
    setConversations((prev) =>
      prev.map((c) => (c.id === updated.id ? { ...c, ...updated } : c))
    );
  }

  function handleNewMessage(conversationId: string) {
    setConversations((prev) =>
      prev.map((c) =>
        c.id === conversationId ? { ...c, lastMessageAt: new Date().toISOString() } : c
      )
    );
  }

  const selected = conversations.find((c) => c.id === selectedId) ?? null;

  return (
    <div className="flex h-full overflow-hidden">
      <ConversationList
        conversations={conversations}
        selectedId={selectedId}
        loading={loading}
        statusFilter={statusFilter}
        search={search}
        onSelectConversation={setSelectedId}
        onStatusFilterChange={setStatusFilter}
        onSearchChange={handleSearchChange}
        onRefresh={() => fetchConversations(search, statusFilter)}
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
