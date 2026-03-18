import { cn } from "@/lib/utils";

function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-zinc-100 dark:bg-card", className)} />;
}

export function SkeletonCard() {
  return (
    <div className="rounded-xl border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-4 w-4 rounded" />
      </div>
      <Skeleton className="h-7 w-24" />
      <Skeleton className="h-3 w-32" />
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="rounded-xl border overflow-hidden">
      <div className="bg-muted/30 px-3 py-2.5 flex gap-4">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-3 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="border-t px-3 py-3 flex gap-4">
          {Array.from({ length: cols }).map((_, j) => (
            <Skeleton key={j} className="h-3 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonConversation() {
  return (
    <div className="flex items-start gap-3 rounded-lg p-3">
      <Skeleton className="h-10 w-10 rounded-full shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="flex items-center justify-between">
          <Skeleton className="h-3.5 w-28" />
          <Skeleton className="h-3 w-12" />
        </div>
        <Skeleton className="h-3 w-full" />
      </div>
    </div>
  );
}

export function SkeletonKpiRow({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export { Skeleton };
