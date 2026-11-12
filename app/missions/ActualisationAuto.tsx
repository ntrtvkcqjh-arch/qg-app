"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** Recharge la page toutes les 20 s tant qu'une mission est en cours. */
export default function ActualisationAuto({ active }: { active: boolean }) {
  const router = useRouter();
  useEffect(() => {
    if (!active) return;
    const t = setInterval(() => router.refresh(), 20_000);
    return () => clearInterval(t);
  }, [active, router]);
  return active ? <p className="meta">● En direct : mise à jour toutes les 20 secondes.</p> : null;
}
