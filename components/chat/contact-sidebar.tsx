"use client";

import { User, Tag } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Conversation } from "@/app/(dashboard)/inbox/types";

export interface ContactSidebarProps {
  conversation: Conversation;
}

export function ContactSidebar({ conversation }: ContactSidebarProps) {
  const { contact } = conversation;
  const displayName = contact.displayName ?? contact.platformId;

  return (
    <div className="hidden w-64 shrink-0 flex-col border-l bg-card lg:flex overflow-y-auto">
      <div className="p-4">
        <div className="flex flex-col items-center text-center mb-4">
          <Avatar className="h-14 w-14 mb-2">
            <AvatarImage src={contact.avatarUrl ?? undefined} />
            <AvatarFallback className="text-base">{displayName.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <p className="font-medium text-sm">{displayName}</p>
          <p className="text-xs text-muted-foreground capitalize">{contact.platform}</p>
        </div>

        <div className="space-y-3">
          {contact.tags.length > 0 && (
            <div>
              <div className="mb-1.5 flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                <Tag className="h-3 w-3" />
                Tags
              </div>
              <div className="flex flex-wrap gap-1">
                {contact.tags.map((tag) => (
                  <span key={tag} className="bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 rounded-full text-xs px-2 py-0.5">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div>
            <div className="mb-1.5 flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
              <User className="h-3 w-3" />
              Platform ID
            </div>
            <p className="text-xs font-mono break-all text-muted-foreground">{contact.platformId}</p>
          </div>

          {conversation.sourceAdId && (
            <div>
              <div className="mb-1.5 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Ad Source</div>
              <Badge variant="outline" className="text-xs">
                {conversation.sourceAdId}
              </Badge>
            </div>
          )}

          {conversation.aiSummary && (
            <div>
              <div className="mb-1.5 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">AI Summary</div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {conversation.aiSummary}
              </p>
            </div>
          )}

          {conversation.aiSentiment && (
            <div>
              <div className="mb-1.5 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Sentiment</div>
              <Badge
                variant="outline"
                className={cn(
                  "text-xs capitalize",
                  conversation.aiSentiment === "positive" && "border-green-200 text-green-700",
                  conversation.aiSentiment === "negative" && "border-red-200 text-red-700",
                  conversation.aiSentiment === "neutral" && "border-gray-200 text-gray-700"
                )}
              >
                {conversation.aiSentiment}
              </Badge>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
