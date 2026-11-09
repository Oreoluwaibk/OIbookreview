"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getBook } from "@/lib/open-library";
import { getOptionalUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type ReviewState = {
  error?: string;
  message?: string;
};

function optionalText(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text || null;
}

function requiredText(value: FormDataEntryValue | null, label: string) {
  const text = String(value ?? "").trim();
  if (text.length < 8) {
    return { text: "", error: `${label} needs a few more words.` };
  }

  return { text, error: null };
}

export async function publishReview(
  _state: ReviewState,
  formData: FormData,
): Promise<ReviewState> {
  const workId = String(formData.get("workId") ?? "");
  const next = `/books/${workId}`;
  const user = await getOptionalUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(next)}`);
  }

  const book = await getBook(workId);
  if (!book) {
    return { error: "That book could not be found." };
  }

  const scope = formData.get("scope") === "chapter" ? "chapter" : "book";
  const chapterLabel = String(formData.get("chapterLabel") ?? "").trim();

  if (scope === "chapter" && chapterLabel.length < 1) {
    return { error: "Name the chapter this review is about." };
  }

  if (chapterLabel.length > 80) {
    return { error: "Keep the chapter name under 80 characters." };
  }

  const fields = [
    requiredText(formData.get("lesson"), "The lesson"),
    requiredText(formData.get("application"), "What you are going to do"),
    requiredText(formData.get("whoItsFor"), "Who it is for"),
  ];
  const invalid = fields.find((field) => field.error);
  if (invalid?.error) {
    return { error: invalid.error };
  }

  const starsRaw = String(formData.get("stars") ?? "").trim();
  let stars: number | null = null;
  if (starsRaw) {
    stars = Number(starsRaw);
    if (!Number.isInteger(stars) || stars < 1 || stars > 5) {
      return { error: "Stars are a whole number from 1 to 5, or leave them blank." };
    }
  }

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

  const { data: reading } = await supabase
    .from("readings")
    .select("id")
    .eq("user_id", user.id)
    .eq("book_id", savedBook.id)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await supabase.from("reviews").insert({
    user_id: user.id,
    reading_id: reading?.id ?? null,
    book_id: savedBook.id,
    scope,
    chapter_label: scope === "chapter" ? chapterLabel : null,
    lesson: fields[0].text,
    application: fields[1].text,
    who_its_for: fields[2].text,
    who_should_skip: null,
    observation: optionalText(formData.get("observation")),
    stars,
  });

  if (error) {
    if (
      error.message.includes("lesson") ||
      error.message.includes("application") ||
      error.message.includes("who_should_skip") ||
      error.message.includes("observation")
    ) {
      return {
        error: "Run supabase/migrate-review-lesson.sql in the Supabase SQL editor, then publish again.",
      };
    }

    if (error.message.includes("scope") || error.message.includes("chapter_label")) {
      return {
        error: "Run supabase/migrate-reviews.sql in the Supabase SQL editor, then publish again.",
      };
    }

    return { error: error.message };
  }

  revalidatePath(next);
  revalidatePath("/search");
  return { message: scope === "chapter" ? "Chapter review published." : "Book review published." };
}
