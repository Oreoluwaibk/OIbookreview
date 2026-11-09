import { cacheLife } from "next/cache";

export type BookHit = {
  id: string;
  title: string;
  authors: string[];
  coverUrl: string | null;
  firstPublishYear: number | null;
  editionCount: number | null;
  pages: number | null;
  firstSentence: string | null;
};

export type EditionHit = {
  key: string;
  title: string;
  publisher: string | null;
  publishYear: number | null;
  isbn13: string | null;
  pageCount: number | null;
  translator: string | null;
};

export type Chapter = {
  label: string | null;
  title: string;
  page: string | null;
  level: number;
};

export type AuthorProfile = {
  name: string;
  bio: string | null;
  birthDate: string | null;
  source: "catalog" | "wikipedia" | null;
};

export type BookDetail = BookHit & {
  description: string | null;
  subjects: string[];
  chapters: Chapter[];
  authorsAbout: AuthorProfile[];
  editions: EditionHit[];
};

type SearchDoc = {
  key?: string;
  title?: string;
  author_name?: string[];
  cover_i?: number;
  first_publish_year?: number;
  edition_count?: number;
  number_of_pages_median?: number;
  first_sentence?: unknown;
};

type EditionEntry = {
  key?: string;
  title?: string;
  publishers?: string[];
  publish_date?: string;
  isbn_13?: string[];
  number_of_pages?: number;
  contributions?: string[];
};

type WorkRecord = {
  description?: unknown;
  subjects?: unknown;
  genres?: unknown;
  authors?: { author?: { key?: string } }[];
};

const SEARCH_FIELDS =
  "key,title,author_name,cover_i,first_publish_year,edition_count,number_of_pages_median,first_sentence";

type AuthorRecord = {
  name?: string;
  bio?: unknown;
  birth_date?: string;
};

type TocItem = {
  title?: string;
  label?: string;
  pagenum?: string;
  level?: number;
};

const OPEN_LIBRARY_HEADERS = {
  "User-Agent": "BookReview/0.1 (personal reading shelf)",
  Accept: "application/json",
};

export function coverUrl(coverId: number | null | undefined, size: "S" | "M" | "L" = "M") {
  if (!coverId) {
    return null;
  }

  return `https://covers.openlibrary.org/b/id/${coverId}-${size}.jpg`;
}

export function workPath(workId: string) {
  return `/books/${workId}`;
}

function normalizeQuery(query: string) {
  const compact = query.replace(/[-\s]/g, "");
  if (/^(?:\d{9}[\dXx]|\d{13})$/.test(compact)) {
    return `isbn:${compact.toUpperCase()}`;
  }

  return query.trim();
}

function readDescription(value: unknown) {
  if (typeof value === "string") {
    return value.trim();
  }

  if (
    value &&
    typeof value === "object" &&
    "value" in value &&
    typeof value.value === "string"
  ) {
    return value.value.trim();
  }

  return null;
}

function yearFrom(value: string | undefined) {
  const match = value?.match(/\d{4}/);
  return match ? Number(match[0]) : null;
}

const FRONT_MATTER =
  /^(cover|covers|title page|half title|copyright|contents|table of contents|dedication|frontispiece|list of illustrations)$/i;

export function chapterName(chapter: Chapter) {
  const label = chapter.label?.trim() ?? "";
  const title = chapter.title.trim();
  if (label && title && label.toLowerCase() !== title.toLowerCase()) {
    return `${label}. ${title}`;
  }

  return title || label;
}

function readText(value: unknown) {
  const raw = readDescription(value);
  if (!raw) {
    return null;
  }

  const text = raw
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return text || null;
}

function normalizeChapters(items: TocItem[] | undefined) {
  if (!Array.isArray(items)) {
    return [] as Chapter[];
  }

  const chapters: Chapter[] = [];
  for (const item of items) {
    const title = typeof item?.title === "string" ? item.title.trim() : "";
    const label = typeof item?.label === "string" ? item.label.trim() : "";
    const name = title || label;
    if (!name || FRONT_MATTER.test(name)) {
      continue;
    }

    const level = typeof item?.level === "number" ? item.level : 0;
    if (level > 1) {
      continue;
    }

    const page = typeof item?.pagenum === "string" && item.pagenum.trim() ? item.pagenum.trim() : null;
    chapters.push({
      label: label || null,
      title: title || label,
      page,
      level,
    });

    if (chapters.length >= 80) {
      break;
    }
  }

  return chapters;
}

const CATALOG_RELAY = "https://r.jina.ai/";

let catalogRelayUntil = 0;

