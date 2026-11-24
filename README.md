# Book Review

A shelf for what you read. Search the Open Library catalog, keep a reading (want, reading, finished, or stopped), write a review, and keep a study. Accounts, the library, and published reviews are stored in Supabase.

The admin desk that can take a review or a study down is [bookreview-admin](https://github.com/Oreoluwaibk/bookreview-admin).

## Stack

Next.js (App Router), React, TypeScript, Tailwind CSS, and Supabase (`@supabase/ssr` and `@supabase/supabase-js`).

## Pages

| Path | What it is |
| --- | --- |
| `/` | Home |
| `/search` | Catalog search |
| `/books/[workId]` | One book |
| `/library` | Your readings |
| `/study` | Studies |
| `/login`, `/signup` | Account |
| `/privacy`, `/terms`, `/delete` | Legal pages and account deletion |

Server actions in `app/actions` cover auth, profile, readings, reviews, and studies. `app/api/verse` looks up a verse for a study.

## Run locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

Fill in the Supabase values in `.env.local`. Do not commit real keys.

Open [http://localhost:3000](http://localhost:3000).
