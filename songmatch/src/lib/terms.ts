import { db } from "@/lib/db";

export async function getCurrentTermsVersion() {
  const version = await db.termsVersion.findFirst({
    orderBy: { effectiveAt: "desc" },
  });
  if (!version) {
    throw new Error("No TermsVersion exists — run the seed script first.");
  }
  return version;
}

export async function hasAcceptedCurrentTerms(userId: string) {
  const current = await getCurrentTermsVersion();
  const acceptance = await db.termsAcceptance.findUnique({
    where: {
      userId_termsVersionId: {
        userId,
        termsVersionId: current.id,
      },
    },
  });
  return acceptance !== null;
}

export async function assertTermsAccepted(userId: string) {
  const accepted = await hasAcceptedCurrentTerms(userId);
  if (!accepted) {
    throw new Error("You must accept the current Terms & Conditions first.");
  }
}
