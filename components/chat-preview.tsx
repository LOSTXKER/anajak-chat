"use client";

import { useEffect, useRef } from "react";
import { Bot, ImageIcon, Play, Smile, FileIcon, MessageSquare, User } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PreviewMessage {
  type: "text" | "image" | "card" | "sticker" | "file" | "video";
  text?: string;
  buttons?: { label: string; action: string; value: string }[];
  imageUrl?: string;
  cardTitle?: string;
  cardText?: string;
  cardImageUrl?: string;
  cardButtons?: { label: string; action: string; value: string }[];
  stickerPackageId?: string;
  stickerId?: string;
  fileUrl?: string;
  fileName?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
}

export interface PreviewQuickReply {
  label: string;
  action: string;
  value: string;
}

type Platform = "_default" | "line" | "facebook" | "instagram";

const PLATFORM_LABELS: Record<Platform, string> = {
  _default: "Chat Preview",
  line: "LINE",
  facebook: "Messenger",
  instagram: "Instagram",
};

const PLATFORM_COLORS: Record<Platform, string> = {
  _default: "bg-primary",
  line: "bg-[#06C755]",
  facebook: "bg-[#0084FF]",
  instagram: "bg-gradient-to-tr from-[#F58529] via-[#DD2A7B] to-[#8134AF]",
};

interface ChatPreviewProps {
  messages: PreviewMessage[];
  quickReplies?: PreviewQuickReply[];
  platform?: Platform;
  botName?: string;
  userMessage?: string;
}

