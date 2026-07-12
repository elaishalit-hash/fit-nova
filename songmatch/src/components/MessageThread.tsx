"use client";

import { useActionState } from "react";
import { sendMessageAction } from "@/actions/messages";

export type ThreadMessage = {
  id: string;
  body: string;
  senderUserId: string;
  senderName: string;
  createdAt: Date;
};

export function MessageThread({
  matchId,
  messages,
  currentUserId,
}: {
  matchId: string;
  messages: ThreadMessage[];
  currentUserId: string;
}) {
  const boundAction = sendMessageAction.bind(null, matchId);
  const [state, action, pending] = useActionState(boundAction, undefined);

  return (
    <div className="flex flex-col gap-4">
      <ul
        data-testid="message-list"
        className="flex max-h-80 flex-col gap-2 overflow-y-auto rounded-md border border-neutral-200 p-3"
      >
        {messages.length === 0 && (
          <li className="text-sm text-neutral-400">
            No messages yet — say hello!
          </li>
        )}
        {messages.map((m) => (
          <li
            key={m.id}
            data-testid="message-item"
            className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
              m.senderUserId === currentUserId
                ? "self-end bg-rose-100 text-rose-900"
                : "self-start bg-neutral-100 text-neutral-800"
            }`}
          >
            <p className="mb-0.5 text-xs font-semibold opacity-70">
              {m.senderName}
            </p>
            {m.body}
          </li>
        ))}
      </ul>

      <form action={action} className="flex gap-2">
        <input
          name="body"
          type="text"
          required
          placeholder="Write a message..."
          data-testid="message-input"
          className="flex-1 rounded-md border border-neutral-300 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={pending}
          data-testid="message-send"
          className="rounded-md bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
        >
          Send
        </button>
      </form>
      {state?.error && (
        <p className="text-sm text-red-600" data-testid="message-error">
          {state.error}
        </p>
      )}
    </div>
  );
}
