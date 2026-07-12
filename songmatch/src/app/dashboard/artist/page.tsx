import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getArtistDeck } from "@/lib/matching";
import { ArtistSwipeDeck } from "@/components/ArtistSwipeDeck";

export default async function ArtistDashboardPage() {
  const session = await auth();
  if (session?.user.role !== "ARTIST") {
    redirect("/dashboard");
  }

  const profile = await db.artistProfile.findUniqueOrThrow({
    where: { userId: session.user.id },
  });

  const deck = await getArtistDeck(profile.id);

  return (
    <div className="flex flex-col items-center gap-6">
      <h1 className="text-2xl font-bold">Discover Lyrics</h1>
      <ArtistSwipeDeck submissions={deck} />
    </div>
  );
}
