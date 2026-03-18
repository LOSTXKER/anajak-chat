"use client";

import { format } from "date-fns";
import { FileText, CheckCheck } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { Message } from "@/app/(dashboard)/inbox/types";

export interface MessageBubbleProps {
  message: Message;
  contactName: string;
  contactAvatar?: string;
}

export function MessageBubble({ message, contactName, contactAvatar }: MessageBubbleProps) {
  const isContact = message.senderType === "contact";
  const isSystem = message.senderType === "system";
  const isBot = message.senderType === "bot";

  if (isSystem) {
    return (
      <div className="flex justify-center py-1">
        <span className="text-xs text-muted-foreground text-center italic">
          {message.content}
        </span>
      </div>
    );
  }

  if (isBot) {
    return (
      <div className="flex gap-2 justify-start">
        <Avatar className="h-7 w-7 shrink-0 self-end">
          <AvatarFallback className="text-xs bg-zinc-200 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300">B</AvatarFallback>
        </Avatar>
        <div className="max-w-[70%]">
          <div className="rounded-2xl rounded-bl-sm bg-card border border-border px-3 py-2 text-sm">
            <p className="whitespace-pre-wrap break-words">{message.content}</p>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground text-left">
            {format(new Date(message.createdAt), "HH:mm")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex gap-2", isContact ? "justify-start" : "justify-end")}>
      {isContact && (
        <Avatar className="h-7 w-7 shrink-0 self-end">
          <AvatarImage src={contactAvatar} />
          <AvatarFallback className="text-xs">{contactName.charAt(0)}</AvatarFallback>
        </Avatar>
      )}
      <div className={cn("max-w-[70%]", isContact ? "items-start" : "items-end")}>
        <div
          className={cn(
            "rounded-2xl px-3 py-2 text-sm",
            isContact
              ? "rounded-bl-sm bg-card border border-border text-foreground"
              : "rounded-br-sm bg-accent text-accent-foreground"
          )}
        >
          {message.contentType === "image" && message.mediaUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={message.mediaUrl}
              alt="image"
              className="max-w-[200px] rounded-lg"
              loading="lazy"
            />
          ) : message.contentType === "file" && message.mediaUrl ? (
            <a
              href={message.mediaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 underline"
            >
              <FileText className="h-4 w-4" />
              ดาวน์โหลดไฟล์
            </a>
          ) : (
            <p className="whitespace-pre-wrap break-words">{message.content}</p>
          )}
        </div>
        <p
          className={cn(
            "mt-0.5 text-xs text-muted-foreground",
            isContact ? "text-left" : "text-right"
          )}
        >
          {format(new Date(message.createdAt), "HH:mm")}
          {!isContact && <CheckCheck className="ml-1 inline h-3 w-3" />}
        </p>
      </div>
    </div>
  );
}
