import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { getCurrentTermsVersion, hasAcceptedCurrentTerms } from "@/lib/terms";
import { TermsBody } from "@/components/TermsBody";
import { acceptTermsAction } from "@/actions/terms";

export const metadata: Metadata = {
  title: "Accept the Terms",
};

export default async function AcceptTermsPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const alreadyAccepted = await hasAcceptedCurrentTerms(session.user.id);
  if (alreadyAccepted) {
    redirect("/dashboard");
  }

  const version = await getCurrentTermsVersion();

  return (
    <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <h1 className="mb-2 font-display text-2xl font-semibold text-ink-900">
        Before you can match, accept the Terms
      </h1>
      <p className="mb-6 text-sm text-ink-500">Version {version.versionLabel}</p>
      <div className="card-surface mb-6 max-h-96 overflow-y-auto rounded-2xl p-5">
        <TermsBody markdown={version.bodyMarkdown} />
      </div>
      <form action={acceptTermsAction} className="flex flex-col gap-4">
        <label className="flex items-start gap-2.5 rounded-xl border border-ink-200 bg-ink-25 p-4 text-sm text-ink-700 has-[:checked]:border-flame-400 has-[:checked]:bg-flame-50">
          <input
            type="checkbox"
            name="accept"
            required
            data-testid="terms-checkbox"
            className="mt-0.5 h-4 w-4 accent-flame-500"
          />
          I have read and accept these Terms & Conditions, including the
          copyright co-ownership clause in Section 3.
        </label>
        <button
          type="submit"
          data-testid="terms-accept-submit"
          className="btn btn-primary rounded-full px-4 py-2.5 font-semibold"
        >
          Accept &amp; continue
        </button>
      </form>
    </main>
  );
}
