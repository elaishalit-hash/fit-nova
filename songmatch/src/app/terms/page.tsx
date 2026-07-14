import type { Metadata } from "next";
import { getCurrentTermsVersion } from "@/lib/terms";
import { TermsBody } from "@/components/TermsBody";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description: "SongMatch's Terms & Conditions, including the copyright co-ownership clause.",
};

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
