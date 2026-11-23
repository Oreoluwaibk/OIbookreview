import type { SupabaseClient } from "@supabase/supabase-js";

export type GrowthReview = {
  title: string;
  lesson: string;
  application: string;
};

export type GrowthStudy = {
  theme: string;
  subject: string;
  lesson: string | null;
  application: string | null;
};

export type GrowthSource = {
  finishedTitles: string[];
  readingNow: number;
  studiesDone: number;
  reviewsPublished: number;
  studySubjects: string[];
  reviews: GrowthReview[];
  studies: GrowthStudy[];
};

export type GrowthReading = {
  booksFinished: number;
  studiesDone: number;
  summary: string;
  know: string[];
  doNext: string[];
  become: string[];
};

const virtues = [
  { name: "patient", words: ["patience", "patient", "endurance"] },
  { name: "kind", words: ["kindness", "kind", "compassion", "mercy", "gentle"] },
  { name: "courageous", words: ["courage", "brave", "bold"] },
  { name: "humble", words: ["humble", "humility"] },
  { name: "faithful", words: ["faith", "faithful", "trust", "obey", "obedience"] },
  { name: "wise", words: ["wisdom", "wise", "discern", "discernment"] },
  { name: "loving", words: ["love", "loving"] },
  { name: "hopeful", words: ["hope", "hopeful"] },
  { name: "disciplined", words: ["discipline", "habit", "practice"] },
  { name: "honest", words: ["honest", "truth", "integrity"] },
  { name: "grateful", words: ["grateful", "gratitude", "thankful"] },
  { name: "forgiving", words: ["forgive", "forgiveness"] },
] as const;

function clip(text: string, max = 160) {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) {
    return clean;
  }

  return `${clean.slice(0, max - 1).trimEnd()}…`;
}

function unique(items: string[]) {
  const seen = new Set<string>();
  const kept: string[] = [];

  for (const item of items) {
    const key = item.toLowerCase();
    if (!item || seen.has(key)) {
      continue;
    }
    seen.add(key);
    kept.push(item);
  }

  return kept;
}

