"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  ChevronDown,
  Loader2,
  UserPlus,
  ArrowRightLeft,
  AlertTriangle,
  Lock,
  BookmarkPlus,
  MoreHorizontal,
  Ban,
  FileDown,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { MessageBubble } from "@/components/chat/message-bubble";
import { NoteBubble } from "@/components/chat/note-bubble";
import { ContactSidebar } from "@/components/chat/contact-sidebar";
import { ChatInput } from "@/components/chat/chat-input";
import { AiCopilotPanel } from "@/components/chat/ai-copilot-panel";
import { Sheet, SheetTrigger, SheetContent, SheetTitle } from "@/components/ui/sheet";
import type { Conversation, Message, Note, ConversationEvent } from "./types";
import { EVENT_LABELS, STATUS_BADGE } from "@/lib/constants";

interface ChatViewProps {
  conversation: Conversation;
  onConversationUpdate: (updated: Partial<Conversation> & { id: string }) => void;
  onNewMessage: (conversationId: string) => void;
}

type TimelineItem =
  | { kind: "message"; data: Message }
  | { kind: "note"; data: Note }
  | { kind: "event"; data: ConversationEvent }
  | { kind: "date"; date: string; createdAt: string };

interface AgentOption {
  id: string;
  name: string;
  avatarUrl: string | null;
  isAvailable?: boolean;
}

interface PresenceUser {
  user_id: string;
  user_name: string;
}