function TextBubble({ msg }: { msg: PreviewMessage }) {
  const text = msg.text?.trim();
  return (
    <div className="max-w-[85%] rounded-2xl rounded-tl-md bg-white px-3.5 py-2.5 text-[13px] leading-relaxed text-gray-800 shadow-sm">
      {text || <span className="italic text-gray-400">ข้อความว่าง...</span>}
      {msg.buttons && msg.buttons.length > 0 && (
        <div className="mt-2 flex flex-col gap-1 border-t border-gray-100 pt-2">
          {msg.buttons.map((btn, i) => (
            <div key={i} className="rounded-lg bg-blue-50 px-3 py-1.5 text-center text-xs font-medium text-blue-600">
              {btn.label || "ปุ่ม"}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ImageBubble({ msg }: { msg: PreviewMessage }) {
  return (
    <div className="max-w-[75%] overflow-hidden rounded-2xl rounded-tl-md shadow-sm">
      {msg.imageUrl ? (
        <img src={msg.imageUrl} alt="" className="h-auto w-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
      ) : (
        <div className="flex h-36 w-48 items-center justify-center bg-gray-100">
          <ImageIcon className="h-8 w-8 text-gray-300" />
        </div>
      )}
    </div>
  );
}

function CardBubble({ msg }: { msg: PreviewMessage }) {
  return (
    <div className="w-[75%] overflow-hidden rounded-2xl rounded-tl-md bg-white shadow-sm">
      {msg.cardImageUrl ? (
        <img src={msg.cardImageUrl} alt="" className="h-28 w-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
      ) : (
        <div className="flex h-28 w-full items-center justify-center bg-gray-100">
          <ImageIcon className="h-8 w-8 text-gray-300" />
        </div>
      )}
      <div className="px-3.5 py-2.5">
        <p className="text-[13px] font-semibold text-gray-800">
          {msg.cardTitle || <span className="italic text-gray-400">หัวข้อการ์ด...</span>}
        </p>
        {(msg.cardText || !msg.cardTitle) && (
          <p className="mt-0.5 text-[12px] leading-relaxed text-gray-500">
            {msg.cardText || <span className="italic">รายละเอียด...</span>}
          </p>
        )}
      </div>
      {msg.cardButtons && msg.cardButtons.length > 0 && (
        <div className="border-t border-gray-100">
          {msg.cardButtons.map((btn, i) => (
            <div key={i} className="border-b border-gray-50 px-3.5 py-2 text-center text-xs font-medium text-blue-600 last:border-b-0">
              {btn.label || "ปุ่ม"}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StickerBubble({ msg }: { msg: PreviewMessage }) {
  return (
    <div className="flex h-20 w-20 items-center justify-center rounded-2xl">
      <div className="flex flex-col items-center gap-1 text-gray-400">
        <Smile className="h-10 w-10" />
        {msg.stickerPackageId && (
          <span className="text-[10px]">{msg.stickerPackageId}/{msg.stickerId}</span>
        )}
      </div>
    </div>
  );
}

function VideoBubble({ msg }: { msg: PreviewMessage }) {
  return (
    <div className="max-w-[75%] overflow-hidden rounded-2xl rounded-tl-md shadow-sm">
      <div className="relative">
        {msg.thumbnailUrl ? (
          <img src={msg.thumbnailUrl} alt="" className="h-32 w-48 object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
        ) : (
          <div className="flex h-32 w-48 items-center justify-center bg-gray-800" />
        )}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow">
            <Play className="h-4 w-4 fill-gray-700 text-gray-700" />
          </div>
        </div>
      </div>
    </div>
  );
}

function FileBubble({ msg }: { msg: PreviewMessage }) {
  return (
    <div className="flex max-w-[85%] items-center gap-2.5 rounded-2xl rounded-tl-md bg-white px-3.5 py-2.5 shadow-sm">
      <FileIcon className="h-5 w-5 shrink-0 text-gray-400" />
      <span className="truncate text-[13px] text-gray-700">{msg.fileName || "ไฟล์แนบ"}</span>
    </div>
  );
}

function BotBubble({ msg }: { msg: PreviewMessage }) {
  switch (msg.type) {
    case "text": return <TextBubble msg={msg} />;
    case "image": return <ImageBubble msg={msg} />;
    case "card": return <CardBubble msg={msg} />;
    case "sticker": return <StickerBubble msg={msg} />;
    case "video": return <VideoBubble msg={msg} />;
    case "file": return <FileBubble msg={msg} />;
    default: return null;
  }
}

export function ChatPreview({ messages, quickReplies = [], platform = "_default", botName = "Bot", userMessage }: ChatPreviewProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const platformLabel = PLATFORM_LABELS[platform];
  const headerColor = PLATFORM_COLORS[platform];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, quickReplies, userMessage]);

  const isEmpty = messages.length === 0 && !userMessage;

  return (
    <div className="flex flex-col overflow-hidden rounded-[2rem] border-[3px] border-gray-800 bg-gray-50 shadow-xl dark:border-gray-600 dark:bg-gray-900" style={{ height: "min(680px, calc(100vh - 8rem))" }}>
      {/* Status Bar */}
      <div className="flex h-6 items-center justify-between bg-gray-800 px-5 dark:bg-gray-700">
        <span className="text-[10px] font-medium text-gray-300">9:41</span>
        <div className="flex items-center gap-1">
          <div className="h-1.5 w-4 rounded-full bg-gray-400" />
          <div className="h-1.5 w-1.5 rounded-full bg-gray-400" />
        </div>
      </div>

      {/* App Header */}
      <div className={cn("flex items-center gap-3 px-4 py-2.5", headerColor)}>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
          <Bot className="h-4 w-4 text-white" />
        </div>
        <div className="flex-1">
          <p className="text-[13px] font-semibold text-white">{botName}</p>
          <p className="text-[10px] text-white/70">{platformLabel}</p>
        </div>
      </div>

      {/* Chat Area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-3 py-3"
        style={{ background: "linear-gradient(180deg, #f0f2f5 0%, #e8eaed 100%)" }}
      >
        {isEmpty ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
            <MessageSquare className="h-8 w-8 text-gray-300" />
            <p className="text-xs text-gray-400">เพิ่มข้อความเพื่อดูตัวอย่าง</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {/* User message (right-aligned) */}
            {userMessage && (
              <div className="flex items-end justify-end gap-2">
                <div className="max-w-[75%] rounded-2xl rounded-tr-md bg-blue-500 px-3.5 py-2.5 text-[13px] leading-relaxed text-white shadow-sm">
                  {userMessage}
                </div>
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-400">
                  <User className="h-3 w-3 text-white" />
                </div>
              </div>
            )}

            {/* Bot messages (left-aligned) */}
            {messages.map((msg, idx) => (
              <div key={idx} className="flex items-end gap-2">
                {idx === 0 || messages[idx - 1]?.type === "sticker" ? (
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-300">
                    <Bot className="h-3 w-3 text-white" />
                  </div>
                ) : (
                  <div className="w-6 shrink-0" />
                )}
                <BotBubble msg={msg} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Replies */}
      {quickReplies.length > 0 && (
        <div className="flex gap-1.5 overflow-x-auto border-t border-gray-200 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-800">
          {quickReplies.map((qr, idx) => (
            <div
              key={idx}
              className="shrink-0 rounded-full border border-blue-400 bg-white px-3 py-1 text-[11px] font-medium text-blue-500 dark:border-blue-500 dark:bg-gray-800 dark:text-blue-400"
            >
              {qr.label || "Quick Reply"}
            </div>
          ))}
        </div>
      )}

      {/* Input Bar */}
      <div className="flex items-center gap-2 border-t border-gray-200 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-800">
        <div className="flex-1 rounded-full bg-gray-100 px-3.5 py-1.5 text-[12px] text-gray-400 dark:bg-gray-700 dark:text-gray-500">
          Aa
        </div>
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-500">
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-white" xmlns="http://www.w3.org/2000/svg">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
          </svg>
        </div>
      </div>

      {/* Home Indicator */}
      <div className="flex justify-center bg-white pb-1.5 pt-1 dark:bg-gray-800">
        <div className="h-1 w-24 rounded-full bg-gray-300 dark:bg-gray-600" />
      </div>
    </div>
  );
}
