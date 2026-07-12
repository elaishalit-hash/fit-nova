"use client";

import { useState } from "react";
import { artistSwipeAction } from "@/actions/swipes";
import { SwipeDeck } from "@/components/SwipeDeck";
import {
  SubmissionCard,
  type SubmissionCardData,
} from "@/components/SubmissionCard";

// Note: intentionally does not call router.refresh() after each swipe. See
// TargetingDeck.tsx for why re-fetching mid-session would desync the deck.
export function ArtistSwipeDeck({
  submissions,
}: {
  submissions: SubmissionCardData[];
}) {
  const [lastMatchTitle, setLastMatchTitle] = useState<string | null>(null);

  return (
    <div className="flex flex-col items-center gap-4">
      {lastMatchTitle && (
        <p
          data-testid="match-banner"
          className="rounded-md bg-rose-100 px-4 py-2 text-sm font-semibold text-rose-700"
        >
          It&apos;s a match on &ldquo;{lastMatchTitle}&rdquo;! Check your matches.
        </p>
      )}
      <SwipeDeck
        items={submissions}
        getId={(s) => s.id}
        renderCard={(s) => <SubmissionCard submission={s} />}
        emptyMessage="No new submissions right now — check back later."
        onDecision={async (submissionId, decision) => {
          await artistSwipeAction(submissionId, decision);
          if (decision === "LIKE") {
            const matched = submissions.find((s) => s.id === submissionId);
            setLastMatchTitle(matched?.title ?? null);
          }
        }}
      />
    </div>
  );
}
