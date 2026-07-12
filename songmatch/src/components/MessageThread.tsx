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
    <div className="flex flex-col gap-3">
      <ul
        data-testid="message-list"
        className="card-surface flex max-h-80 flex-col gap-2 overflow-y-auto rounded-2xl p-3"
      >
        {messages.length === 0 && (
          <li className="px-2 py-3 text-center text-sm text-ink-400">
            No messages yet — say hello!
          </li>
        )}
        {messages.map((m) => (
          <li
            key={m.id}
            data-testid="message-item"
            className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm ${
              m.senderUserId === currentUserId
                ? "self-end bg-gradient-to-br from-flame-500 to-flame-600 text-white"
                : "self-start bg-ink-100 text-ink-800"
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
          className="field flex-1"
        />
        <button
          type="submit"
          disabled={pending}
          data-testid="message-send"
          className="btn btn-primary shrink-0 rounded-full px-5 text-sm font-semibold disabled:opacity-60"
        >
          Send
        </button>
      </form>
      {state?.error && (
        <p
          className="rounded-lg bg-flame-50 px-3 py-2 text-sm font-medium text-flame-700"
          data-testid="message-error"
        >
          {state.error}
        </p>
      )}
    </div>
  );
}