export function ChatView({ conversation, onConversationUpdate, onNewMessage }: ChatViewProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [events, setEvents] = useState<ConversationEvent[]>([]);
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

  const fetchEvents = useCallback(async () => {
    const res = await fetch(`/api/conversations/${conversation.id}/events`);
    if (res.ok) {
      const data = await res.json();
      setEvents(data);
    }
  }, [conversation.id]);

  const markAsRead = useCallback(() => {
    fetch(`/api/conversations/${conversation.id}/read`, { method: "POST" }).catch((e) => console.error("[Chat] mark-read error:", e));
  }, [conversation.id]);

  useEffect(() => {
    fetchMessages();
    fetchNotes();
    fetchEvents();
    fetchAgents();
    markAsRead();
  }, [fetchMessages, fetchNotes, fetchEvents, markAsRead]);

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
  const [pendingInsert, setPendingInsert] = useState<string | undefined>();
  const [mobileAiOpen, setMobileAiOpen] = useState(false);

  const handleInsertReply = useCallback((text: string) => {
    setPendingInsert(text);
  }, []);

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
          labels: data.labels,
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

  async function handleReopen() {
    await handleStartChat();
  }

  async function handleFollowUp() {
    const res = await fetch(`/api/conversations/${conversation.id}/follow-up`, { method: "POST" });
    if (res.ok) {
      const data = await res.json();
      onConversationUpdate({ id: conversation.id, status: data.status, labels: data.labels });
    }
  }

  async function handleSpam() {
    const res = await fetch(`/api/conversations/${conversation.id}/spam`, { method: "POST" });
    if (res.ok) {
      const data = await res.json();
      onConversationUpdate({ id: conversation.id, status: data.status, labels: data.labels });
    }
  }

  async function handleBlock() {
    const res = await fetch(`/api/conversations/${conversation.id}/block`, { method: "POST" });
    if (res.ok) {
      const data = await res.json();
      onConversationUpdate({ id: conversation.id, status: data.status, labels: data.labels });
    }
  }

  const rawItems = [
    ...messages.map((m) => ({ kind: "message" as const, data: m })),
    ...notes.map((n) => ({ kind: "note" as const, data: n })),
    ...events.map((e) => ({ kind: "event" as const, data: e })),
  ].sort((a, b) => new Date(a.data.createdAt).getTime() - new Date(b.data.createdAt).getTime());

  const deduped: typeof rawItems = [];
  for (const item of rawItems) {
    if (item.kind === "event") {
      const evt = item.data as ConversationEvent;
      const prev = deduped[deduped.length - 1];
      if (
        prev?.kind === "event" &&
        (prev.data as ConversationEvent).eventType === evt.eventType &&
        Math.abs(new Date(evt.createdAt).getTime() - new Date(prev.data.createdAt).getTime()) < 60_000
      ) {
        continue;
      }
    }
    deduped.push(item);
  }

  const timeline: TimelineItem[] = [];
  let lastDate = "";
  for (const item of deduped) {
    const ts = item.data.createdAt;
    const d = ts.slice(0, 10);
    if (d !== lastDate) {
      timeline.push({ kind: "date", date: d, createdAt: ts });
      lastDate = d;
    }
    timeline.push(item);
  }

  const displayName = conversation.contact.displayName ?? conversation.contact.platformId;

  return (
    <div className="flex h-full">
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Collision warning */}
        {collidingAgents.length > 0 && (
          <div className="flex items-center gap-2 border-b border-border bg-muted px-4 py-2 text-xs text-muted-foreground">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            <span>
              {collidingAgents.map((a) => a.user_name).join(", ")}{" "}
              กำลังดูการสนทนานี้อยู่ด้วย
            </span>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center gap-3 border-b bg-background/90 px-5 py-3">
          <Avatar className="rounded-lg h-10 w-10 shrink-0">
            <AvatarImage src={conversation.contact.avatarUrl ?? undefined} className="rounded-lg" />
            <AvatarFallback className="rounded-lg text-sm font-semibold bg-primary/10 text-primary">{displayName.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="truncate text-sm font-semibold">{displayName}</p>
              <span className="text-xs text-muted-foreground capitalize shrink-0">{conversation.channel.platform}</span>
            </div>
          </div>

          <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium shrink-0", STATUS_BADGE[conversation.status]?.className ?? "bg-muted text-muted-foreground")}>
            {STATUS_BADGE[conversation.status]?.label ?? conversation.status}
          </span>

          {conversation.assignedUser && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground shrink-0 border rounded-full px-2 py-0.5">
              <Lock className="h-3.5 w-3.5" />
              {conversation.assignedUser.id === currentUserId.current ? "ฉัน" : conversation.assignedUser.name}
            </span>
          )}

          {/* Mobile AI button */}
          <Button
            variant="ghost"
            size="icon-sm"
            className="shrink-0 lg:hidden"
            onClick={() => setMobileAiOpen(true)}
          >
            <Sparkles className="h-4 w-4" />
          </Button>

          {/* Actions dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" className="shrink-0" />}>
              <MoreHorizontal className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              {agents.map((agent) => (
                <DropdownMenuItem key={agent.id} onClick={() => assignToAgent(agent.id)}>
                  <UserPlus className="h-3.5 w-3.5 mr-2" />
                  <span className="flex-1 truncate">{agent.name}</span>
                  {conversation.assignedUser?.id === agent.id && (
                    <span className="text-xs text-muted-foreground ml-1">(ปัจจุบัน)</span>
                  )}
                </DropdownMenuItem>
              ))}
              <div className="my-1 border-t" />
              <DropdownMenuItem onClick={() => setShowTransferDialog(true)}>
                <ArrowRightLeft className="h-3.5 w-3.5 mr-2" />
                โอนแชท
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleFollowUp}>
                <BookmarkPlus className="h-3.5 w-3.5 mr-2" />
                ติดตาม
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleSpam}>
                <Ban className="h-3.5 w-3.5 mr-2" />
                สแปม
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleBlock}>
                <Ban className="h-3.5 w-3.5 mr-2 text-destructive" />
                บล็อก
              </DropdownMenuItem>
              <div className="my-1 border-t" />
              <DropdownMenuItem onClick={() => window.open(`/api/conversations/${conversation.id}/export?format=excel`, "_blank")}>
                <FileDown className="h-3.5 w-3.5 mr-2" />
                ส่งออก Excel
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Messages */}
        <div className="chat-messages-bg flex-1 overflow-y-auto px-6 py-5 space-y-3">
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
            timeline.map((item, idx) => {
              if (item.kind === "date") {
                return (
                  <div key={`date-${item.date}`} className="flex justify-center py-5">
                    <span className="rounded-full bg-muted/60 px-4 py-1 text-xs font-semibold text-muted-foreground shadow-sm">
                      {new Date(item.date + "T00:00:00").toLocaleDateString("th-TH", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                );
              }
              if (item.kind === "event") {
                const evt = item.data as ConversationEvent;
                const label = EVENT_LABELS[evt.eventType] ?? evt.eventType;
                const actor = (evt.metadata as Record<string, unknown>)?.agentName as string | undefined;
                return (
                  <div key={`evt-${evt.id}`} className="flex justify-center py-1">
                    <span className="text-xs text-muted-foreground/60">
                      {label}{actor ? ` • ${actor}` : ""}
                    </span>
                  </div>
                );
              }
              if (item.kind === "note") {
                return <NoteBubble key={`note-${(item.data as Note).id}`} note={item.data as Note} />;
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

        {/* Unified input / status area */}
        <ChatInput
          onSendMessage={sendMessage}
          onSaveNote={saveNote}
          conversation={conversation}
          status={conversation.status}
          isLockedByOther={
            conversation.assignedUser !== null &&
            conversation.assignedUser.id !== currentUserId.current
          }
          lockedByName={conversation.assignedUser?.name}
          onStartChat={handleStartChat}
          onResolve={handleResolve}
          onReopen={handleReopen}
          starting={startingChat}
          externalInput={pendingInsert}
          onExternalInputConsumed={() => setPendingInsert(undefined)}
        />
      </div>

      <ContactSidebar conversation={conversation} onSpam={handleSpam} onBlock={handleBlock} onInsertReply={handleInsertReply} />

      {/* Mobile AI Copilot Sheet */}
      <Sheet open={mobileAiOpen} onOpenChange={setMobileAiOpen}>
        <SheetContent side="right" className="p-0 w-full sm:max-w-sm">
          <SheetTitle className="px-4 pt-4 pb-2 flex items-center gap-2 text-sm">
            <Sparkles className="h-4 w-4" />
            AI Copilot
          </SheetTitle>
          <div className="flex-1 overflow-hidden h-[calc(100%-3rem)]">
            <AiCopilotPanel conversation={conversation} onInsertReply={(text) => { handleInsertReply(text); setMobileAiOpen(false); }} />
          </div>
        </SheetContent>
      </Sheet>

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
                    {transferring && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
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
