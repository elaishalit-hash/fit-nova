import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function DashboardIndexPage() {
  const session = await auth();
  if (session?.user.role === "SONGWRITER") {
    redirect("/dashboard/songwriter");
  }
  redirect("/dashboard/artist");
}