function catalogBody(value: unknown) {
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
      return trimmed;
    }
  }

  if (value && typeof value === "object") {
    return JSON.stringify(value);
  }

  return null;
}

async function fetchDirect(url: string) {
  try {
    const response = await fetch(url, {
      headers: OPEN_LIBRARY_HEADERS,
      signal: AbortSignal.timeout(6000),
    });
    if (response.status === 429 || response.status >= 500) {
      return null;
    }

    return response;
  } catch {
    return null;
  }
}

async function fetchThroughRelay(url: string) {
  const response = await fetch(`${CATALOG_RELAY}${url}`, {
    headers: {
      "User-Agent": OPEN_LIBRARY_HEADERS["User-Agent"],
      Accept: "application/json",
      "X-Return-Format": "text",
    },
    signal: AbortSignal.timeout(20000),
  });
  if (!response.ok) {
    throw new Error("The book catalog could not be reached.");
  }

  const envelope = (await response.json()) as { data?: { text?: unknown } };
  const body = catalogBody(envelope.data?.text);
  if (!body) {
    throw new Error("The book catalog could not be reached.");
  }

  return new Response(body, {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

async function fetchResponse(url: string) {
  if (Date.now() >= catalogRelayUntil) {
    const direct = await fetchDirect(url);
    if (direct) {
      return direct;
    }

    catalogRelayUntil = Date.now() + 60_000;
  }

  return fetchThroughRelay(url);
}

async function fetchJson<T>(url: string): Promise<T | null> {
  const response = await fetchResponse(url);
  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`catalog ${response.status}`);
  }

  return (await response.json()) as T;
}

async function wikipediaExtract(name: string) {
  const title = encodeURIComponent(name.trim().replace(/\s+/g, "_"));
  if (!title) {
    return null;
  }

  try {
    const response = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${title}`, {
      headers: {
        "User-Agent": OPEN_LIBRARY_HEADERS["User-Agent"],
        Accept: "application/json",
      },
    });
    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as { type?: string; extract?: string };
    if (data.type === "disambiguation") {
      return null;
    }

    const extract = data.extract?.trim();
    if (!extract || /may refer to/i.test(extract)) {
      return null;
    }

    return extract;
  } catch {
    return null;
  }
}

async function loadAuthors(authorKeys: string[], fallbackNames: string[]) {
  const keys = authorKeys.filter((key) => key.startsWith("/authors/")).slice(0, 3);
  const records = await Promise.all(
    keys.map(async (key) => {
      try {
        return await fetchJson<AuthorRecord>(`https://openlibrary.org${key}.json`);
      } catch {
        return null;
      }
    }),
  );
  const names =
    records.length > 0
      ? records.map((record, index) => record?.name?.trim() || fallbackNames[index] || "Author")
      : fallbackNames.slice(0, 2);

  return Promise.all(
    names.map(async (name, index) => {
      const record = records[index];
      const catalogBio = record ? readText(record.bio) : null;
      const birthDate = record?.birth_date?.trim() || null;
      if (catalogBio) {
        return {
          name,
          bio: catalogBio,
          birthDate,
          source: "catalog" as const,
        };
      }

      const bio = await wikipediaExtract(name);
      return {
        name,
        bio,
        birthDate,
        source: bio ? ("wikipedia" as const) : null,
      };
    }),
  );
}

async function loadChapters(editionKeys: string[]) {
  let best: Chapter[] = [];
  const keys = editionKeys.slice(0, Date.now() < catalogRelayUntil ? 4 : 16);

  for (let index = 0; index < keys.length; index += 4) {
    const lists = await Promise.all(
      keys.slice(index, index + 4).map(async (key) => {
        try {
          const edition = await fetchJson<{ table_of_contents?: TocItem[] }>(
            `https://openlibrary.org/books/${key}.json`,
          );
          return normalizeChapters(edition?.table_of_contents);
        } catch {
          return [] as Chapter[];
        }
      }),
    );

    for (const list of lists) {
      if (list.length > best.length) {
        best = list;
      }
    }

    if (best.length >= 8) {
      break;
    }
  }

  return best;
}

function translatorFrom(contributions: string[] | undefined) {
  const hit = contributions?.find((item) => /translator/i.test(item));
  if (!hit) {
    return null;
  }

  const name = hit
    .replace(/\(.*?\)/g, "")
    .replace(/,?\s*translators?\.?$/i, "")
    .trim();
  return name || null;
}

function readFirstSentence(value: unknown) {
  const sentences = Array.isArray(value) ? value : [value];
  const first = sentences.find((item) => typeof item === "string" && item.trim());
  return typeof first === "string" ? first.replace(/\s+/g, " ").trim() : null;
}

