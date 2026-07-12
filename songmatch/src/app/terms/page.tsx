import { getCurrentTermsVersion } from "@/lib/terms";
import { TermsBody } from "@/components/TermsBody";

export default async function TermsPage() {
  const version = await getCurrentTermsVersion();

  return (
    <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-ink-400">
        Terms version {version.versionLabel}
      </p>
      <div className="card-surface rounded-2xl p-6">
        <TermsBody markdown={version.bodyMarkdown} />
      </div>
    </main>
  );
}
