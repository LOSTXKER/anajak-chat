"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onChange: (page: number) => void;
  className?: string;
}

export function Pagination({ page, totalPages, total, pageSize, onChange, className }: PaginationProps) {
  if (totalPages <= 1) return null;

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  return (
    <div className={`flex items-center justify-between text-sm ${className ?? ""}`}>
      <span className="text-xs text-muted-foreground">
        แสดง {start}–{end} จาก {total} รายการ
      </span>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7 rounded-md transition-colors"
          onClick={() => onChange(Math.max(page - 1, 1))}
          disabled={page === 1}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="px-2 text-xs">{page}/{totalPages}</span>
        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7 rounded-md transition-colors"
          onClick={() => onChange(Math.min(page + 1, totalPages))}
          disabled={page === totalPages}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
