"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  User,
  Tag,
  Phone,
  Mail,
  Plus,
  X,
  MoreVertical,
  FileSpreadsheet,
  FolderArchive,
  Ban,
  Sparkles,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { EditableField } from "@/components/ui/editable-field";
import { CollapsibleSection } from "@/components/ui/collapsible-section";
import { AiCopilotPanel } from "@/components/chat/ai-copilot-panel";
import type { Conversation } from "@/app/(dashboard)/inbox/types";

export interface ContactSidebarProps {
  conversation: Conversation;
  onSpam?: () => void;
  onBlock?: () => void;
  onInsertReply?: (text: string) => void;
}

export function ContactSidebar({ conversation, onSpam, onBlock, onInsertReply }: ContactSidebarProps) {
  const { contact } = conversation;
  const displayName = contact.displayName ?? contact.platformId;

  const [name, setName] = useState(contact.displayName ?? "");
  const [phone, setPhone] = useState(contact.phone ?? "");
  const [email, setEmail] = useState(contact.email ?? "");
  const [tags, setTags] = useState<string[]>(contact.tags);
  const [tagInput, setTagInput] = useState("");
  const [tagSuggestions, setTagSuggestions] = useState<string[]>([]);
  const [showTagInput, setShowTagInput] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [editing, setEditing] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setName(contact.displayName ?? "");
    setPhone(contact.phone ?? "");
    setEmail(contact.email ?? "");
    setTags(contact.tags);
  }, [contact]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMenu(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const saveField = useCallback(
    async (field: string, value: unknown) => {
      await fetch(`/api/contacts/${contact.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });
    },
    [contact.id]
  );

  async function addTag(tag: string) {
    const trimmed = tag.trim();
    if (!trimmed || tags.includes(trimmed)) return;
    const newTags = [...tags, trimmed];
    setTags(newTags);
    setTagInput("");
    setShowTagInput(false);
    await saveField("tags", newTags);
  }

  async function removeTag(tag: string) {
    const newTags = tags.filter((t) => t !== tag);
    setTags(newTags);
    await saveField("tags", newTags);
  }

  async function fetchTagSuggestions() {
    const res = await fetch("/api/contacts/tags");
    if (res.ok) {
      const data = (await res.json()) as string[];
      setTagSuggestions(data);
    }
  }

  function handleExport(format: string) {
    setShowMenu(false);
    window.open(`/api/conversations/${conversation.id}/export?format=${format}`, "_blank");
  }

  return (
    <div className="hidden w-80 shrink-0 flex-col border-l bg-card lg:flex overflow-hidden">
      <Tabs defaultValue="contact" className="flex flex-col h-full gap-0">
        <TabsList className="w-full rounded-none border-b bg-transparent px-2 pt-1.5 pb-0 h-auto shrink-0" variant="line">
          <TabsTrigger value="contact" className="gap-1.5 text-xs px-3 py-1.5">
            <User className="h-3.5 w-3.5" />
            ข้อมูล
          </TabsTrigger>
          <TabsTrigger value="ai" className="gap-1.5 text-xs px-3 py-1.5">
            <Sparkles className="h-3.5 w-3.5" />
            AI Copilot
          </TabsTrigger>
        </TabsList>

        <TabsContent value="contact" className="overflow-y-auto">
          <div className="p-4 space-y-4">
            {/* Header with avatar + menu */}
            <div className="flex flex-col items-center text-center relative">
              <div className="absolute right-0 top-0" ref={menuRef}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setShowMenu(!showMenu)}
                  aria-label="เมนู"
                  aria-expanded={showMenu}
                  aria-haspopup="menu"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
                {showMenu && (
                  <div className="absolute right-0 top-full z-20 mt-1 min-w-44 rounded-lg border bg-popover p-1 shadow-lg" role="menu">
                    <button
                      role="menuitem"
                      onClick={() => handleExport("excel")}
                      className="flex w-full items-center gap-2 rounded px-3 py-1.5 text-left text-sm hover:bg-muted transition-colors"
                    >
                      <FileSpreadsheet className="h-3.5 w-3.5" />
                      ส่งออกแชทเป็น Excel
                    </button>
                    <button
                      role="menuitem"
                      onClick={() => handleExport("zip")}
                      className="flex w-full items-center gap-2 rounded px-3 py-1.5 text-left text-sm hover:bg-muted transition-colors"
                    >
                      <FolderArchive className="h-3.5 w-3.5" />
                      ส่งออกแชทเป็น Zip
                    </button>
                    {(onSpam || onBlock) && (
                      <>
                        <div className="my-1 border-t" />
                        {onSpam && (
                          <button
                            role="menuitem"
                            onClick={() => { setShowMenu(false); onSpam(); }}
                            className="flex w-full items-center gap-2 rounded px-3 py-1.5 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
                          >
                            <Ban className="h-3.5 w-3.5" />
                            สแปม
                          </button>
                        )}
                        {onBlock && (
                          <button
                            role="menuitem"
                            onClick={() => { setShowMenu(false); onBlock(); }}
                            className="flex w-full items-center gap-2 rounded px-3 py-1.5 text-left text-sm text-destructive hover:bg-destructive/10 transition-colors"
                          >
                            <Ban className="h-3.5 w-3.5" />
                            บล็อก
                          </button>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>

              <Avatar className="h-14 w-14 mb-2">
                <AvatarImage src={contact.avatarUrl ?? undefined} />
                <AvatarFallback className="text-base">{displayName.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <p className="font-medium text-sm">{displayName}</p>
              <p className="text-xs text-muted-foreground capitalize">{contact.platform}</p>
            </div>

            {/* Contact Details */}
            <CollapsibleSection
              title="ข้อมูลติดต่อ"
              icon={User}
              action={
                <button
                  onClick={() => setEditing(!editing)}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  {editing ? "เสร็จ" : "แก้ไข"}
                </button>
              }
            >
              <div className="space-y-2 pl-1">
                {editing ? (
                  <>
                    <EditableField label="ชื่อ" value={name} icon={User} placeholder="ใส่ชื่อ..." onSave={(v) => { setName(v); saveField("displayName", v); }} />
                    <EditableField label="เบอร์โทร" value={phone} icon={Phone} placeholder="ใส่เบอร์โทร..." type="tel" onSave={(v) => { setPhone(v); saveField("phone", v); }} />
                    <EditableField label="อีเมล" value={email} icon={Mail} placeholder="ใส่อีเมล..." type="email" onSave={(v) => { setEmail(v); saveField("email", v); }} />
                  </>
                ) : (
                  <>
                    {name && (
                      <div className="flex items-center gap-2 text-xs">
                        <User className="h-3 w-3 text-muted-foreground shrink-0" />
                        <span>{name}</span>
                      </div>
                    )}
                    {phone && (
                      <div className="flex items-center gap-2 text-xs">
                        <Phone className="h-3 w-3 text-muted-foreground shrink-0" />
                        <span>{phone}</span>
                      </div>
                    )}
                    {email && (
                      <div className="flex items-center gap-2 text-xs">
                        <Mail className="h-3 w-3 text-muted-foreground shrink-0" />
                        <span>{email}</span>
                      </div>
                    )}
                    {!name && !phone && !email && (
                      <p className="text-xs text-muted-foreground italic">ยังไม่มีข้อมูล</p>
                    )}
                  </>
                )}
                <div className="pt-1 border-t">
                  <p className="text-xs text-muted-foreground/60 font-mono break-all">{contact.platformId}</p>
                </div>
              </div>
            </CollapsibleSection>

            {/* Tags */}
            <CollapsibleSection
              title="แท็ก"
              icon={Tag}
              action={
                <button
                  onClick={() => { setShowTagInput(true); fetchTagSuggestions(); }}
                  className="text-blue-600 hover:text-blue-700 dark:text-blue-400"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              }
            >
              <div className="space-y-2 pl-1">
                <div className="flex flex-wrap gap-1">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-0.5 bg-muted text-foreground rounded-full text-xs px-2 py-0.5"
                    >
                      {tag}
                      <button onClick={() => removeTag(tag)} className="hover:text-red-500 transition-colors">
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </span>
                  ))}
                  {tags.length === 0 && !showTagInput && (
                    <p className="text-xs text-muted-foreground italic">ยังไม่มีแท็ก</p>
                  )}
                </div>
                {showTagInput && (
                  <div className="space-y-1">
                    <Input
                      autoFocus
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && tagInput.trim()) addTag(tagInput);
                        if (e.key === "Escape") { setShowTagInput(false); setTagInput(""); }
                      }}
                      onBlur={() => { if (!tagInput.trim()) setShowTagInput(false); }}
                      className="h-7 text-xs"
                      placeholder="พิมพ์แท็ก..."
                    />
                    {tagSuggestions.filter((s) => !tags.includes(s) && s.toLowerCase().includes(tagInput.toLowerCase())).length > 0 && (
                      <div className="max-h-24 overflow-y-auto rounded border bg-popover p-1">
                        {tagSuggestions
                          .filter((s) => !tags.includes(s) && s.toLowerCase().includes(tagInput.toLowerCase()))
                          .slice(0, 8)
                          .map((s) => (
                            <button
                              key={s}
                              onClick={() => addTag(s)}
                              className="flex w-full rounded px-2 py-1 text-left text-xs hover:bg-muted transition-colors"
                            >
                              {s}
                            </button>
                          ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CollapsibleSection>

            {/* Ad Source */}
            {conversation.sourceAdId && (
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-1">แหล่งโฆษณา</p>
                <Badge variant="outline" className="text-xs">
                  {conversation.sourceAdId}
                </Badge>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="ai" className="overflow-hidden flex-1">
          <AiCopilotPanel
            conversation={conversation}
            onInsertReply={onInsertReply ?? (() => {})}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
