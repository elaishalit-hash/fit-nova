"use server";

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getCurrentTermsVersion } from "@/lib/terms";

export async function acceptTermsAction() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const version = await getCurrentTermsVersion();

  await db.termsAcceptance.upsert({
    where: {
      userId_termsVersionId: {
        userId: session.user.id,
        termsVersionId: version.id,
      },
    },
    create: { userId: session.user.id, termsVersionId: version.id },
    update: {},
  });

  redirect("/dashboard");
}
