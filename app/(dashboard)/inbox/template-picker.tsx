"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Zap, Loader2, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface Template {
  id: string;
  name: string;
  content: string;
  category: string;
  shortcut: string | null;
}

interface TemplatePickerProps {
  onSelect: (content: string) => void;
  onClose: () => void;
  contactName?: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  greeting: "text-blue-600",
  pricing: "text-purple-600",
  shipping: "text-orange-600",
  closing: "text-gray-600",
  custom: "text-green-600",
};

export function TemplatePicker({ onSelect, onClose, contactName }: TemplatePickerProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    searchRef.current?.focus();
    fetchTemplates("");
  }, []);

  async function fetchTemplates(q: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/templates?search=${encodeURIComponent(q)}`);
      if (res.ok) {
        setTemplates(await res.json());
        setActiveIndex(0);
      }
    } finally {
      setLoading(false);
    }
  }

  function handleSearchChange(v: string) {
    setSearch(v);
    fetchTemplates(v);
  }

  function substituteVariables(content: string): string {
    return content
      .replace(/\{customer_name\}/g, contactName ?? "ลูกค้า")
      .replace(/\{channel_name\}/g, "")
      .replace(/\{order_id\}/g, "");
  }

  function handleSelect(t: Template) {
    onSelect(substituteVariables(t.content));
    // Increment usage
    fetch(`/api/templates/${t.id}`, { method: "POST" }).catch((e) => console.error("[Templates] usage increment error:", e));
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, templates.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (templates[activeIndex]) handleSelect(templates[activeIndex]);
    } else if (e.key === "Escape") {
      onClose();
    }
  }

  return (
    <div className="mb-2 rounded-lg border bg-background shadow-lg">
      {/* Header */}
      <div className="flex items-center gap-2 border-b px-3 py-2">
        <Zap className="h-4 w-4 text-yellow-500" />
        <span className="text-sm font-medium">Quick Reply Templates</span>
        <button onClick={onClose} className="ml-auto">
          <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
        </button>
      </div>

      {/* Search */}
      <div className="border-b px-3 py-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={searchRef}
            className="h-7 pl-8 text-sm"
            placeholder="ค้นหา template..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>
      </div>

      {/* List */}
      <div ref={listRef} className="max-h-48 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        ) : templates.length === 0 ? (
          <div className="py-6 text-center text-sm text-muted-foreground">ไม่พบ template</div>
        ) : (
          templates.map((t, i) => (
            <button
              key={t.id}
              onClick={() => handleSelect(t)}
              className={cn(
                "w-full px-3 py-2 text-left transition-colors hover:bg-muted",
                i === activeIndex && "bg-muted"
              )}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium truncate">{t.name}</span>
                {t.shortcut && (
                  <code className={cn("text-xs shrink-0", CATEGORY_COLORS[t.category])}>
                    /{t.shortcut}
                  </code>
                )}
              </div>
              <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{t.content}</p>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
