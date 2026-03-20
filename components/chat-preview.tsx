"use client";

import { useEffect, useRef, useState } from "react";
import {
  Bot,
  ImageIcon,
  Play,
  Smile,
  FileIcon,
  MessageSquare,
  User,
  Code2,
  Eye,
  Copy,
  Check,
} from "lucide-react";
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

interface ChatPreviewProps {
  messages: PreviewMessage[];
  quickReplies?: PreviewQuickReply[];
  platform?: "_default" | "line" | "facebook" | "instagram";
  botName?: string;
  userMessage?: string;
}

// ─── Bubble Components ───────────────────────────────────────────────────────

function TextBubble({ msg }: { msg: PreviewMessage }) {
  const text = msg.text?.trim();
  return (
    <span className="inline-block max-w-full rounded-2xl rounded-tl-sm bg-muted px-3.5 py-2.5 text-sm leading-relaxed">
      {text || (
        <span className="italic text-muted-foreground">ข้อความว่าง...</span>
      )}
      {msg.buttons && msg.buttons.length > 0 && (
        <span className="mt-2 flex flex-col gap-1.5 border-t pt-2">
          {msg.buttons.map((btn, i) => (
            <span
              key={i}
              className="block rounded-lg bg-primary/10 px-3 py-1.5 text-center text-xs font-medium text-primary"
            >
              {btn.label || "ปุ่ม"}
            </span>
          ))}
        </span>
      )}
    </span>
  );
}

function ImageBubble({ msg }: { msg: PreviewMessage }) {
  return (
    <div className="w-56 max-w-full overflow-hidden rounded-2xl rounded-tl-sm">
      {msg.imageUrl ? (
        <img
          src={msg.imageUrl}
          alt=""
          className="h-auto w-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
      ) : (
        <div className="flex h-40 w-full items-center justify-center bg-muted">
          <ImageIcon className="h-8 w-8 text-muted-foreground/30" />
        </div>
      )}
    </div>
  );
}

