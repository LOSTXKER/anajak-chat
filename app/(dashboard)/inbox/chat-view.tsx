"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  ChevronDown,
  Loader2,
  UserPlus,
  ArrowRightLeft,
  AlertTriangle,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { MessageBubble } from "@/components/chat/message-bubble";
import { NoteBubble } from "@/components/chat/note-bubble";
import { ContactSidebar } from "@/components/chat/contact-sidebar";
import { ChatInput } from "@/components/chat/chat-input";
import { SlaTimer } from "./sla-timer";
import { SessionBar } from "./session-bar";
import type { Conversation, Message, Note } from "./types";

interface ChatViewProps {
  conversation: Conversation;
  onConversationUpdate: (updated: Partial<Conversation> & { id: string }) => void;
  onNewMessage: (conversationId: string) => void;
}

type TimelineItem =
  | { kind: "message"; data: Message }
  | { kind: "note"; data: Note };

interface AgentOption {
  id: string;
  name: string;
  avatarUrl: string | null;
}

interface PresenceUser {
  user_id: string;
  user_name: string;
}

export function ChatView({ conversation, onConversationUpdate, onNewMessage }: ChatViewProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [agents, setAgents] = useState<AgentOption[]>([]);
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [transferSearch, setTransferSearch] = useState("");
  const [transferring, setTransferring] = useState(false);
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [collidingAgents, setCollidingAgents] = useState<PresenceUser[]>([]);
  const currentUserId = useRef<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchMessages = useCallback(async () => {
    setLoadingMessages(true);
    try {
      const res = await fetch(`/api/conversations/${conversation.id}/messages?limit=50`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages);
        setNextCursor(data.nextCursor);
      }
    } finally {
      setLoadingMessages(false);
    }
  }, [conversation.id]);

  const fetchNotes = useCallback(async () => {
    const res = await fetch(`/api/notes?type=conversation&id=${conversation.id}`);
    if (res.ok) {
      const data = await res.json();
      setNotes(data);
    }
  }, [conversation.id]);

  const markAsRead = useCallback(() => {
    fetch(`/api/conversations/${conversation.id}/read`, { method: "POST" }).catch(() => {});
  }, [conversation.id]);

  useEffect(() => {
    fetchMessages();
    fetchNotes();
    fetchAgents();
    markAsRead();
  }, [fetchMessages, fetchNotes, markAsRead]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function fetchAgents() {
    const res = await fetch("/api/users");
    if (res.ok) {
      const data = (await res.json()) as AgentOption[];
      setAgents(data);
    }
  }

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data }) => {
      currentUserId.current = data.user?.id ?? null;
    });

    const channel = supabase
      .channel(`conversation-${conversation.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversation.id}`,
        },
        (payload) => {
          const row = payload.new as Record<string, unknown>;
          const newMsg: Message = {
            id: row.id as string,
            conversationId: row.conversation_id as string,
            senderType: row.sender_type as Message["senderType"],
            senderId: (row.sender_id as string) ?? null,
            content: (row.content as string) ?? null,
            contentType: (row.content_type as Message["contentType"]) ?? "text",
            mediaUrl: (row.media_url as string) ?? null,
            platformMessageId: (row.platform_message_id as string) ?? null,
            isAiSuggested: (row.is_ai_suggested as boolean) ?? false,
            metadata: (row.metadata as Record<string, unknown>) ?? {},
            createdAt: row.created_at
              ? new Date(String(row.created_at).endsWith("Z") || String(row.created_at).includes("+") ? String(row.created_at) : String(row.created_at) + "Z").toISOString()
              : new Date().toISOString(),
          };
          setMessages((prev) => {
            if (prev.find((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
          onNewMessage(conversation.id);
          markAsRead();
        }
      )
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState<PresenceUser>();
        const others = Object.values(state)
          .flat()
          .filter((p) => p.user_id !== currentUserId.current);
        setCollidingAgents(others);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          const { data } = await supabase.auth.getUser();
          if (data.user) {
            await channel.track({
              user_id: data.user.id,
              user_name: data.user.user_metadata?.name ?? data.user.email ?? "Agent",
            });
          }
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversation.id, onNewMessage, markAsRead]);

  async function loadOlderMessages() {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const res = await fetch(
        `/api/conversations/${conversation.id}/messages?cursor=${nextCursor}&limit=50`
      );
      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [...data.messages, ...prev]);
        setNextCursor(data.nextCursor);
      }
    } finally {
      setLoadingMore(false);
    }
  }

  async function sendMessage(content?: string, mediaUrl?: string, mediaFileId?: string) {
    const res = await fetch(`/api/conversations/${conversation.id}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: content || undefined,
        contentType: mediaUrl ? "image" : "text",
        mediaUrl,
        mediaFileId,
      }),
    });
    if (res.ok) {
      const msg = (await res.json()) as Message;
      setMessages((prev) => {
        if (prev.find((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      onNewMessage(conversation.id);
    }
  }

  async function saveNote(content: string) {
    const res = await fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        noteableType: "conversation",
        noteableId: conversation.id,
        content,
      }),
    });
    if (res.ok) {
      const note = (await res.json()) as Note;
      setNotes((prev) => [...prev, note]);
    }
  }

  async function assignToAgent(agentId: string) {
    setAssigningId(agentId);
    try {
      const res = await fetch(`/api/conversations/${conversation.id}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId }),
      });
      if (res.ok) {
        const data = await res.json();
        onConversationUpdate({
          id: conversation.id,
          assignedUser: data.assignedUser,
        });
      }
    } finally {
      setAssigningId(null);
    }
  }

  async function transferToAgent(agentId: string) {
    setTransferring(true);
    try {
      const res = await fetch(`/api/conversations/${conversation.id}/transfer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toAgentId: agentId }),
      });
      if (res.ok) {
        const data = await res.json();
        onConversationUpdate({
          id: conversation.id,
          assignedUser: agents.find((a) => a.id === data.assignedTo)
            ? { id: data.assignedTo, name: data.agentName, avatarUrl: null }
            : null,
        });
        setShowTransferDialog(false);
      }
    } finally {
      setTransferring(false);
    }
  }

  const [startingChat, setStartingChat] = useState(false);

  async function updateStatus(status: string) {
    const res = await fetch(`/api/conversations/${conversation.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      onConversationUpdate({ id: conversation.id, status: status as Conversation["status"] });
    }
  }

  async function handleStartChat() {
    setStartingChat(true);
    try {
      const res = await fetch(`/api/conversations/${conversation.id}/start`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        onConversationUpdate({
          id: conversation.id,
          status: data.status,
          assignedUser: data.assignedUser,
          sessionDeadline: data.sessionDeadline,
        });
      }
    } finally {
      setStartingChat(false);
    }
  }

  async function handleResolve() {
    const res = await fetch(`/api/conversations/${conversation.id}/resolve`, { method: "POST" });
    if (res.ok) {
      onConversationUpdate({ id: conversation.id, status: "resolved" });
    }
  }

  async function handleExtend(minutes: number) {
    const res = await fetch(`/api/conversations/${conversation.id}/extend`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ minutes }),
    });
    if (res.ok) {
      const data = await res.json();
      onConversationUpdate({ id: conversation.id, sessionDeadline: data.sessionDeadline });
    }
  }

  async function handleReopen() {
    await handleStartChat();
  }

  async function handleFollowUp() {
    const res = await fetch(`/api/conversations/${conversation.id}/follow-up`, { method: "POST" });
    if (res.ok) {
      onConversationUpdate({ id: conversation.id, status: "follow_up" });
    }
  }

  async function handleExpire() {
    const res = await fetch(`/api/conversations/${conversation.id}/expire`, { method: "POST" });
    if (res.ok) {
      onConversationUpdate({ id: conversation.id, status: "expired" });
    }
  }

  async function handleSpam() {
    const res = await fetch(`/api/conversations/${conversation.id}/spam`, { method: "POST" });
    if (res.ok) {
      onConversationUpdate({ id: conversation.id, status: "spam" });
    }
  }

  async function handleBlock() {
    const res = await fetch(`/api/conversations/${conversation.id}/block`, { method: "POST" });
    if (res.ok) {
      onConversationUpdate({ id: conversation.id, status: "blocked" });
    }
  }

  const timeline: TimelineItem[] = [
    ...messages.map((m) => ({ kind: "message" as const, data: m })),
    ...notes.map((n) => ({ kind: "note" as const, data: n })),
  ].sort((a, b) => new Date(a.data.createdAt).getTime() - new Date(b.data.createdAt).getTime());

  const displayName = conversation.contact.displayName ?? conversation.contact.platformId;

  return (
    <div className="flex h-full">
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Collision warning */}
        {collidingAgents.length > 0 && (
          <div className="flex items-center gap-2 border-b bg-yellow-50 px-4 py-2 text-xs text-yellow-800">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            <span>
              {collidingAgents.map((a) => a.user_name).join(", ")}{" "}
              กำลังดูการสนทนานี้อยู่ด้วย
            </span>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center gap-3 border-b px-4 py-3">
          <Avatar className="h-9 w-9">
            <AvatarImage src={conversation.contact.avatarUrl ?? undefined} />
            <AvatarFallback>{displayName.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium">{displayName}</p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{conversation.channel.name}</span>
              {conversation.assignedUser && (
                <span className="flex items-center gap-1">
                  <Lock className="h-3 w-3" />
                  {conversation.assignedUser.id === currentUserId.current
                    ? "ฉัน"
                    : conversation.assignedUser.name}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <SlaTimer conversation={conversation} />

            <Select
              value={conversation.assignedUser?.id ?? "unassigned"}
              onValueChange={(v) => v && v !== "unassigned" && assignToAgent(v)}
            >
              <SelectTrigger className="h-8 w-36 text-xs">
                <div className="flex items-center gap-1.5 truncate">
                  <UserPlus className="h-3 w-3 shrink-0" />
                  <span className="truncate">
                    {assigningId
                      ? "กำลังมอบ..."
                      : conversation.assignedUser?.name ?? "ยังไม่มอบหมาย"}
                  </span>
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned" disabled>
                  -- เลือกผู้รับผิดชอบ --
                </SelectItem>
                {agents.map((agent) => (
                  <SelectItem key={agent.id} value={agent.id}>
                    {agent.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              title="โอนแชท"
              onClick={() => setShowTransferDialog(true)}
            >
              <ArrowRightLeft className="h-4 w-4" />
            </Button>

            <Select value={conversation.status} onValueChange={(v) => v && updateStatus(v)}>
              <SelectTrigger className="h-8 w-32 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">รอรับ</SelectItem>
                <SelectItem value="open">กำลังดูแล</SelectItem>
                <SelectItem value="expired">หมดอายุ</SelectItem>
                <SelectItem value="resolved">เสร็จสิ้น</SelectItem>
                <SelectItem value="follow_up">ติดตาม</SelectItem>
                <SelectItem value="missed">ไม่ได้รับ</SelectItem>
                <SelectItem value="spam">สแปม</SelectItem>
                <SelectItem value="blocked">บล็อก</SelectItem>
                <SelectItem value="closed">ปิด</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-1">
          {nextCursor && (
            <div className="flex justify-center pb-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={loadOlderMessages}
                disabled={loadingMore}
              >
                {loadingMore ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <ChevronDown className="h-4 w-4 mr-2" />
                )}
                โหลดข้อความเก่า
              </Button>
            </div>
          )}

          {loadingMessages ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            timeline.map((item) => {
              if (item.kind === "note") {
                return <NoteBubble key={`note-${item.data.id}`} note={item.data as Note} />;
              }
              const msg = item.data as Message;
              return (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  contactName={displayName}
                  contactAvatar={conversation.contact.avatarUrl ?? undefined}
                />
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Session bar + Input area */}
        <SessionBar
          conversation={conversation}
          currentUserId={currentUserId.current}
          onStartChat={handleStartChat}
          onResolve={handleResolve}
          onExtend={handleExtend}
          onReopen={handleReopen}
          onFollowUp={handleFollowUp}
          onExpire={handleExpire}
          onSpam={handleSpam}
          onBlock={handleBlock}
          starting={startingChat}
        />
        {conversation.status === "open" &&
         (!conversation.assignedUser || conversation.assignedUser.id === currentUserId.current) && (
          <ChatInput onSendMessage={sendMessage} onSaveNote={saveNote} />
        )}
      </div>

      <ContactSidebar conversation={conversation} />

      {/* Transfer dialog */}
      <Dialog open={showTransferDialog} onOpenChange={setShowTransferDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowRightLeft className="h-4 w-4" />
              โอนแชทให้ผู้อื่น
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Input
              placeholder="ค้นหาชื่อ..."
              value={transferSearch}
              onChange={(e) => setTransferSearch(e.target.value)}
            />
            <div className="max-h-48 space-y-1 overflow-y-auto">
              {agents
                .filter(
                  (a) =>
                    a.id !== conversation.assignedUser?.id &&
                    a.name.toLowerCase().includes(transferSearch.toLowerCase())
                )
                .map((agent) => (
                  <button
                    key={agent.id}
                    onClick={() => transferToAgent(agent.id)}
                    disabled={transferring}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-muted transition-colors disabled:opacity-50"
                  >
                    <Avatar className="h-7 w-7">
                      <AvatarImage src={agent.avatarUrl ?? undefined} />
                      <AvatarFallback className="text-xs">
                        {agent.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="flex-1 text-left font-medium">{agent.name}</span>
                    {transferring && <Loader2 className="h-3 w-3 animate-spin" />}
                  </button>
                ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTransferDialog(false)}>
              ยกเลิก
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
