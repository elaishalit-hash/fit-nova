"use client";

import { submissionTargetSwipeAction } from "@/actions/swipes";
import { SwipeDeck } from "@/components/SwipeDeck";
import { ArtistCard, type ArtistCardData } from "@/components/ArtistCard";

// Note: intentionally does not call router.refresh() after each swipe.
// The deck's local index walks through the array it was mounted with;
// re-fetching a shorter, server-filtered array mid-session would desync
// from that local index and make the deck appear empty prematurely.
export function TargetingDeck({
  submissionId,
  artists,
}: {
  submissionId: string;
  artists: ArtistCardData[];
}) {
  return (
    <SwipeDeck
      items={artists}
      getId={(a) => a.id}
      renderCard={(a) => <ArtistCard artist={a} />}
      emptyMessage="No more artists to review right now."
      onDecision={async (artistId, decision) => {
        await submissionTargetSwipeAction(submissionId, artistId, decision);
      }}
    />
  );
}
