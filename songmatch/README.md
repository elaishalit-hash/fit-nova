# SongMatch (MVP)

A Tinder-style app connecting songwriters (lyrics/words) with artists. Songwriters
upload a submission and target it at a specific artist or broadcast it to everyone.
Both sides swipe; a match triggers an in-app connection and messaging thread.

On every match, the platform records a fixed copyright co-ownership percentage
(`COPYRIGHT_SHARE_PERCENT` in `src/lib/config.ts`) against that match, and this is
established in the app's Terms & Conditions (`src/lib/termsContent.ts`), which every
user must accept before using matching features.

> **The Terms & Conditions text and the copyright percentage are placeholders.**
> They are explicitly marked as a template in-app and must be reviewed by a
> licensed attorney, with a real business number set, before any real use.

## Stack

- Next.js 16 (App Router) + TypeScript
- Prisma ORM 7 + SQLite (via the `@prisma/adapter-better-sqlite3` driver adapter)
- Auth.js (NextAuth) v5, Credentials provider, JWT sessions
- Tailwind CSS v4
- framer-motion for the swipe-card animation (interactions are click/keyboard driven,
  not drag-gesture, so they're reliably testable headlessly)

## Setup

```bash
npm install
npx prisma migrate dev   # creates prisma/dev.db and applies the schema
npx prisma db seed       # seeds demo accounts + sample submissions
npm run dev              # http://localhost:3000
```

If you ever want a totally clean local database, delete `prisma/dev.db` and
re-run `npx prisma migrate dev` + `npx prisma db seed`.

## Seeded demo accounts

Password for all of them: `password123`

| Email | Role |
|---|---|
| songwriter1@songmatch.test | Songwriter |
| songwriter2@songmatch.test | Songwriter |
| artist1@songmatch.test | Artist |
| artist2@songmatch.test | Artist |

Seeded data includes: a broadcast submission (visible to every artist
immediately), a submission already targeted at `artist2`, an untargeted
submission you can manually target, and one fully pre-baked match (with a
seed message) between `songwriter2` and `artist1`.

## Manual walkthrough

1. Sign up a new account (or log in as `songwriter1@songmatch.test`), accept
   the Terms.
2. Create a submission, choose "Target specific artists," then swipe right
   on an artist in the deck that follows.
3. Log in as that artist (or sign up a new artist account) in another
   browser/incognito window, accept the Terms, and open **Discover**. The
   submission should appear — swipe right.
4. Both accounts should now see the match under **Matches**, with the same
   copyright percentage and Terms version. Open the match to send messages.
5. To see the broadcast path: create a submission with "Broadcast to all
   artists" — it should appear in every artist's deck without a targeting
   step.

## Running the E2E test

```bash
npx playwright install chromium   # first time only
npm run dev                        # in one terminal
npx playwright test                # in another
```

## Explicitly out of scope for this MVP

Payments/royalty accounting beyond storing a percentage, production
deployment config, an admin panel, email verification/password reset,
OAuth/social login, real-time (websocket) messaging, per-file access
control beyond "must be logged in," multiple matches per submission,
drag-gesture swipe physics, search/filtering/pagination, notifications, and
actual attorney review of the Terms text.
