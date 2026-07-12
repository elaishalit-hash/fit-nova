"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

type Decision = "LIKE" | "PASS";

type SwipeDeckProps<T> = {
  items: T[];
  getId: (item: T) => string;
  renderCard: (item: T) => React.ReactNode;
  onDecision: (id: string, decision: Decision) => void | Promise<void>;
  emptyMessage?: string;
};

export function SwipeDeck<T>({
  items,
  getId,
  renderCard,
  onDecision,
  emptyMessage,
}: SwipeDeckProps<T>) {
  // Track decided ids rather than a numeric index into `items`. Server
  // actions here revalidate this page's data, which pushes an updated
  // (shorter) `items` array into this component without a remount — an
  // index would desync against that shrinking array (skipping or repeating
  // cards). Filtering by id is immune to the array changing underneath us.
  const [decidedIds, setDecidedIds] = useState<Set<string>>(new Set());
  const [pending, setPending] = useState(false);
  const [exitDirection, setExitDirection] = useState<"left" | "right" | null>(
    null
  );

  const undecided = useMemo(
    () => items.filter((item) => !decidedIds.has(getId(item))),
    [items, decidedIds, getId]
  );

  const current = undecided[0];
  const next = undecided[1];
  const remaining = undecided.length;

  async function handleDecision(decision: Decision) {
    if (!current || pending) return;
    const id = getId(current);
    setPending(true);
    setExitDirection(decision === "LIKE" ? "right" : "left");
    try {
      await onDecision(id, decision);
    } finally {
      setDecidedIds((prev) => new Set(prev).add(id));
      setExitDirection(null);
      setPending(false);
    }
  }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowRight") handleDecision("LIKE");
      if (e.key === "ArrowLeft") handleDecision("PASS");
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, pending]);

  if (!current) {
    return (
      <div
        className="flex w-full max-w-sm flex-col items-center gap-3 rounded-2xl border border-dashed border-ink-200 bg-ink-25/60 px-6 py-16 text-center"
        data-testid="deck-empty"
      >
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-ink-100 text-2xl">
          🎵
        </span>
        <p className="font-medium text-ink-500">
          {emptyMessage ?? "Nothing left to swipe on."}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="relative h-[26rem] w-full max-w-sm">
        {next && (
          <div
            aria-hidden
            className="absolute inset-0 scale-[0.95] rounded-2xl border border-ink-150 bg-ink-25 opacity-70"
            style={{ top: 10 }}
          />
        )}
        <AnimatePresence mode="wait">
          <motion.div
            key={getId(current)}
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, x: 0, y: 0, rotate: 0 }}
            exit={{
              x:
                exitDirection === "right"
                  ? 360
                  : exitDirection === "left"
                    ? -360
                    : 0,
              rotate:
                exitDirection === "right"
                  ? 18
                  : exitDirection === "left"
                    ? -18
                    : 0,
              opacity: 0,
              transition: { duration: 0.18, ease: [0.2, 0.8, 0.3, 1] },
            }}
            transition={{ duration: 0.2, ease: [0.2, 1.15, 0.3, 1] }}
            className="card-surface absolute inset-0 overflow-y-auto rounded-2xl p-6"
          >
            {renderCard(current)}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex items-center gap-5">
        <button
          type="button"
          onClick={() => handleDecision("PASS")}
          disabled={pending}
          data-testid="pass-button"
          aria-label="Pass"
          className="btn flex h-14 w-14 items-center justify-center rounded-full border-2 border-ink-200 bg-ink-25 text-ink-400 shadow-card hover:border-ink-300 hover:text-ink-600 disabled:opacity-60"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path
              d="M6 6l12 12M18 6L6 18"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
            />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => handleDecision("LIKE")}
          disabled={pending}
          data-testid="like-button"
          aria-label="Like"
          className="btn flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-flame-400 to-flame-600 text-white shadow-glow disabled:opacity-60"
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 21s-7.5-4.6-10-9.1C.5 8.2 2.4 5 6 5c2 0 3.5 1.1 4.5 2.6.9-1.5 2.5-2.6 4.5-2.6 3.6 0 5.5 3.2 4 6.9-2.5 4.5-10 9.1-10 9.1z" />
          </svg>
        </button>
      </div>
      <p className="text-xs font-medium text-ink-400">
        {remaining} left in your deck
      </p>
    </div>
  );
}
