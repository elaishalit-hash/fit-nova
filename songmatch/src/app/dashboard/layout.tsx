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
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex gap-4 border-b border-neutral-200 pb-2 text-sm font-semibold">
        <Link href={base} className="text-neutral-600 hover:text-rose-600">
          {session.user.role === "SONGWRITER" ? "Submissions" : "Discover"}
        </Link>
        <Link
          href={`${base}/matches`}
          data-testid="matches-nav-link"
          className="text-neutral-600 hover:text-rose-600"
        >
          Matches
        </Link>
      </div>
      {children}
    </div>
  );
}
