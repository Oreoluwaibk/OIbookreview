"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getBook } from "@/lib/open-library";
import { getOptionalUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type ReadingState = {
  error?: string;
  message?: string;
};

const STATUSES = ["want", "reading", "finished", "stopped"] as const;
const FORMATS = ["print", "ebook", "audio"] as const;
const SOURCES = ["bought", "library", "advance"] as const;

function oneOf<T extends string>(value: FormDataEntryValue | null, allowed: readonly T[]) {
  return typeof value === "string" && allowed.includes(value as T) ? (value as T) : null;
}

export async function saveReading(
  _state: ReadingState,
  formData: FormData,
): Promise<ReadingState> {
  const user = await getOptionalUser();
  const workId = String(formData.get("workId") ?? "");
  const next = `/books/${workId}`;

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(next)}`);
  }

  const book = await getBook(workId);
  if (!book) {
    return { error: "That book could not be found." };
  }

  const status = oneOf(formData.get("status"), STATUSES);
  const format = oneOf(formData.get("format"), FORMATS);
  if (!status || !format) {
    return { error: "Choose a status and a format." };
  }

  const source = oneOf(formData.get("copySource"), SOURCES);
  const progressRaw = String(formData.get("progress") ?? "").trim();
  let progress: number | null = null;

  if (progressRaw) {
    progress = Number(progressRaw);
    if (!Number.isInteger(progress) || progress < 0 || progress > 100) {
      return { error: "Progress is a whole number from 0 to 100." };
    }
  }

  const editionKey = String(formData.get("editionKey") ?? "");
  const edition = book.editions.find((item) => item.key === editionKey) ?? null;
  const asNewReading = formData.get("newReading") === "on";
  const supabase = await createClient();

  const { data: savedBook, error: bookError } = await supabase
    .from("books")
    .upsert(
      {
        open_library_work_key: book.id,
        title: book.title,
        authors: book.authors,
        cover_url: book.coverUrl,
        first_publish_year: book.firstPublishYear,
      },
      { onConflict: "open_library_work_key" },
    )
    .select("id")
    .single();

  if (bookError || !savedBook) {
    return { error: bookError?.message ?? "The book could not be saved." };
  }

  let editionId: string | null = null;

  if (edition) {
    const { data: savedEdition, error: editionError } = await supabase
      .from("editions")
      .upsert(
        {
          book_id: savedBook.id,
          open_library_edition_key: edition.key,
          isbn13: edition.isbn13,
          publisher: edition.publisher,
          publish_year: edition.publishYear,
          translator: edition.translator,
          page_count: edition.pageCount,
        },
        { onConflict: "book_id,open_library_edition_key" },
      )
      .select("id")
      .single();

    if (editionError || !savedEdition) {
      return { error: editionError?.message ?? "The edition could not be saved." };
    }

    editionId = savedEdition.id;
  }

  const today = new Date().toISOString().slice(0, 10);
  const payload = {
    user_id: user.id,
    book_id: savedBook.id,
    edition_id: editionId,
    status,
    format,
    progress_percent: progress,
    copy_source: source,
    started_on: status === "want" ? null : today,
    finished_on: status === "finished" || status === "stopped" ? today : null,
    updated_at: new Date().toISOString(),
  };

  const { data: existing } = await supabase
    .from("readings")
    .select("id, started_on")
    .eq("user_id", user.id)
    .eq("book_id", savedBook.id)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const error = existing && !asNewReading
    ? (
        await supabase
          .from("readings")
          .update({
            ...payload,
            started_on: existing.started_on ?? payload.started_on,
          })
          .eq("id", existing.id)
          .eq("user_id", user.id)
      ).error
    : (await supabase.from("readings").insert(payload)).error;

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/library");
  revalidatePath(next);
  return { message: asNewReading || !existing ? "Saved on your shelf." : "Updated your reading." };
}
