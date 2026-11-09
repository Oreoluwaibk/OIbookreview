import type { BookHit } from "@/lib/open-library";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export type ReaderReview = {
  count: number;
  averageStars: number | null;
  reader: string;
  scopeLabel: string;
  lesson: string | null;
  application: string | null;
  whoItsFor: string | null;
  whoShouldSkip: string | null;
};

type SavedBook = {
  id: string;
  open_library_work_key: string;
  title: string;
  authors: string[] | null;
  cover_url: string | null;
  first_publish_year: number | null;
};

type ReviewRow = {
  book_id: string;
  user_id: string;
  scope: string;
  chapter_label: string | null;
  lesson: string | null;
  application: string | null;
  who_its_for: string | null;
  who_should_skip: string | null;
  stars: number | string | null;
  created_at: string;
};

export async function publicReviewsForSearch(query: string, catalog: BookHit[]) {
  const empty = {
    reviews: new Map<string, ReaderReview>(),
    extras: [] as BookHit[],
  };

  if (!isSupabaseConfigured()) {
    return empty;
  }

  try {
    const supabase = await createClient();
    const catalogIds = catalog.map((book) => book.id);
    const titleMatches = await booksMatchingTitle(supabase, query);
    const saved = await booksForKeys(supabase, catalogIds);
    const byId = new Map<string, SavedBook>();

    for (const book of [...saved, ...titleMatches]) {
      byId.set(book.id, book);
    }

    if (byId.size === 0) {
      return empty;
    }

    const { data, error } = await supabase
      .from("reviews")
      .select(
        "book_id, user_id, scope, chapter_label, lesson, application, who_its_for, who_should_skip, stars, created_at",
      )
      .in("book_id", [...byId.keys()])
      .order("created_at", { ascending: false });

    if (error || !data) {
      return empty;
    }

    const rows = data as ReviewRow[];
    const names = await readerNames(
      supabase,
      rows.map((row) => row.user_id),
    );
    const reviews = summarize(rows, byId, names);
    const catalogKeys = new Set(catalogIds);
    const extras = titleMatches
      .filter((book) => reviews.has(book.open_library_work_key) && !catalogKeys.has(book.open_library_work_key))
      .map(toHit);

    return { reviews, extras };
  } catch {
    return empty;
  }
}

async function booksForKeys(
  supabase: Awaited<ReturnType<typeof createClient>>,
  workIds: string[],
) {
  if (workIds.length === 0) {
    return [] as SavedBook[];
  }

  const { data } = await supabase
    .from("books")
    .select("id, open_library_work_key, title, authors, cover_url, first_publish_year")
    .in("open_library_work_key", workIds);

  return (data ?? []) as SavedBook[];
}

async function booksMatchingTitle(
  supabase: Awaited<ReturnType<typeof createClient>>,
  query: string,
) {
  const needle = query.replace(/[%_,]/g, " ").trim();
  if (needle.length < 2) {
    return [] as SavedBook[];
  }

  const { data } = await supabase
    .from("books")
    .select("id, open_library_work_key, title, authors, cover_url, first_publish_year")
    .ilike("title", `%${needle}%`)
    .limit(8);

  return (data ?? []) as SavedBook[];
}

async function readerNames(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userIds: string[],
) {
  const ids = [...new Set(userIds)];
  if (ids.length === 0) {
    return new Map<string, string>();
  }

  const { data } = await supabase.from("profiles").select("id, display_name").in("id", ids);
  return new Map((data ?? []).map((profile) => [profile.id, profile.display_name as string]));
}

function summarize(rows: ReviewRow[], books: Map<string, SavedBook>, names: Map<string, string>) {
  const grouped = new Map<string, ReviewRow[]>();

  for (const row of rows) {
    const book = books.get(row.book_id);
    if (!book) {
      continue;
    }

    const list = grouped.get(book.open_library_work_key) ?? [];
    list.push(row);
    grouped.set(book.open_library_work_key, list);
  }

  const reviews = new Map<string, ReaderReview>();

  for (const [workId, list] of grouped) {
    const featured = list.find((row) => row.scope === "book") ?? list[0];
    const rated = list
      .map((row) => (row.stars == null ? null : Number(row.stars)))
      .filter((value): value is number => value != null && !Number.isNaN(value));
    const average =
      rated.length === 0 ? null : Math.round((rated.reduce((sum, value) => sum + value, 0) / rated.length) * 10) / 10;

    reviews.set(workId, {
      count: list.length,
      averageStars: average,
      reader: names.get(featured.user_id) ?? "Reader",
      scopeLabel: featured.scope === "chapter" ? `Chapter: ${featured.chapter_label}` : "Whole book",
      lesson: featured.lesson,
      application: featured.application,
      whoItsFor: featured.who_its_for,
      whoShouldSkip: featured.who_should_skip,
    });
  }

  return reviews;
}

function toHit(book: SavedBook): BookHit {
  return {
    id: book.open_library_work_key,
    title: book.title,
    authors: book.authors ?? [],
    coverUrl: book.cover_url,
    firstPublishYear: book.first_publish_year,
    editionCount: null,
    pages: null,
    firstSentence: null,
  };
}
