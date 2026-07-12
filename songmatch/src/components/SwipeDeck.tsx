"use client";

import { useEffect, useState } from "react";
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
  const [index, setIndex] = useState(0);
  const [pending, setPending] = useState(false);
  const [exitDirection, setExitDirection] = useState<"left" | "right" | null>(
    null
  );

  const current = items[index];

  async function handleDecision(decision: Decision) {
    if (!current || pending) return;
    setPending(true);
    setExitDirection(decision === "LIKE" ? "right" : "left");
    try {
      await onDecision(getId(current), decision);
    } finally {
      setIndex((i) => i + 1);
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
      <p className="text-neutral-500" data-testid="deck-empty">
        {emptyMessage ?? "Nothing left to swipe on."}
      </p>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="relative h-96 w-full max-w-sm">
        <AnimatePresence>
          <motion.div
            key={getId(current)}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1, x: 0, rotate: 0 }}
            exit={{
              x:
                exitDirection === "right"
                  ? 320
                  : exitDirection === "left"
                    ? -320
                    : 0,
              rotate:
                exitDirection === "right"
                  ? 15
                  : exitDirection === "left"
                    ? -15
                    : 0,
              opacity: 0,
            }}
            transition={{ duration: 0.25 }}
            className="absolute inset-0 overflow-y-auto rounded-xl border border-neutral-200 bg-white p-6 shadow-lg"
          >
            {renderCard(current)}
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="flex gap-4">
        <button
          type="button"
          onClick={() => handleDecision("PASS")}
          disabled={pending}
          data-testid="pass-button"
          className="rounded-full border border-neutral-300 px-6 py-2 font-semibold text-neutral-600 hover:bg-neutral-50 disabled:opacity-60"
        >
          Pass
        </button>
        <button
          type="button"
          onClick={() => handleDecision("LIKE")}
          disabled={pending}
          data-testid="like-button"
          className="rounded-full bg-rose-600 px-6 py-2 font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
        >
          Like
        </button>
      </div>
      <p className="text-xs text-neutral-400">
        {items.length - index} left in your deck
      </p>
    </div>
  );
}
