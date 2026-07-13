import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const key = process.env.STATS_API_KEY;
  if (!key) {
    return NextResponse.json(
      { error: "STATS_API_KEY is not configured." },
      { status: 500 }
    );
  }

  const provided = request.headers.get("x-stats-key");
  if (provided !== key) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [songwriterCount, artistCount, submissionCount, matchCount] =
    await Promise.all([
      db.songwriterProfile.count(),
      db.artistProfile.count(),
      db.submission.count(),
      db.match.count(),
    ]);

  return NextResponse.json({
    userCount: songwriterCount + artistCount,
    songwriterCount,
    artistCount,
    submissionCount,
    matchCount,
  });
}
