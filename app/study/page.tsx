import Link from "next/link";
import { Suspense } from "react";
import { StudyForm } from "@/components/study-form";
import { getOptionalUser } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

const themeName = {
  book: "Book review",
  topic: "Topic review",
  character: "Character review",
  other: "Other",
} as const;

export default function StudyPage({
  searchParams,
}: {
  searchParams: Promise<{ theme?: string; q?: string }>;
}) {
  return (
    <Suspense
      fallback={
        <main className="mx-auto w-full max-w-5xl px-4 py-8 text-ink-soft sm:px-6 sm:py-10">Opening the study…</main>
      }
    >
      <StudyContent searchParams={searchParams} />
    </Suspense>
  );
}

async function StudyContent({
  searchParams,
}: {
  searchParams: Promise<{ theme?: string; q?: string }>;
}) {
  const { theme: themeParam = "", q = "" } = await searchParams;
  const theme = Object.hasOwn(themeName, themeParam) ? (themeParam as StudyTheme) : "";
  const query = q.trim();
  const user = isSupabaseConfigured() ? await getOptionalUser() : null;
  const studies = await loadStudies(theme, query);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-4 py-8 sm:px-6 sm:py-10">
      <section className="max-w-2xl">
        <h1 className="font-serif text-3xl sm:text-4xl">Bible study</h1>
        <p className="mt-3 text-lg leading-8 text-ink-soft">
          Choose who can see a study. A public one shows up for anyone on the same theme and subject. A private one stays here only for you.
        </p>
      </section>
      <section className="grid gap-4">
        <h2 className="font-serif text-2xl break-words">{listTitle(theme, query)}</h2>
        <form action="/study" className="grid gap-3 sm:grid-cols-2 md:grid-cols-[minmax(0,13rem)_minmax(0,1fr)_auto]">
          <label className="sr-only" htmlFor="theme">
            Theme
          </label>
          <select
            id="theme"
            name="theme"
            defaultValue={theme}
            className="min-w-0 rounded-full border border-line bg-paper-raised px-4 py-3 text-ink"
          >
            <option value="">All themes</option>
            <option value="book">Book review</option>
            <option value="topic">Topic review</option>
            <option value="character">Character review</option>
            <option value="other">Other</option>
          </select>
          <label className="sr-only" htmlFor="q">
            Subject
          </label>
          <input
            id="q"
            name="q"
            defaultValue={query}
            placeholder="Same book, topic, or character"
            className="min-w-0 w-full rounded-full border border-line bg-paper-raised px-5 py-3 text-ink placeholder:text-ink-soft"
          />
          <button type="submit" className="rounded-full bg-lake px-6 py-3 font-semibold text-white hover:bg-lake-deep sm:col-span-2 md:col-span-1">
            Show studies
          </button>
        </form>
        {studies.error ? <p className="text-sm text-clay">{studies.error}</p> : null}
        {studies.rows.length === 0 && !studies.error ? (
          <p className="text-ink-soft">
            {theme || query
              ? "No studies on this yet. A public one will show up here for everyone. A private one shows up only for you."
              : "No studies yet."}
          </p>
        ) : (
          <ul className="grid gap-4">
            {studies.rows.map((study) => (
              <li key={study.id} className="rounded-3xl border border-line bg-paper-raised p-4 sm:p-5">
                <p className="text-sm text-lake-deep">
                  {[
                    study.visibility === "private" ? "Only you" : null,
                    study.names,
                    study.theme === "other" ? study.theme_label : themeName[study.theme],
                    study.subject,
                    study.created_at.slice(0, 10),
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
                <h3 className="mt-2 font-serif text-2xl">{study.subject}</h3>
                {study.chapters ? <p className="mt-1 text-sm text-lake-deep">Chapters {study.chapters}</p> : null}
                <ul className="mt-4 grid gap-3">
                  {study.verses.map((verse) => (
                    <li key={`${verse.reference}-${verse.version}-${verse.position}`} className="text-sm leading-6">
                      <p className="font-semibold">
                        {verse.reference} · {verse.version}
                      </p>
                      <p className="mt-1">{verse.text}</p>
                      <p className="mt-1 text-xs text-ink-soft">{verse.attribution}</p>
                    </li>
                  ))}
                </ul>
                {study.notes ? <StudyPart label="Notes" text={study.notes} /> : null}
                {study.lesson ? <StudyPart label="Lesson learnt" text={study.lesson} /> : null}
                {study.application ? <StudyPart label="What I am going to do" text={study.application} /> : null}
              </li>
            ))}
          </ul>
        )}
        {!user && isSupabaseConfigured() ? (
          <Link href="/login?next=/study" className="w-fit font-semibold text-lake-deep">
            Sign in to publish a study
          </Link>
        ) : null}
      </section>
      <section className="rounded-3xl bg-lake-soft p-4 sm:p-6">
        <h2 className="font-serif text-2xl">Write a study</h2>
        <p className="mt-2 text-sm text-ink-soft">
          Public studies stay with others on the same theme and subject. Private studies stay with you.
        </p>
        <div className="mt-4">
          <StudyForm signedIn={Boolean(user)} />
        </div>
      </section>
    </main>
  );
}

function listTitle(theme: StudyTheme | "", query: string) {
  const themeLabel =
    theme === "other" ? "Other studies" : theme ? `${themeName[theme]}s` : "Studies";
  return query ? `${themeLabel} on “${query}”` : themeLabel;
}

function StudyPart({ label, text }: { label: string; text: string }) {
  return (
    <p className="mt-3 text-sm leading-6">
      <span className="font-semibold">{label}. </span>
      <span className="whitespace-pre-wrap">{text}</span>
    </p>
  );
}

type StudyTheme = keyof typeof themeName;

type StudyRow = {
  id: string;
  theme: StudyTheme;
  visibility: "public" | "private";
  theme_label: string | null;
  subject: string;
  chapters: string | null;
  notes: string | null;
  lesson: string | null;
  application: string | null;
  created_at: string;
  names: string;
  verses: {
    reference: string;
    version: string;
    text: string;
    attribution: string;
    position: number;
  }[];
};

async function loadStudies(
  theme: StudyTheme | "",
  query: string,
): Promise<{ rows: StudyRow[]; error: string | null }> {
  if (!isSupabaseConfigured()) {
    return {
      rows: [],
      error: "Connect Supabase to keep studies. Verse lookup still works on this page.",
    };
  }

  const supabase = await createClient();
  let request = supabase
    .from("studies")
    .select(
      "id, user_id, theme, theme_label, subject, chapters, notes, lesson, application, visibility, created_at, study_verses(reference, version, text, attribution, position)",
    )
    .order("created_at", { ascending: false })
    .limit(30);

  if (theme) {
    request = request.eq("theme", theme);
  }

  const needle = query.replace(/[%_,"]/g, " ").replace(/\s+/g, " ").trim();
  if (needle.length >= 2) {
    const pattern = `%${needle}%`;
    request = request.or(`subject.ilike."${pattern}",theme_label.ilike."${pattern}"`);
  }

  const { data, error } = await request;

  if (error) {
    return {
      rows: [],
      error: error.message.includes("chapters")
        ? "Run supabase/migrate-study-chapters.sql in the Supabase SQL editor so a book study can name its chapters."
        : error.message.includes("visibility")
        ? "Run supabase/migrate-study-visibility.sql in the Supabase SQL editor so a study can be private or public."
        : error.message.includes("studies")
          ? "Run supabase/migrate-studies.sql in the Supabase SQL editor so studies can be stored."
          : error.message,
    };
  }

  const rows = data ?? [];
  const ids = [...new Set(rows.map((row) => row.user_id as string))];
  const names = new Map<string, string>();
  if (ids.length > 0) {
    const { data: profiles } = await supabase.from("profiles").select("id, display_name").in("id", ids);
    for (const profile of profiles ?? []) {
      names.set(profile.id, profile.display_name);
    }
  }

  return {
    rows: rows.map((row) => ({
      id: row.id,
      theme: row.theme as StudyTheme,
      visibility: row.visibility === "private" ? "private" : "public",
      theme_label: row.theme_label,
      subject: row.subject,
      chapters: row.chapters,
      notes: row.notes,
      lesson: row.lesson,
      application: row.application,
      created_at: row.created_at,
      names: names.get(row.user_id) ?? "Reader",
      verses: [...(row.study_verses ?? [])].sort((left, right) => left.position - right.position),
    })),
    error: null,
  };
}
