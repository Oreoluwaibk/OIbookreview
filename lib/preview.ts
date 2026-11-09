import { cacheLife } from "next/cache";
import { chapterName, type BookDetail } from "@/lib/open-library";

export type BookPreview = {
  source: "ai" | "catalog";
  about: string | null;
  like: string | null;
  forReaders: string | null;
  skip: string | null;
  facts: string[];
};

type PreviewSource = {
  title: string;
  authors: string[];
  year: number | null;
  pages: number | null;
  subjects: string[];
  description: string | null;
  chapters: string[];
  authorNote: string | null;
};

export function catalogPreview(book: BookDetail): BookPreview {
  const facts: string[] = [];

  if (book.firstPublishYear) {
    facts.push(`First published ${book.firstPublishYear}`);
  }

  if (book.pages) {
    facts.push(`About ${book.pages} pages`);
  }

  if (book.chapters.length > 0) {
    const opening = chapterName(book.chapters[0]);
    facts.push(
      book.chapters.length === 1
        ? `1 chapter, ${opening}`
        : `${book.chapters.length} chapters, from ${opening}`,
    );
  }

  if (book.subjects.length > 0) {
    facts.push(book.subjects.join(" · "));
  }

  return {
    source: "catalog",
    about: book.description,
    like: null,
    forReaders:
      book.subjects.length > 0
        ? `The catalog places it with ${book.subjects.slice(0, 3).join(", ")}.`
        : null,
    skip: null,
    facts,
  };
}

export function previewSource(book: BookDetail): PreviewSource {
  return {
    title: book.title,
    authors: book.authors,
    year: book.firstPublishYear,
    pages: book.pages,
    subjects: book.subjects,
    description: book.description,
    chapters: book.chapters.slice(0, 12).map(chapterName),
    authorNote: book.authorsAbout[0]?.bio?.slice(0, 500) ?? null,
  };
}

export async function writeAiPreview(source: PreviewSource) {
  "use cache";
  cacheLife("days");

  const key = process.env.AI_API_KEY || process.env.OPENAI_API_KEY;
  if (!key) {
    return null;
  }

  const baseUrl = (process.env.AI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "");
  const model = process.env.AI_MODEL || "gpt-4o-mini";
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.3,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You write a short spoiler-free preview so a person can decide whether to read a book. Use only the source notes. Do not invent plot events, awards, quotes, or opinions that the notes do not support. Do not reveal the ending, a twist, or a death. Write plain sentences. Return JSON with keys about, like, forReaders, and skip. Each value is one or two sentences.",
        },
        {
          role: "user",
          content: JSON.stringify(source),
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error("The preview could not be written.");
  }

  const data = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = data.choices?.[0]?.message?.content ?? "";
  return parsePreview(content);
}

function parsePreview(content: string) {
  const cleaned = content.replace(/```json|```/g, "").trim();
  const parsed = JSON.parse(cleaned) as Record<string, unknown>;
  const about = sentence(parsed.about);
  const like = sentence(parsed.like);
  const forReaders = sentence(parsed.forReaders);
  const skip = sentence(parsed.skip);

  if (!about && !like && !forReaders && !skip) {
    return null;
  }

  return { about, like, forReaders, skip };
}

function sentence(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const text = value.replace(/\s+/g, " ").trim();
  if (text.length < 20) {
    return null;
  }

  return text.length > 500 ? `${text.slice(0, 500).trim()}…` : text;
}
