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
      <div className="border-t px-4 py-3">
        <Button className="w-full h-10" onClick={onStartChat} disabled={starting}>
          {starting ? "กำลังเริ่ม..." : "เริ่มแชท"}
        </Button>
      </div>
    );
  }

  if (status === "resolved") {
    return (
      <div className="flex items-center justify-between border-t px-4 py-2.5">
        <span className="text-sm text-muted-foreground">
          แชทนี้เสร็จสิ้นแล้ว
        </span>
        <Button variant="outline" size="sm" className="h-9 px-4 text-sm font-medium" onClick={onReopen} disabled={starting}>
          <RotateCcw className="mr-1.5 h-4 w-4" />
          เปิดอีกครั้ง
        </Button>
      </div>
    );
  }

  if (status === "open" && isLockedByOther) {
    return (
      <div className="flex items-center gap-2 border-t px-4 py-2.5">
        <Lock className="h-4 w-4 text-muted-foreground shrink-0" />
        <span className="text-sm text-muted-foreground">
          ดูแลโดย {lockedByName}
        </span>
      </div>
    );
  }

  return (
    <>
      {showNoteInput && (
        <div className="border-t bg-yellow-50 p-3 dark:bg-yellow-950/40 dark:border-yellow-700/50">
          <div className="flex gap-2">
            <Textarea
              placeholder="เขียน internal note..."
              className="min-h-[60px] resize-none bg-yellow-50 text-sm border-yellow-200 focus-visible:ring-yellow-400 dark:bg-yellow-950/40 dark:border-yellow-700/50 dark:text-yellow-100"
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

      {/* Action bar */}
      <div className="flex items-center justify-between border-t px-3 py-1.5">
        <div className="flex items-center gap-2">
          {onResolve && (
            <Button
              variant="outline"
              size="sm"
              className="h-7 gap-1.5 rounded-full border-green-200 bg-green-50 px-3 text-xs font-medium text-green-700 hover:bg-green-100 hover:border-green-300 dark:border-green-700/50 dark:bg-green-950/40 dark:text-green-400 dark:hover:bg-green-950/60"
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
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setShowTemplates(!showTemplates)}
            aria-label="เลือก template"
            title="เลือก template"
          >
            <SmilePlus className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className={cn("h-7 w-7 text-muted-foreground hover:text-foreground transition-colors", showNoteInput && "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300")}
            onClick={() => setShowNoteInput(!showNoteInput)}
            aria-label="เพิ่ม note"
            title="Internal note"
          >
            <StickyNote className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setShowMediaPicker(true)}
            aria-label="แนบสื่อ"
            title="แนบไฟล์"
          >
            <Paperclip className="h-4 w-4" />
          </Button>
        </div>
      </div>

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

      {/* Input area */}
      <div className="flex items-end gap-2 border-t px-3 py-2">
        <div className="relative flex-1">
          <Textarea
            ref={textareaRef}
            placeholder="พิมพ์ข้อความ..."
            className="min-h-[40px] max-h-[120px] resize-none rounded-xl text-sm"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>
        <Button
          size="icon"
          className="mb-0.5 h-9 w-9 shrink-0 rounded-full bg-accent text-accent-foreground hover:bg-accent/90"
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
