import { getCurrentTermsVersion } from "@/lib/terms";
import { TermsBody } from "@/components/TermsBody";

export default async function TermsPage() {
  const version = await getCurrentTermsVersion();

  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-neutral-400">
        Terms version {version.versionLabel}
      </p>
      <TermsBody markdown={version.bodyMarkdown} />
    </main>
  );
}
