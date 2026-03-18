export interface ConversationContact {
  id: string;
  displayName: string | null;
  avatarUrl: string | null;
  platform: string;
  platformId: string;
  phone: string | null;
  email: string | null;
  tags: string[];
}

export interface ConversationChannel {
  id: string;
  platform: string;
  name: string;
}

export interface ConversationLastMessage {
  content: string | null;
  contentType: string;
  createdAt: string;
  senderType: string;
}

export interface Conversation {
  id: string;
  orgId: string;
  status: "pending" | "open" | "resolved";
  priority: "low" | "medium" | "high" | "urgent";
  labels: string[];
  contact: ConversationContact;
  channel: ConversationChannel;
  assignedUser: { id: string; name: string; avatarUrl: string | null } | null;
  messages: ConversationLastMessage[];
  lastMessageAt: string | null;
  firstResponseAt: string | null;
  createdAt: string;
  sourceAdId: string | null;
  aiSummary: string | null;
  aiSentiment: string | null;
  slaFirstResponseDeadline: string | null;
  slaBreachedAt: string | null;
  slaResponseMinutes?: number;
  unreadCount: number;
}

export interface Message {
  id: string;
  conversationId: string;
  senderType: "contact" | "agent" | "bot" | "system";
  senderId: string | null;
  content: string | null;
  contentType: "text" | "image" | "file" | "sticker" | "location" | "template";
  mediaUrl: string | null;
  platformMessageId: string | null;
  isAiSuggested: boolean;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface Note {
  id: string;
  orgId: string;
  noteableType: string;
  noteableId: string;
  content: string;
  mentions: string[];
  authorId: string;
  createdAt: string;
}

export interface ConversationEvent {
  id: string;
  conversationId: string;
  eventType: string;
  actorId: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}
