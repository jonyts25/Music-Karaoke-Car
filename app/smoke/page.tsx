"use client";

import { useState } from "react";
import { useIsClient } from "@/lib/useIsClient";

export default function SmokePage() {
  const [count, setCount] = useState(0);
  const hydrated = useIsClient();

  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-4 p-8">
      <p className="text-2xl font-semibold">Smoke OK</p>
      <p className="text-sm text-muted">
        JS hidratado:{" "}
        <span className="font-mono font-semibold text-foreground">
          {hydrated ? "sí" : "no"}
        </span>
      </p>
      <button
        type="button"
        onClick={() => setCount((c) => c + 1)}
        className="inline-flex min-h-12 min-w-32 items-center justify-center rounded-xl border border-border bg-surface px-6 text-lg font-medium transition-colors hover:bg-border/40"
      >
        {count}
      </button>
      <a
        href="/js-smoke.html"
        className="text-sm text-muted underline hover:text-foreground"
      >
        Probar JS sin React
      </a>
    </div>
  );
}
