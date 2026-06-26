"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { RefreshCw } from "lucide-react";

export function MapRefreshButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      onClick={() => {
        startTransition(() => {
          router.refresh();
        });
      }}
      className="inline-flex min-h-10 items-center justify-center gap-2 rounded-2xl border border-[var(--app-border)] bg-white px-4 text-xs font-bold text-[var(--app-text-soft)] transition hover:bg-[var(--app-primary-soft)] hover:text-[var(--app-primary)] disabled:cursor-wait disabled:opacity-70 dark:bg-white/5"
      disabled={isPending}
    >
      <RefreshCw className={`h-3.5 w-3.5 ${isPending ? "animate-spin" : ""}`} />
      Atualizar dados
    </button>
  );
}
