import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { hasAcceptedCurrentTerms } from "@/lib/terms";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const accepted = await hasAcceptedCurrentTerms(session.user.id);
  if (!accepted) {
    redirect("/terms/accept");
  }

  const base =
    session.user.role === "SONGWRITER"
      ? "/dashboard/songwriter"
      : "/dashboard/artist";

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <div className="mb-8 flex gap-1.5 rounded-full border border-ink-150 bg-ink-25 p-1 text-sm font-semibold w-fit">
        <Link
          href={base}
          className="rounded-full px-4 py-1.5 text-ink-600 transition-colors hover:bg-ink-100 hover:text-ink-900"
        >
          {session.user.role === "SONGWRITER" ? "Submissions" : "Discover"}
        </Link>
        <Link
          href={`${base}/matches`}
          data-testid="matches-nav-link"
          className="rounded-full px-4 py-1.5 text-ink-600 transition-colors hover:bg-ink-100 hover:text-ink-900"
        >
          Matches
        </Link>
      </div>
      {children}
    </div>
  );
}