function joinList(items: string[]) {
  if (items.length <= 1) {
    return items[0] ?? "";
  }

  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

function hasWord(text: string, word: string) {
  return new RegExp(`\\b${word}\\b`, "i").test(text);
}

function bookTitle(value: unknown) {
  const book = Array.isArray(value) ? value[0] : value;
  if (!book || typeof book !== "object" || !("title" in book)) {
    return null;
  }

  const title = book.title;
  return typeof title === "string" && title.trim() ? title.trim() : null;
}

export function describeGrowth(source: GrowthSource): GrowthReading {
  const booksFinished = source.finishedTitles.length;
  const studiesDone = source.studiesDone;
  const empty = booksFinished === 0 && studiesDone === 0 && source.reviews.length === 0;

  if (empty) {
    return {
      booksFinished,
      studiesDone,
      summary:
        "Finish a book or keep a study, and this reading of your growth will come from what you wrote there.",
      know: ["You should be able to explain one lesson from a book you finished, in a sentence of your own."],
      doNext: ["You should be able to name one thing you are going to do after the next book or study."],
      become: ["You should be the person who turns a lesson into a practice, not only a person who finished the page."],
    };
  }

  const know = unique([
    ...source.reviews.map((review) => `From ${review.title}, you should be able to explain this: ${clip(review.lesson)}`),
    ...source.studies
      .filter((study) => study.lesson)
      .map((study) => `From your study of ${study.subject}, you should be able to explain this: ${clip(study.lesson ?? "")}`),
    ...source.finishedTitles
      .filter((title) => !source.reviews.some((review) => review.title === title))
      .slice(0, 2)
      .map((title) => `You finished ${title}. You should be able to name the lesson in your own words.`),
  ]).slice(0, 4);

  const doNext = unique([
    ...source.reviews.map((review) => `From ${review.title}, you should be able to do this: ${clip(review.application)}`),
    ...source.studies
      .filter((study) => study.application)
      .map((study) => `From your study of ${study.subject}, you should be able to do this: ${clip(study.application ?? "")}`),
  ]).slice(0, 4);

  const corpus = [
    ...source.reviews.flatMap((review) => [review.lesson, review.application]),
    ...source.studies.flatMap((study) => [study.lesson, study.application, study.subject]),
  ]
    .filter(Boolean)
    .join(" ");

  const foundVirtues = virtues.filter((virtue) => virtue.words.some((word) => hasWord(corpus, word))).map((virtue) => virtue.name);
  const characterStudies = source.studies.filter((study) => study.theme === "character");

  const become = unique([
    foundVirtues.length > 0
      ? `You should be a person who is ${joinList(foundVirtues.slice(0, 4))}. Those words are already in what you wrote.`
      : "You should be the person who does the practices you wrote down, not only the person who can explain them.",
    ...characterStudies
      .slice(0, 2)
      .map((study) => `You studied ${study.subject}. Who you should be takes a shape from that life, not only from the notes.`),
  ]).slice(0, 4);

  const bookLine =
    booksFinished === 0
      ? "You have not marked a book finished yet."
      : `You have finished ${booksFinished} ${booksFinished === 1 ? "book" : "books"}.`;
  const studyLine =
    studiesDone === 0
      ? "You have not kept a study yet."
      : `You have kept ${studiesDone} ${studiesDone === 1 ? "study" : "studies"}.`;

  return {
    booksFinished,
    studiesDone,
    summary: `${bookLine} ${studyLine} What you should know is in the lessons you can explain. What you should do is in the practices you named. Who you should be is the person those practices are training.`,
    know: know.length > 0 ? know : ["Write a lesson on the next book or study. That sentence is what you should know."],
    doNext:
      doNext.length > 0
        ? doNext
        : ["Write what you are going to do after the next book or study. That line is what you should be able to do."],
    become,
  };
}

type LooseRow = Record<string, unknown>;

export async function loadGrowthSource(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ source: GrowthSource; error: string | null }> {
  const [readingsResult, studiesResult, reviewsResult, studyCount, reviewCount] = await Promise.all([
    supabase.from("readings").select("status, book_id, books(title)").eq("user_id", userId).limit(300),
    supabase
      .from("studies")
      .select("theme, subject, lesson, application")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(80),
    supabase
      .from("reviews")
      .select("lesson, application, books(title)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(40),
    supabase.from("studies").select("id", { count: "exact", head: true }).eq("user_id", userId),
    supabase.from("reviews").select("id", { count: "exact", head: true }).eq("user_id", userId),
  ]);

  const error = readingsResult.error?.message ?? studiesResult.error?.message ?? reviewsResult.error?.message ?? null;
  const readings = (readingsResult.data ?? []) as LooseRow[];
  const finishedTitles = unique(
    readings
      .filter((row) => row.status === "finished")
      .map((row) => bookTitle(row.books))
      .filter((title): title is string => Boolean(title)),
  );
  const readingNow = readings.filter((row) => row.status === "reading").length;
  const studies = ((studiesResult.data ?? []) as LooseRow[]).map((row) => ({
    theme: String(row.theme ?? ""),
    subject: String(row.subject ?? ""),
    lesson: typeof row.lesson === "string" ? row.lesson : null,
    application: typeof row.application === "string" ? row.application : null,
  }));
  const reviews = ((reviewsResult.data ?? []) as LooseRow[])
    .map((row) => {
      const title = bookTitle(row.books) ?? "a book";
      const lesson = typeof row.lesson === "string" ? row.lesson : "";
      const application = typeof row.application === "string" ? row.application : "";
      return { title, lesson, application };
    })
    .filter((review) => review.lesson || review.application);

  return {
    error,
    source: {
      finishedTitles,
      readingNow,
      studiesDone: studiesResult.error ? 0 : (studyCount.count ?? studies.length),
      reviewsPublished: reviewsResult.error ? 0 : (reviewCount.count ?? reviews.length),
      studySubjects: unique(studies.map((study) => study.subject).filter(Boolean)).slice(0, 8),
      reviews,
      studies,
    },
  };
}

export async function recordGrowth(supabase: SupabaseClient, userId: string) {
  try {
    const { source, error } = await loadGrowthSource(supabase, userId);
    if (error) {
      return { error };
    }

    const growth = describeGrowth(source);
    const { error: saveError } = await supabase.from("reader_growth").upsert(
      {
        user_id: userId,
        books_finished: growth.booksFinished,
        studies_done: growth.studiesDone,
        reviews_published: source.reviewsPublished,
        summary: growth.summary,
        to_know: growth.know,
        to_do: growth.doNext,
        to_be: growth.become,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );

    if (saveError) {
      return { error: saveError.message };
    }

    return { error: null };
  } catch {
    return { error: "Growth could not be saved." };
  }
}
