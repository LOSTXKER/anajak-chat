import { toast as sonnerToast } from "sonner";

interface ToastOptions {
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
  duration?: number;
}

function toast(options: ToastOptions | string) {
  if (typeof options === "string") {
    sonnerToast(options);
    return;
  }
  const { title, description, variant, duration } = options;
  if (variant === "destructive") {
    sonnerToast.error(title ?? "Error", {
      description,
      duration: duration ?? 4000,
    });
  } else {
    sonnerToast.success(title, {
      description,
      duration: duration ?? 3000,
    });
  }
}

export function useToast() {
  return { toast };
}
