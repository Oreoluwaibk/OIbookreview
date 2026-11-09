import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ReadingForm } from "@/components/reading-form";
import { ReviewForm } from "@/components/review-form";
import { Cover } from "@/components/book-card";
import { BookPreviewView } from "@/components/book-preview";
import { getOptionalUser } from "@/lib/auth";
import { chapterName, getBook, type BookDetail, type EditionHit } from "@/lib/open-library";
import { catalogPreview, previewSource, writeAiPreview, type BookPreview } from "@/lib/preview";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

type BookPageProps = {
  params: Promise<{ workId: string }>;
};

export async function generateMetadata({ params }: BookPageProps): Promise<Metadata> {
  const { workId } = await params;
  const book = await getBook(workId).catch(() => null);

  if (!book) {
    return { title: "Book · Book Review" };
  }

  return {
    title: `${book.title} · Book Review`,
    description: book.description?.slice(0, 160) ?? `Keep your place in ${book.title}.`,
  };
}

export default function BookPage({ params }: BookPageProps) {
  return (
    <Suspense
      fallback={
        <main className="mx-auto w-full max-w-5xl px-4 py-8 text-ink-soft sm:px-6 sm:py-10">
          Opening this book…
        </main>
      }
    >
      <BookContent params={params} />
    </Suspense>
  );
}

