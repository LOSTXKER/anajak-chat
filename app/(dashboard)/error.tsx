"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="rounded-full bg-red-50 p-4 dark:bg-red-950">
        <AlertTriangle className="h-8 w-8 text-red-500 dark:text-red-400" />
      </div>
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">เกิดข้อผิดพลาด</h2>
        <p className="text-sm text-muted-foreground max-w-sm">
          เกิดข้อผิดพลาดขณะโหลดหน้านี้ กรุณาลองใหม่อีกครั้ง
        </p>
        {error.digest && (
          <p className="text-xs text-muted-foreground">Error ID: {error.digest}</p>
        )}
      </div>
      <Button onClick={reset} size="sm" variant="outline">
        <RefreshCw className="mr-2 h-4 w-4" />
        ลองใหม่
      </Button>
    </div>
  );
}
