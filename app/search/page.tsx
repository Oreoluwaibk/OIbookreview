import { Suspense } from "react";
import { BookCard } from "@/components/book-card";
import { SearchForm } from "@/components/search-form";
import { searchBooks } from "@/lib/open-library";
import { publicReviewsForSearch } from "@/lib/public-reviews";

export default function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-8 sm:px-6 sm:py-10">
      <div className="max-w-2xl">
        <h1 className="font-serif text-3xl sm:text-4xl">Search the catalog</h1>
        <p className="mt-2 text-ink-soft">
          A title, an author, or an ISBN is enough. Reviews other readers published show up on the matching book.
        </p>
      </div>
      <Suspense fallback={<p className="text-ink-soft">Opening search…</p>}>
        <SearchBody searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function SearchBody({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const query = q.trim();

  return (
    <>
      <SearchForm defaultQuery={query} />
      {query ? <Results query={query} /> : null}
    </>
  );
}

async function Results({ query }: { query: string }) {
  const { books, error } = await searchBooks(query);
  const community = await publicReviewsForSearch(query, books);
  const results = [...community.extras, ...books];

  if (error && results.length === 0) {
    return <p className="text-clay">{error}</p>;
  }

  if (results.length === 0) {
    return (
      <p className="text-ink-soft">
        Nothing matched “{query}”. Try the title, the author, or the ISBN without spaces.
      </p>
    );
  }

  return (
    <ul className="grid gap-4">
      {results.map((book) => (
        <li key={book.id}>
          <BookCard book={book} review={community.reviews.get(book.id) ?? null} />
        </li>
      ))}
    </ul>
  );
}