function readSubjects(...groups: unknown[]) {
  const subjects: string[] = [];
  const seen = new Set<string>();

  for (const group of groups) {
    if (!Array.isArray(group)) {
      continue;
    }

    for (const item of group) {
      if (typeof item !== "string") {
        continue;
      }

      const clean = item.trim();
      const key = clean.toLowerCase();
      if (!clean || seen.has(key)) {
        continue;
      }

      seen.add(key);
      subjects.push(clean);
      if (subjects.length >= 6) {
        return subjects;
      }
    }
  }

  return subjects;
}

function toHit(doc: SearchDoc): BookHit | null {
  if (!doc.key?.startsWith("/works/") || !doc.title) {
    return null;
  }

  return {
    id: doc.key.replace("/works/", ""),
    title: doc.title,
    authors: doc.author_name ?? [],
    coverUrl: coverUrl(doc.cover_i, "M"),
    firstPublishYear: doc.first_publish_year ?? null,
    editionCount: doc.edition_count ?? null,
    pages: doc.number_of_pages_median ?? null,
    firstSentence: readFirstSentence(doc.first_sentence),
  };
}

export async function searchBooks(query: string) {
  "use cache";
  cacheLife("hours");

  const trimmed = query.trim();
  if (!trimmed) {
    return { books: [] as BookHit[], error: null as string | null };
  }

  const url = new URL("https://openlibrary.org/search.json");
  url.searchParams.set("q", normalizeQuery(trimmed));
  url.searchParams.set("limit", "12");
  url.searchParams.set(
    "fields",
    SEARCH_FIELDS,
  );

  try {
    const response = await fetchResponse(url.toString());
    if (!response.ok) {
      return { books: [], error: "The book catalog did not answer. Try the search again." };
    }

    const data = (await response.json()) as { docs?: SearchDoc[] };
    const books = (data.docs ?? [])
      .map(toHit)
      .filter((book): book is BookHit => book !== null);

    return { books, error: null };
  } catch {
    return { books: [], error: "The book catalog could not be reached." };
  }
}

export async function getBook(workId: string): Promise<BookDetail | null> {
  "use cache";
  cacheLife("days");

  if (!/^OL\d+W$/.test(workId)) {
    return null;
  }

  const searchUrl = new URL("https://openlibrary.org/search.json");
  searchUrl.searchParams.set("q", `key:/works/${workId}`);
  searchUrl.searchParams.set("limit", "1");
  searchUrl.searchParams.set(
    "fields",
    SEARCH_FIELDS,
  );

  const [searchResponse, workResponse, editionsResponse] = await Promise.all([
    fetchResponse(searchUrl.toString()),
    fetchResponse(`https://openlibrary.org/works/${workId}.json`),
    fetchResponse(`https://openlibrary.org/works/${workId}/editions.json?limit=16`).catch(() => null),
  ]);

  if (workResponse.status === 404) {
    return null;
  }

  if (!searchResponse.ok || !workResponse.ok) {
    throw new Error("The book catalog could not be reached.");
  }

  const searchData = (await searchResponse.json()) as { docs?: SearchDoc[] };
  const hit = toHit(searchData.docs?.[0] ?? {});
  if (!hit) {
    return null;
  }

  const work = (await workResponse.json()) as WorkRecord;
  const editionsData =
    editionsResponse && editionsResponse.ok
      ? ((await editionsResponse.json()) as { entries?: EditionEntry[] })
      : { entries: [] };

  const editions = (editionsData.entries ?? [])
    .filter((entry) => entry.key?.startsWith("/books/"))
    .map((entry) => ({
      key: entry.key?.replace("/books/", "") ?? "",
      title: entry.title ?? hit.title,
      publisher: entry.publishers?.[0] ?? null,
      publishYear: yearFrom(entry.publish_date),
      isbn13: entry.isbn_13?.[0] ?? null,
      pageCount: entry.number_of_pages ?? null,
      translator: translatorFrom(entry.contributions),
    }))
    .filter((edition) => edition.key);

  const authorKeys = (work.authors ?? [])
    .map((entry) => entry.author?.key)
    .filter((key): key is string => Boolean(key));
  const [chapters, authorsAbout] = await Promise.all([
    loadChapters(editions.map((edition) => edition.key)),
    loadAuthors(authorKeys, hit.authors),
  ]);

  return {
    ...hit,
    description: readText(work.description),
    subjects: readSubjects(work.subjects, work.genres),
    chapters,
    authorsAbout,
    editions,
  };
}