async function BookContent({ params }: BookPageProps) {
  const { workId } = await params;
  const result = await getBook(workId).then(
    (book) => ({ book, unavailable: false }),
    () => ({ book: null, unavailable: true }),
  );

  if (result.unavailable) {
    return (
      <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
        <h1 className="font-serif text-3xl sm:text-4xl">The catalog did not answer</h1>
        <p className="mt-3 text-ink-soft">Refresh this page in a moment and the book should open.</p>
      </main>
    );
  }

  const book = result.book;
  if (!book) {
    notFound();
  }

  const authors = book.authors.length > 0 ? book.authors.join(", ") : "Author unknown";
  const shownEditions = book.editions.slice(0, 8);
  const chapterLabels = book.chapters.map(chapterName).slice(0, 40);
  const preview = await loadPreview(book);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-8 sm:gap-10 sm:px-6 sm:py-10">
      <article className="grid gap-6 sm:grid-cols-[9rem_1fr] sm:items-start md:grid-cols-[12rem_1fr]">
        <Cover title={book.title} coverUrl={book.coverUrl} large />
        <div className="min-w-0">
          <h1 className="font-serif text-3xl leading-tight break-words sm:text-4xl">{book.title}</h1>
          <p className="mt-2 text-lg text-ink-soft">{authors}</p>
          <p className="mt-3 text-sm text-lake-deep">
            {[
              book.firstPublishYear,
              book.pages ? `${book.pages} pages` : null,
              book.editionCount ? `${book.editionCount} editions in the catalog` : null,
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
      </article>

      <BookPreviewView preview={preview} catalogDescription={book.description} />

      <section>
        <h2 className="font-serif text-2xl">Chapters</h2>
        {book.chapters.length > 0 ? (
          <>
            <p className="mt-2 text-sm text-ink-soft">From the edition in the catalog that lists them.</p>
            <ol className="mt-4 grid gap-2">
              {book.chapters.slice(0, 40).map((chapter, index) => (
                <li
                  key={`${chapterName(chapter)}-${index}`}
                  className={`rounded-2xl border border-line bg-paper-raised px-4 py-3 text-sm break-words ${chapter.level > 0 ? "ml-4 sm:ml-6" : ""}`}
                >
                  <span className="font-semibold">{chapterName(chapter)}</span>
                  {chapter.page ? <span className="text-ink-soft"> · p. {chapter.page}</span> : null}
                </li>
              ))}
            </ol>
            {book.chapters.length > 40 ? (
              <p className="mt-3 text-sm text-ink-soft">
                {book.chapters.length - 40} more entries are in the catalog list.
              </p>
            ) : null}
          </>
        ) : (
          <p className="mt-4 text-ink-soft">The catalog does not list chapters for this book.</p>
        )}
      </section>

      <section>
        <h2 className="font-serif text-2xl">About the author</h2>
        {book.authorsAbout.length > 0 ? (
          <div className="mt-4 grid gap-4">
            {book.authorsAbout.map((author, index) => (
              <article key={`${author.name}-${index}`} className="rounded-2xl border border-line bg-paper-raised px-5 py-4">
                <h3 className="font-serif text-xl">{author.name}</h3>
                {author.birthDate ? <p className="mt-1 text-sm text-lake-deep">Born {author.birthDate}</p> : null}
                {author.bio ? (
                  <p className="mt-3 max-w-3xl whitespace-pre-wrap leading-7">{clip(author.bio, 1600)}</p>
                ) : (
                  <p className="mt-3 text-ink-soft">No biography is available for this author yet.</p>
                )}
                {author.source === "wikipedia" ? (
                  <p className="mt-3 text-xs text-ink-soft">From Wikipedia.</p>
                ) : null}
              </article>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-ink-soft">The catalog does not name an author for this book.</p>
        )}
      </section>

      {shownEditions.length > 0 ? (
        <section>
          <h2 className="font-serif text-2xl">Editions</h2>
          <ul className="mt-4 grid gap-3">
            {shownEditions.map((edition) => (
              <li key={edition.key} className="rounded-2xl border border-line bg-paper-raised px-4 py-3 text-sm">
                <span className="font-semibold">
                  {[edition.publishYear, edition.publisher].filter(Boolean).join(" · ") || edition.title}
                </span>
                <span className="mt-1 block text-ink-soft">
                  {[
                    edition.translator ? `Translated by ${edition.translator}` : null,
                    edition.pageCount ? `${edition.pageCount} pages` : null,
                    edition.isbn13,
                  ]
                    .filter(Boolean)
                    .join(" · ") || "Edition details are thin in the catalog."}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <Suspense fallback={<p className="text-ink-soft">Checking your shelf…</p>}>
        <ShelfPanel workId={book.id} editions={shownEditions} />
      </Suspense>
      <Suspense fallback={<p className="text-ink-soft">Loading reviews…</p>}>
        <ReviewSection workId={book.id} title={book.title} chapters={chapterLabels} />
      </Suspense>
    </main>
  );
}

async function ShelfPanel({
  workId,
  editions,
}: {
  workId: string;
  editions: EditionHit[];
}) {
  if (!isSupabaseConfigured()) {
    return (
      <section className="rounded-3xl bg-lake-soft p-4 sm:p-6">
        <h2 className="font-serif text-2xl">Keep your place</h2>
        <p className="mt-2 max-w-xl text-ink-soft">
          This book is ready to save. Connect Supabase, then sign in, and the shelf on this page will hold the reading.
        </p>
        <Link href="/library" className="mt-4 inline-block font-semibold text-lake-deep">
          See what to set up
        </Link>
      </section>
    );
  }

  const user = await getOptionalUser();

  if (!user) {
    return (
      <section className="rounded-3xl bg-lake-soft p-4 sm:p-6">
        <h2 className="font-serif text-2xl">Keep your place</h2>
        <p className="mt-2 text-ink-soft">Sign in to put this book on your shelf.</p>
        <Link
          href={`/login?next=${encodeURIComponent(`/books/${workId}`)}`}
          className="mt-4 inline-block rounded-full bg-lake px-5 py-2.5 font-semibold text-white"
        >
          Sign in
        </Link>
      </section>
    );
  }

  const supabase = await createClient();
  const { data: savedBook } = await supabase
    .from("books")
    .select("id")
    .eq("open_library_work_key", workId)
    .maybeSingle();

  let summary: string | null = null;

  if (savedBook) {
    const { data: reading } = await supabase
      .from("readings")
      .select("status, format, progress_percent")
      .eq("user_id", user.id)
      .eq("book_id", savedBook.id)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (reading) {
      const statusLabel = {
        want: "Want to read",
        reading: "Reading",
        finished: "Finished",
        stopped: "Stopped",
      }[reading.status as "want" | "reading" | "finished" | "stopped"];
      summary = [
        statusLabel,
        reading.format,
        reading.progress_percent != null ? `${reading.progress_percent}%` : null,
      ]
        .filter(Boolean)
        .join(" · ");
    }
  }

  return (
    <section className="rounded-3xl bg-lake-soft p-4 sm:p-6">
      <h2 className="font-serif text-2xl">Keep your place</h2>
      {summary ? <p className="mt-2 text-sm text-lake-deep">Latest reading: {summary}</p> : null}
      <div className="mt-4">
        <ReadingForm workId={workId} editions={editions} />
      </div>
    </section>
  );
}

type ReviewRow = {
  id: string;
  user_id: string;
  scope: string;
  chapter_label: string | null;
  lesson: string | null;
  application: string | null;
  who_its_for: string;
  who_should_skip: string | null;
  observation: string | null;
  stars: number | null;
  created_at: string;
};

async function ReviewSection({
  workId,
  title,
  chapters,
}: {
  workId: string;
  title: string;
  chapters: string[];
}) {
  if (!isSupabaseConfigured()) {
    return (
      <section>
        <h2 className="font-serif text-2xl">Reviews</h2>
        <p className="mt-2 text-ink-soft">
          Connect Supabase to publish a review of {title}, or of a single chapter.
        </p>
      </section>
    );
  }

  const user = await getOptionalUser();
  const supabase = await createClient();
  const { data: savedBook } = await supabase
    .from("books")
    .select("id")
    .eq("open_library_work_key", workId)
    .maybeSingle();

  let reviews: ReviewRow[] = [];
  let names = new Map<string, string>();
  let loadError: string | null = null;

  if (savedBook) {
    const { data, error } = await supabase
      .from("reviews")
      .select(
        "id, user_id, scope, chapter_label, lesson, application, who_its_for, who_should_skip, observation, stars, created_at",
      )
      .eq("book_id", savedBook.id)
      .order("created_at", { ascending: false });

    if (error) {
      loadError =
        error.message.includes("lesson") || error.message.includes("application")
          ? "Run supabase/migrate-review-lesson.sql in the Supabase SQL editor, then refresh."
          : error.message.includes("scope")
            ? "Run supabase/migrate-reviews.sql in the Supabase SQL editor so chapter reviews can be stored."
            : error.message;
    } else {
      reviews = (data ?? []) as ReviewRow[];
      const ids = [...new Set(reviews.map((review) => review.user_id))];
      if (ids.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, display_name")
          .in("id", ids);
        names = new Map((profiles ?? []).map((profile) => [profile.id, profile.display_name]));
      }
    }
  }

  return (
    <section className="grid gap-6">
      <div>
        <h2 className="font-serif text-2xl">Reviews</h2>
        <p className="mt-2 text-ink-soft">
          These stay public. Another reader sees the lesson you took, and what you are going to do with it.
        </p>
      </div>
      {loadError ? <p className="text-sm text-clay">{loadError}</p> : null}
      {reviews.length === 0 && !loadError ? (
        <p className="text-ink-soft">No reviews yet.</p>
      ) : (
        <ul className="grid gap-4">
          {reviews.map((review) => {
            const scopeLabel =
              review.scope === "chapter"
                ? `Chapter: ${review.chapter_label}`
                : "Whole book";

            return (
              <li key={review.id} className="rounded-3xl border border-line bg-paper-raised p-4 break-words sm:p-5">
                <p className="text-sm text-lake-deep">
                  {[names.get(review.user_id) ?? "Reader", scopeLabel, review.stars ? `${review.stars} stars` : null, review.created_at.slice(0, 10)]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
                <ReviewPart label="Lesson learnt" text={review.lesson} />
                <ReviewPart label="What I am going to do" text={review.application} />
                <ReviewPart label="Who it is for" text={review.who_its_for} />
                <ReviewPart label="Who should skip it" text={review.who_should_skip} />
                <ReviewPart label="Observation" text={review.observation} />
              </li>
            );
          })}
        </ul>
      )}
      {user ? (
        <div className="rounded-3xl bg-lake-soft p-4 sm:p-6">
          <h3 className="font-serif text-xl">Write a review</h3>
          <div className="mt-4">
            <ReviewForm workId={workId} chapters={chapters} />
          </div>
        </div>
      ) : (
        <Link
          href={`/login?next=${encodeURIComponent(`/books/${workId}`)}`}
          className="w-fit rounded-full bg-lake px-5 py-2.5 font-semibold text-white"
        >
          Sign in to review
        </Link>
      )}
    </section>
  );
}

async function loadPreview(book: BookDetail): Promise<BookPreview> {
  const base = catalogPreview(book);
  if (!process.env.AI_API_KEY && !process.env.OPENAI_API_KEY) {
    return base;
  }

  try {
    const written = await writeAiPreview(previewSource(book));
    if (!written) {
      return base;
    }

    return { ...base, ...written, source: "ai" };
  } catch {
    return base;
  }
}

function clip(text: string, max: number) {
  if (text.length <= max) {
    return text;
  }

  return `${text.slice(0, max).trim()}…`;
}

function ReviewPart({ label, text }: { label: string; text: string | null }) {
  if (!text) {
    return null;
  }

  return (
    <p className="mt-3 text-sm leading-6">
      <span className="font-semibold">{label}. </span>
      <span className="whitespace-pre-wrap">{text}</span>
    </p>
  );
}
