import type { MessageSquare } from "lucide-react";

export interface RichButton {
  label: string;
  action: "postback" | "url" | "message";
  value: string;
}

export interface AutoReplyMessage {
  type: "text" | "image" | "card" | "sticker" | "file" | "video";
  text?: string;
  buttons?: RichButton[];
  imageUrl?: string;
  cardTitle?: string;
  cardText?: string;
  cardImageUrl?: string;
  cardButtons?: RichButton[];
  stickerPackageId?: string;
  stickerId?: string;
  fileUrl?: string;
  fileName?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
}

export interface QuickReplyItem {
  label: string;
  action: "message" | "postback";
  value: string;
}

export interface PlatformPattern {
  messages: AutoReplyMessage[];
  quickReplies?: QuickReplyItem[];
}

export interface PlatformMessages {
  _default: PlatformPattern;
  line?: PlatformPattern;
  facebook?: PlatformPattern;
  instagram?: PlatformPattern;
}

export interface MessageSetItem {
  id: string;
  name: string;
  messages: PlatformMessages;
  createdAt: string;
  updatedAt: string;
  _count?: { intentLinks: number };
}

export type PlatformKey = "_default" | "line" | "facebook" | "instagram";

export const PLATFORMS: { key: PlatformKey; label: string }[] = [
  { key: "line", label: "Line" },
  { key: "facebook", label: "Facebook" },
  { key: "instagram", label: "Instagram" },
];

export const MSG_TYPES: {
  type: AutoReplyMessage["type"];
  label: string;
  icon: typeof MessageSquare;
}[] = [];

export function emptyMessages(): PlatformMessages {
  return { _default: { messages: [], quickReplies: [] } };
}

export function getPattern(
  msgs: PlatformMessages,
  platform: PlatformKey
): PlatformPattern {
  if (platform === "_default")
    return msgs._default ?? { messages: [], quickReplies: [] };
  return msgs[platform] ?? msgs._default ?? { messages: [], quickReplies: [] };
}

export function setPattern(
  msgs: PlatformMessages,
  platform: PlatformKey,
  pattern: PlatformPattern
): PlatformMessages {
  return { ...msgs, [platform]: pattern };
}
