import { MessageSquare } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-20">
      <div className="w-full max-w-[380px]">
        <div className="mb-10 flex flex-col items-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-foreground">
            <MessageSquare className="h-5 w-5 text-background" />
          </div>
          <p className="mt-3 text-sm text-muted-foreground">Anajak Chat</p>
        </div>
        {children}
      </div>
    </div>
  );
}
