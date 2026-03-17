"use client";

import { useState, useRef } from "react";
import {
  Send,
  Paperclip,
  Check,
  Loader2,
  X,
  StickyNote,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { TemplatePicker } from "@/app/(dashboard)/inbox/template-picker";
import { MediaPickerModal } from "@/app/(dashboard)/inbox/media-picker";

export interface ChatInputProps {
  onSendMessage: (content?: string, mediaUrl?: string, mediaFileId?: string) => Promise<void>;
  onSaveNote: (content: string) => Promise<void>;
}

export function ChatInput({ onSendMessage, onSaveNote }: ChatInputProps) {
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [noteInput, setNoteInput] = useState("");
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [savingNote, setSavingNote] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  return (
    <>
      {showNoteInput && (
        <div className="border-t bg-yellow-50 p-3 dark:bg-yellow-950/40 dark:border-yellow-800">
          <div className="flex gap-2">
            <Textarea
              placeholder="เขียน internal note..."
              className="min-h-[60px] resize-none bg-yellow-50 text-sm border-yellow-200 focus-visible:ring-yellow-400 dark:bg-yellow-950/40 dark:border-yellow-800 dark:text-yellow-100"
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

      <div className="border-t p-3">
        {showTemplates && (
          <TemplatePicker
            onSelect={(content) => {
              setInput(content);
              setShowTemplates(false);
              textareaRef.current?.focus();
            }}
            onClose={() => setShowTemplates(false)}
          />
        )}
        <div className="flex gap-2">
          <div className="relative flex-1 rounded-lg border transition-colors">
            <Textarea
              ref={textareaRef}
              placeholder="พิมพ์ข้อความ... (/ สำหรับ template)"
              className="min-h-[60px] max-h-[120px] resize-none border-0 pr-10 text-sm shadow-none focus-visible:ring-0"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Button
              size="icon"
              className="h-10 w-10 lg:h-8 lg:w-8 bg-accent text-white rounded-md"
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
            <Button
              size="icon"
              variant="ghost"
              className="h-10 w-10 lg:h-8 lg:w-8 text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setShowMediaPicker(true)}
              aria-label="แนบสื่อ"
            >
              <Paperclip className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className={cn("h-10 w-10 lg:h-8 lg:w-8 text-muted-foreground hover:text-foreground transition-colors", showNoteInput && "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300")}
              onClick={() => setShowNoteInput(!showNoteInput)}
              aria-label="เพิ่ม note"
            >
              <StickyNote className="h-4 w-4" />
            </Button>
          </div>
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
