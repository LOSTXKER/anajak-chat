import { MessageSquare } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 py-20">
      <div className="absolute inset-0 bg-muted/30 dark:bg-background" />
      <div className="absolute inset-0 bg-glow-primary opacity-60" />
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]" />

      <div className="relative w-full max-w-[420px]">
        <div className="mb-8 flex flex-col items-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/25">
            <MessageSquare className="h-5 w-5 text-primary-foreground" />
          </div>
          <p className="mt-3 text-base font-bold tracking-tight">Anajak Chat</p>
        </div>
        <div className="rounded-2xl border bg-card/80 p-8 shadow-xl shadow-black/5 backdrop-blur-sm sm:p-10">
          {children}
        </div>
      </div>
    </div>
  );
}
