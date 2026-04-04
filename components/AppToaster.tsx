"use client";

import { useEffect, useState } from "react";

type ToastType = "info" | "error" | "success";

type ToastItem = {
  id: string;
  message: string;
  type: ToastType;
};

type ToastEventDetail = {
  message: string;
  type?: ToastType;
};

const STYLE_BY_TYPE: Record<ToastType, string> = {
  info: "border-olive/20 bg-white text-olive",
  success: "border-moss/30 bg-moss/10 text-moss",
  error: "border-blossom-dark/30 bg-blossom/10 text-blossom-dark",
};

export default function AppToaster() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    function onToast(event: Event) {
      const custom = event as CustomEvent<ToastEventDetail>;
      const detail = custom.detail;
      if (!detail?.message) return;

      const id = crypto.randomUUID();
      const type = detail.type ?? "info";

      setToasts((prev) => [...prev, { id, message: detail.message, type }]);

      window.setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3200);
    }

    window.addEventListener("app-toast", onToast as EventListener);
    return () => window.removeEventListener("app-toast", onToast as EventListener);
  }, []);

  return (
    <div className="fixed bottom-4 right-4 z-[80] flex w-[90vw] max-w-sm flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto rounded-xl border px-4 py-3 shadow-card backdrop-blur-sm ${STYLE_BY_TYPE[toast.type]}`}
          role="status"
          aria-live="polite"
        >
          <p className="text-sm leading-tight">{toast.message}</p>
        </div>
      ))}
    </div>
  );
}
