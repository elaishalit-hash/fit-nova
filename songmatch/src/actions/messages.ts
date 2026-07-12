"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export type MessageFormState = { error?: string };

export async function sendMessageAction(
  matchId: string,
  _prevState: MessageFormState | undefined,
  formData: FormData
): Promise<MessageFormState> {
  const session = await auth();
  if (!session?.user) {
    return { error: "Unauthorized" };
  }

  const match = await db.match.findUnique({
    where: { id: matchId },
    include: { songwriter: true, artist: true },
  });
  if (!match) {
    return { error: "Match not found." };
  }

  const isParticipant =
    match.songwriter.userId === session.user.id ||
    match.artist.userId === session.user.id;
  if (!isParticipant) {
    return { error: "Unauthorized" };
  }

  const body = String(formData.get("body") ?? "").trim();
  if (!body) {
    return { error: "Message can't be empty." };
  }

  await db.message.create({
    data: { matchId, senderUserId: session.user.id, body },
  });

  revalidatePath(`/matches/${matchId}`);
  return {};
}
