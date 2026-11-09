import Image from "next/image";
import Link from "next/link";
import type { BookHit } from "@/lib/open-library";
import { workPath } from "@/lib/open-library";
import type { ReaderReview } from "@/lib/public-reviews";

export function BookCard({ book, review = null }: { book: BookHit; review?: ReaderReview | null }) {
  const authors = book.authors.length > 0 ? book.authors.join(", ") : "Author unknown";
  const catalogLine = [book.firstPublishYear, book.pages ? `${book.pages} pages` : null]
    .filter(Boolean)
    .join(" · ");

  return (
    <Link
      href={workPath(book.id)}
      className="flex gap-4 rounded-2xl border border-line bg-paper-raised p-4 hover:border-lake"
    >
      <Cover title={book.title} coverUrl={book.coverUrl} />
      <span className="min-w-0">
        <span className="block break-words font-serif text-xl leading-tight text-ink">{book.title}</span>
        <span className="mt-1 block text-sm text-ink-soft">{authors}</span>
        {catalogLine ? <span className="mt-3 block text-sm text-lake-deep">{catalogLine}</span> : null}
        {book.firstSentence ? (
          <span className="mt-2 block text-sm leading-6 text-ink">{clip(book.firstSentence, 220)}</span>
        ) : null}
        {review ? <ReviewPreview review={review} /> : null}
      </span>
    </Link>
  );
}

function ReviewPreview({ review }: { review: ReaderReview }) {
  const countLabel = review.count === 1 ? "1 reader review" : `${review.count} reader reviews`;
  const stars =
    review.averageStars == null
      ? null
      : `${Number.isInteger(review.averageStars) ? review.averageStars : review.averageStars.toFixed(1)} stars`;

  return (
    <span className="mt-3 block border-t border-line pt-3 text-sm leading-6">
      <span className="block font-semibold text-lake-deep">
        {[countLabel, stars, review.reader, review.scopeLabel].filter(Boolean).join(" · ")}
      </span>
      {review.lesson ? (
        <span className="mt-1 block text-ink">
          <span className="font-semibold">Lesson. </span>
          {clip(review.lesson, 180)}
        </span>
      ) : null}
      {review.application ? (
        <span className="mt-1 block text-ink-soft">
          <span className="font-semibold text-ink">What I'll do. </span>
          {clip(review.application, 160)}
        </span>
      ) : null}
      {review.whoItsFor ? (
        <span className="mt-1 block text-ink-soft">
          <span className="font-semibold text-ink">For. </span>
          {clip(review.whoItsFor, 140)}
        </span>
      ) : null}
      {review.whoShouldSkip ? (
        <span className="block text-ink-soft">
          <span className="font-semibold text-ink">Skip if. </span>
          {clip(review.whoShouldSkip, 140)}
        </span>
      ) : null}
    </span>
  );
}

function clip(text: string, max: number) {
  const flat = text.replace(/\s+/g, " ").trim();
  if (flat.length <= max) {
    return flat;
  }

  return `${flat.slice(0, max).trim()}…`;
}

export function Cover({
  title,
  coverUrl,
  large = false,
}: {
  title: string;
  coverUrl: string | null;
  large?: boolean;
}) {
  const size = large ? "h-56 w-36 md:h-72 md:w-48" : "h-24 w-16 sm:h-28 sm:w-20";

  if (!coverUrl) {
    return (
      <span
        className={`${size} flex shrink-0 items-end rounded-lg bg-lake-soft p-3 font-serif text-sm leading-tight text-lake-deep`}
      >
        {title}
      </span>
    );
  }

  return (
    <Image
      src={coverUrl}
      alt=""
      width={large ? 192 : 80}
      height={large ? 288 : 112}
      className={`${size} shrink-0 rounded-lg bg-lake-soft object-cover`}
    />
  );
}
