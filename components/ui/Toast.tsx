"use client";

import { useEffect } from "react";
import { useJeu } from "@/lib/store";

export default function Toast() {
  const toast = useJeu((s) => s.toast);
  const notifier = useJeu((s) => s.notifier);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => notifier(null), Math.min(10000, 3200 + toast.length * 35));
    return () => clearTimeout(t);
  }, [toast, notifier]);
  if (!toast) return null;
  return (
    <div className="toast" role="status">
      {toast}
    </div>
  );
}
