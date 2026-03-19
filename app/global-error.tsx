"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
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
    <html lang="th">
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
          <h1 className="text-2xl font-bold text-foreground">เกิดข้อผิดพลาด</h1>
          <p className="text-muted-foreground max-w-md">
            เกิดข้อผิดพลาดที่ไม่คาดคิด กรุณาลองใหม่อีกครั้ง
          </p>
          {error.digest && (
            <p className="text-xs text-muted-foreground/70">Error ID: {error.digest}</p>
          )}
          <Button onClick={reset}>
            ลองใหม่
          </Button>
        </div>
      </body>
    </html>
  );
}
