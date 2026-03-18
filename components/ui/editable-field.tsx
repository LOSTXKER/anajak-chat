"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface EditableFieldProps {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  placeholder: string;
  type?: string;
  onSave: (value: string) => void;
}

export function EditableField({
  label,
  value,
  icon: Icon,
  placeholder,
  type = "text",
  onSave,
}: EditableFieldProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  function handleBlur() {
    setEditing(false);
    if (draft !== value) onSave(draft);
  }

  if (editing) {
    return (
      <div className="space-y-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <Input
          ref={inputRef}
          type={type}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleBlur();
            if (e.key === "Escape") { setDraft(value); setEditing(false); }
          }}
          className="h-7 text-xs"
          placeholder={placeholder}
        />
      </div>
    );
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className="w-full text-left group space-y-0.5"
    >
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="flex items-center gap-1.5">
        <Icon className="h-3 w-3 text-muted-foreground shrink-0" />
        <span className={cn("text-xs truncate", value ? "text-foreground" : "text-muted-foreground italic")}>
          {value || placeholder}
        </span>
      </div>
    </button>
  );
}
