import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getArtistProfilesForTargeting } from "@/lib/matching";
import { TargetingDeck } from "@/components/TargetingDeck";

export default async function TargetSubmissionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (session?.user.role !== "SONGWRITER") {
    redirect("/dashboard");
  }

  const { id } = await params;

  const profile = await db.songwriterProfile.findUniqueOrThrow({
    where: { userId: session.user.id },
  });
  const submission = await db.submission.findUnique({ where: { id } });

  if (!submission || submission.songwriterProfileId !== profile.id) {
    notFound();
  }
  if (submission.targetMode !== "SPECIFIC") {
    redirect("/dashboard/songwriter");
  }

  const artists = await getArtistProfilesForTargeting(id);

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Who should see &ldquo;{submission.title}&rdquo;?</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Swipe right on any artist you&apos;d like to pitch this to.
        </p>
      </div>
      <TargetingDeck submissionId={submission.id} artists={artists} />
    </div>
  );
}
