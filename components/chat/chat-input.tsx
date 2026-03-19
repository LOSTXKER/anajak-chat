"use client";

import { useState, useRef, useEffect } from "react";
import {
  Send,
  Paperclip,
  Check,
  Loader2,
  X,
  StickyNote,
  CheckCircle2,
  RotateCcw,
  Lock,
  SmilePlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { TemplatePicker } from "@/app/(dashboard)/inbox/template-picker";
import { MediaPickerModal } from "@/app/(dashboard)/inbox/media-picker";
import { SlaTimer } from "@/app/(dashboard)/inbox/sla-timer";
import type { Conversation } from "@/app/(dashboard)/inbox/types";

export interface ChatInputProps {
  onSendMessage: (content?: string, mediaUrl?: string, mediaFileId?: string) => Promise<void>;
  onSaveNote: (content: string) => Promise<void>;
  conversation: Conversation;
  status: "pending" | "open" | "resolved";
  isLockedByOther: boolean;
  lockedByName?: string;
  onStartChat?: () => void;
  onResolve?: () => void;
  onReopen?: () => void;
  starting?: boolean;
  externalInput?: string;
  onExternalInputConsumed?: () => void;
}

export function ChatInput({
  onSendMessage,
  onSaveNote,
  conversation,
  status,
  isLockedByOther,
  lockedByName,
  onStartChat,
  onResolve,
  onReopen,
  starting,
  externalInput,
  onExternalInputConsumed,
}: ChatInputProps) {
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [noteInput, setNoteInput] = useState("");
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [savingNote, setSavingNote] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (externalInput) {
      setInput(externalInput);
      onExternalInputConsumed?.();
      textareaRef.current?.focus();
    }
  }, [externalInput, onExternalInputConsumed]);

  async function handleSend(content?: string, mediaUrl?: string, mediaFileId?: string) {
    const text = content ?? input.trim();
    if (!text && !mediaUrl) return;

    setSending(true);
    try {
      await onSendMessage(text || undefined, mediaUrl, mediaFileId);
      if (!mediaUrl) setInput("");
    } finally {
      setSending(false);
    }
  }

  async function handleSaveNote() {
    if (!noteInput.trim()) return;
    setSavingNote(true);
    try {
      await onSaveNote(noteInput);
      setNoteInput("");
      setShowNoteInput(false);
    } finally {
      setSavingNote(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
    if (e.key === "/" && input === "") {
      setShowTemplates(true);
    }
  }

  if (status === "pending") {
    return (
      <div className="px-4 py-3">
        <Button className="w-full h-12 rounded-lg text-base font-semibold" onClick={onStartChat} disabled={starting}>
          {starting ? "กำลังเริ่ม..." : "เริ่มแชท"}
        </Button>
      </div>
    );
  }

  if (status === "resolved") {
    return (
      <div className="flex items-center justify-between mx-3 mb-3 rounded-xl border bg-card/60 px-5 py-3 shadow-sm">
        <span className="text-sm text-muted-foreground font-medium">
          แชทนี้เสร็จสิ้นแล้ว
        </span>
        <Button variant="outline" onClick={onReopen} disabled={starting}>
          <RotateCcw className="mr-1.5 h-4 w-4" />
          เปิดอีกครั้ง
        </Button>
      </div>
    );
  }

  if (status === "open" && isLockedByOther) {
    return (
      <div className="flex items-center gap-2 mx-3 mb-3 rounded-xl border bg-card/60 px-5 py-3 shadow-sm">
        <Lock className="h-4 w-4 text-muted-foreground shrink-0" />
        <span className="text-sm text-muted-foreground font-medium">
          ดูแลโดย {lockedByName}
        </span>
      </div>
    );
  }

  return (
    <>
      {showNoteInput && (
        <div className="border-t bg-muted p-3 border-border">
          <div className="flex gap-2">
            <Textarea
              placeholder="เขียน internal note..."
              className="min-h-[60px] resize-none bg-muted text-sm border-border focus-visible:ring-ring"
              value={noteInput}
              onChange={(e) => setNoteInput(e.target.value)}
            />
            <div className="flex flex-col gap-2">
              <Button size="sm" onClick={handleSaveNote} disabled={savingNote || !noteInput.trim()}>
                {savingNote ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowNoteInput(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Template picker */}
      {showTemplates && (
        <div className="border-t px-3 py-2">
          <TemplatePicker
            onSelect={(content) => {
              setInput(content);
              setShowTemplates(false);
              textareaRef.current?.focus();
            }}
            onClose={() => setShowTemplates(false)}
          />
        </div>
      )}

      <div className="mx-3 mb-3 rounded-xl border bg-card/80 shadow-sm">
        {/* Action bar */}
        <div className="flex items-center justify-between px-4 py-2">
          <div className="flex items-center gap-2">
            {onResolve && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 rounded-full border-primary/30 bg-primary/10 text-xs font-semibold text-primary hover:bg-primary/15 hover:border-primary/40"
                onClick={onResolve}
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                เสร็จสิ้น
              </Button>
            )}
            <SlaTimer conversation={conversation} variant="bar" />
          </div>
          <div className="flex items-center gap-0.5">
            <Button
              size="icon-sm"
              variant="ghost"
              className="text-muted-foreground hover:text-foreground"
              onClick={() => setShowTemplates(!showTemplates)}
              aria-label="เลือก template"
              title="เลือก template"
            >
              <SmilePlus className="h-4 w-4" />
            </Button>
            <Button
              size="icon-sm"
              variant="ghost"
              className={cn("text-muted-foreground hover:text-foreground", showNoteInput && "bg-muted text-muted-foreground")}
              onClick={() => setShowNoteInput(!showNoteInput)}
              aria-label="เพิ่ม note"
              title="Internal note"
            >
              <StickyNote className="h-4 w-4" />
            </Button>
            <Button
              size="icon-sm"
              variant="ghost"
              className="text-muted-foreground hover:text-foreground"
              onClick={() => setShowMediaPicker(true)}
              aria-label="แนบสื่อ"
              title="แนบไฟล์"
            >
              <Paperclip className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Input area */}
        <div className="flex items-end gap-2 px-3 pb-3">
          <div className="relative flex-1">
            <Textarea
              ref={textareaRef}
              placeholder="พิมพ์ข้อความ..."
              className="min-h-[48px] max-h-[140px] resize-none rounded-lg border-0 bg-transparent text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>
          <Button
            size="icon-lg"
            className="mb-0.5 shrink-0"
            onClick={() => handleSend()}
            disabled={sending || !input.trim()}
            aria-label="ส่งข้อความ"
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {showMediaPicker && (
        <MediaPickerModal
          onSelect={(file) => {
            handleSend(undefined, file.url, file.id);
            setShowMediaPicker(false);
          }}
          onClose={() => setShowMediaPicker(false)}
        />
      )}
    </>
  );
}
