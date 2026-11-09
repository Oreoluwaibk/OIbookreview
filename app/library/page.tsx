import Link from "next/link";
import { Suspense } from "react";
import { Cover } from "@/components/book-card";
import { getOptionalUser } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

const statusLabel = {
  want: "Want to read",
  reading: "Reading",
  finished: "Finished",
  stopped: "Stopped",
} as const;

export default function LibraryPage() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8 sm:px-6 sm:py-10">
      <div>
        <h1 className="font-serif text-3xl sm:text-4xl">Your library</h1>
        <p className="mt-2 text-ink-soft">Every reading you have kept, newest first.</p>
      </div>
      <Suspense fallback={<p className="text-ink-soft">Opening your shelf…</p>}>
        <LibraryBody />
      </Suspense>
    </main>
  );
}

async function LibraryBody() {
  if (!isSupabaseConfigured()) {
    return (
      <section className="rounded-3xl border border-line bg-paper-raised p-4 sm:p-6">
        <h2 className="font-serif text-2xl">Supabase is the shelf</h2>
        <p className="mt-2 max-w-xl leading-7 text-ink-soft">
          Search already works from the public catalog. Saving a reading needs your Supabase project:
          the URL and anon key in <code className="text-ink">.env.local</code>, then the tables in{" "}
          <code className="text-ink">supabase/schema.sql</code>.
        </p>
        <Link href="/search" className="mt-4 inline-block font-semibold text-lake-deep">
          Search while that is being set up
        </Link>
      </section>
    );
  }

  const user = await getOptionalUser();

  if (!user) {
    return (
      <section className="rounded-3xl bg-lake-soft p-4 sm:p-6">
        <h2 className="font-serif text-2xl">Sign in to see your shelf</h2>
        <Link
          href="/login?next=/library"
          className="mt-4 inline-block rounded-full bg-lake px-5 py-2.5 font-semibold text-white"
        >
          Sign in
        </Link>
      </section>
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("readings")
    .select(
      "id, status, format, progress_percent, copy_source, updated_at, books(title, authors, open_library_work_key, cover_url)",
    )
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  if (error) {
    return (
      <p className="text-clay">
        The shelf could not be read. If the tables are missing, run supabase/schema.sql in the
        Supabase SQL editor. {error.message}
      </p>
    );
  }

  const readings = data ?? [];

  if (readings.length === 0) {
    return (
      <p className="text-ink-soft">
        Nothing saved yet.{" "}
        <Link href="/search" className="font-semibold text-lake-deep">
          Find a book
        </Link>{" "}
        and keep your place.
      </p>
    );
  }

  return (
    <ul className="grid gap-4">
      {readings.map((reading) => {
        const book = Array.isArray(reading.books) ? reading.books[0] : reading.books;
        if (!book) {
          return null;
        }

        const status = statusLabel[reading.status as keyof typeof statusLabel] ?? reading.status;

        return (
          <li key={reading.id}>
            <Link
              href={`/books/${book.open_library_work_key}`}
              className="flex gap-4 rounded-2xl border border-line bg-paper-raised p-4 hover:border-lake"
            >
              <Cover title={book.title} coverUrl={book.cover_url} />
              <span className="min-w-0">
                <span className="block font-serif text-xl break-words">{book.title}</span>
                <span className="mt-1 block text-sm text-ink-soft">
                  {(book.authors ?? []).join(", ")}
                </span>
                <span className="mt-3 block text-sm text-lake-deep">
                  {[
                    status,
                    reading.format,
                    reading.progress_percent != null ? `${reading.progress_percent}%` : null,
                    reading.copy_source,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
