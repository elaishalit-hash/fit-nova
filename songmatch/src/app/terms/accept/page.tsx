import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getCurrentTermsVersion, hasAcceptedCurrentTerms } from "@/lib/terms";
import { TermsBody } from "@/components/TermsBody";
import { acceptTermsAction } from "@/actions/terms";

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
    <main className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="mb-2 text-2xl font-bold">
        Before you can match, accept the Terms
      </h1>
      <p className="mb-6 text-sm text-neutral-500">
        Version {version.versionLabel}
      </p>
      <div className="mb-6 max-h-96 overflow-y-auto rounded-md border border-neutral-200 p-4">
        <TermsBody markdown={version.bodyMarkdown} />
      </div>
      <form action={acceptTermsAction} className="flex flex-col gap-4">
        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            name="accept"
            required
            data-testid="terms-checkbox"
            className="mt-1"
          />
          I have read and accept these Terms & Conditions, including the
          copyright co-ownership clause in Section 3.
        </label>
        <button
          type="submit"
          data-testid="terms-accept-submit"
          className="rounded-md bg-rose-600 px-4 py-2 font-semibold text-white hover:bg-rose-700"
        >
          Accept & continue
        </button>
      </form>
    </main>
  );
}
