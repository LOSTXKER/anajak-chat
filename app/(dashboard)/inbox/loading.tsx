import { Skeleton } from "@/components/skeleton";

export default function InboxLoading() {
  return (
    <div className="flex h-full">
      <div className="w-80 border-r flex flex-col">
        <div className="p-3 border-b space-y-2">
          <Skeleton className="h-8 w-full rounded-lg" />
          <div className="flex gap-1">
            <Skeleton className="h-7 w-16 rounded-full" />
            <Skeleton className="h-7 w-16 rounded-full" />
            <Skeleton className="h-7 w-16 rounded-full" />
          </div>
        </div>
        <div className="flex-1 p-2 space-y-1">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-xl">
              <Skeleton className="h-10 w-10 rounded-full shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-40" />
              </div>
              <Skeleton className="h-3 w-10" />
            </div>
          ))}
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center">
        <Skeleton className="h-8 w-48 rounded-lg" />
      </div>
    </div>
  );
}
