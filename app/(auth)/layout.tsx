import { MessageSquare } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-muted/30 px-4 py-20 dark:bg-background">
      <div className="relative w-full max-w-[420px]">
        <div className="mb-8 flex flex-col items-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/20">
            <MessageSquare className="h-5 w-5 text-primary-foreground" />
          </div>
          <p className="mt-3 text-base font-semibold tracking-tight">Anajak Chat</p>
        </div>
        <div className="rounded-2xl border bg-card p-8 shadow-xl shadow-black/[0.03] sm:p-10">
          {children}
        </div>
      </div>
    </div>
  );
}