function CardBubble({ msg }: { msg: PreviewMessage }) {
  return (
    <div className="w-64 max-w-full overflow-hidden rounded-2xl rounded-tl-sm border bg-card">
      {msg.cardImageUrl ? (
        <img
          src={msg.cardImageUrl}
          alt=""
          className="h-32 w-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
      ) : (
        <div className="flex h-32 w-full items-center justify-center bg-muted">
          <ImageIcon className="h-8 w-8 text-muted-foreground/30" />
        </div>
      )}
      <div className="px-3.5 py-2.5">
        <p className="text-sm font-semibold">
          {msg.cardTitle || (
            <span className="italic text-muted-foreground">
              หัวข้อการ์ด...
            </span>
          )}
        </p>
        {(msg.cardText || !msg.cardTitle) && (
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            {msg.cardText || <span className="italic">รายละเอียด...</span>}
          </p>
        )}
      </div>
      {msg.cardButtons && msg.cardButtons.length > 0 && (
        <div className="border-t">
          {msg.cardButtons.map((btn, i) => (
            <div
              key={i}
              className="border-b px-3.5 py-2 text-center text-xs font-medium text-primary last:border-b-0"
            >
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
    <div className="flex h-24 w-24 items-center justify-center">
      <div className="flex flex-col items-center gap-1 text-muted-foreground">
        <Smile className="h-12 w-12" />
        {msg.stickerPackageId && (
          <span className="text-[10px]">
            {msg.stickerPackageId}/{msg.stickerId}
          </span>
        )}
      </div>
    </div>
  );
}

function VideoBubble({ msg }: { msg: PreviewMessage }) {
  return (
    <div className="w-56 max-w-full overflow-hidden rounded-2xl rounded-tl-sm">
      <div className="relative">
        {msg.thumbnailUrl ? (
          <img
            src={msg.thumbnailUrl}
            alt=""
            className="h-36 w-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        ) : (
          <div className="flex h-36 w-full items-center justify-center bg-muted" />
        )}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black/50 backdrop-blur-sm">
            <Play className="h-5 w-5 fill-white text-white" />
          </div>
        </div>
      </div>
    </div>
  );
}

function FileBubble({ msg }: { msg: PreviewMessage }) {
  return (
    <span className="inline-flex max-w-full items-center gap-2.5 rounded-2xl rounded-tl-sm bg-muted px-3.5 py-2.5">
      <FileIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
      <span className="truncate text-sm">{msg.fileName || "ไฟล์แนบ"}</span>
    </span>
  );
}

function BotBubble({ msg }: { msg: PreviewMessage }) {
  switch (msg.type) {
    case "text":
      return <TextBubble msg={msg} />;
    case "image":
      return <ImageBubble msg={msg} />;
    case "card":
      return <CardBubble msg={msg} />;
    case "sticker":
      return <StickerBubble msg={msg} />;
    case "video":
      return <VideoBubble msg={msg} />;
    case "file":
      return <FileBubble msg={msg} />;
    default:
      return null;
  }
}

// ─── Code View ───────────────────────────────────────────────────────────────

function CodeView({
  messages,
  quickReplies,
}: {
  messages: PreviewMessage[];
  quickReplies: PreviewQuickReply[];
}) {
  const [copied, setCopied] = useState(false);
  const data = {
    messages,
    quickReplies: quickReplies.length > 0 ? quickReplies : undefined,
  };
  const json = JSON.stringify(data, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(json);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative h-full">
      <button
        onClick={handleCopy}
        className="absolute right-3 top-3 z-10 flex items-center gap-1.5 rounded-lg bg-muted px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/80"
      >
        {copied ? (
          <Check className="h-3.5 w-3.5 text-emerald-500" />
        ) : (
          <Copy className="h-3.5 w-3.5" />
        )}
        {copied ? "คัดลอกแล้ว" : "คัดลอก"}
      </button>
      <pre className="h-full overflow-auto rounded-lg bg-muted/30 p-4 font-mono text-xs leading-relaxed text-muted-foreground">
        <code>{json}</code>
      </pre>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function ChatPreview({
  messages,
  quickReplies = [],
  botName = "Bot",
  userMessage,
}: ChatPreviewProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<"preview" | "code">("preview");

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, quickReplies, userMessage]);

  const isEmpty = messages.length === 0 && !userMessage;

  return (
    <div className="flex h-full flex-col">
      {/* Tab bar */}
      <div className="flex items-center justify-between border-b px-4">
        <div className="flex">
          <button
            onClick={() => setView("preview")}
            className={cn(
              "flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-xs font-medium transition-colors",
              view === "preview"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <Eye className="h-3.5 w-3.5" />
            ตัวอย่าง
          </button>
          <button
            onClick={() => setView("code")}
            className={cn(
              "flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-xs font-medium transition-colors",
              view === "code"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <Code2 className="h-3.5 w-3.5" />
            โค้ด
          </button>
        </div>
        <span className="text-[11px] text-muted-foreground">
          {messages.length} ข้อความ
        </span>
      </div>

      {/* Content */}
      {view === "code" ? (
        <div className="flex-1 overflow-hidden p-4">
          <CodeView messages={messages} quickReplies={quickReplies} />
        </div>
      ) : (
        <div className="flex flex-1 flex-col overflow-hidden">
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-5">
            {isEmpty ? (
              <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                <MessageSquare className="h-10 w-10 text-muted-foreground/20" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    ยังไม่มีข้อความ
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground/60">
                    เพิ่มข้อความเพื่อดูตัวอย่าง
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {/* User message */}
                {userMessage && (
                  <div className="flex justify-end gap-2.5">
                    <div className="max-w-[70%] rounded-2xl rounded-tr-sm bg-primary px-3.5 py-2.5 text-sm leading-relaxed text-primary-foreground">
                      {userMessage}
                    </div>
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                      <User className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                )}

                {/* Bot messages */}
                {messages.map((msg, idx) => {
                  const showAvatar =
                    idx === 0 || messages[idx - 1]?.type === "sticker";
                  return (
                    <div key={idx} className="flex gap-2.5">
                      {showAvatar ? (
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                          <Bot className="h-4 w-4 text-primary" />
                        </div>
                      ) : (
                        <div className="w-8 shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        {idx === 0 && (
                          <p className="mb-1 text-[11px] font-medium text-muted-foreground">
                            {botName}
                          </p>
                        )}
                        <BotBubble msg={msg} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick Replies */}
          {quickReplies.length > 0 && (
            <div className="flex flex-wrap gap-2 border-t px-5 py-3">
              {quickReplies.map((qr, idx) => (
                <div
                  key={idx}
                  className="rounded-full border border-primary/30 bg-primary/5 px-3.5 py-1.5 text-xs font-medium text-primary"
                >
                  {qr.label || "Quick Reply"}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
