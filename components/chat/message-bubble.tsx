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
      <div className="flex gap-2.5 justify-start group/bubble">
        <Avatar className="rounded-full h-8 w-8 shrink-0 self-end">
          <AvatarFallback className="rounded-full text-xs font-semibold bg-muted text-muted-foreground">AI</AvatarFallback>
        </Avatar>
        <div className="max-w-[75%]">
          <div className="rounded-2xl rounded-bl-md bg-muted/50 border border-border px-4 py-3 text-sm shadow-sm dark:bg-muted dark:border-border">
            <p className="whitespace-pre-wrap break-words leading-relaxed">{message.content}</p>
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground text-left">
            {format(new Date(message.createdAt), "HH:mm")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex gap-2.5 group/bubble", isContact ? "justify-start" : "justify-end")}>
      {isContact && (
        <Avatar className="rounded-full h-8 w-8 shrink-0 self-end">
          <AvatarImage src={contactAvatar} className="rounded-full" />
          <AvatarFallback className="rounded-full text-xs font-semibold bg-primary/10 text-primary">{contactName.charAt(0)}</AvatarFallback>
        </Avatar>
      )}
      <div className={cn("max-w-[75%]", isContact ? "items-start" : "items-end")}>
        <div
          className={cn(
            "px-4 py-3 text-sm transition-all duration-200",
            isContact
              ? "rounded-2xl rounded-bl-md bg-card border border-border text-foreground shadow-sm hover:shadow-md"
              : "rounded-2xl rounded-br-md bg-primary text-primary-foreground"
          )}
        >
          {message.contentType === "image" && message.mediaUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={message.mediaUrl}
              alt="image"
              className="max-w-[300px] rounded-lg"
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
            <p className="whitespace-pre-wrap break-words leading-relaxed">{message.content}</p>
          )}
        </div>
        <p
          className={cn(
            "mt-1.5 text-xs text-muted-foreground",
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
