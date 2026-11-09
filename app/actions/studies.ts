"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { lookupVerse } from "@/lib/bible";
import { getOptionalUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type StudyState = {
  error?: string;
  message?: string;
};

const themes = new Set(["book", "topic", "character", "other"]);

export async function publishStudy(_state: StudyState, formData: FormData): Promise<StudyState> {
  const user = await getOptionalUser();
  if (!user) {
    redirect("/login?next=/study");
  }

  const theme = String(formData.get("theme") ?? "");
  const subject = String(formData.get("subject") ?? "").trim();
  const themeLabel = String(formData.get("themeLabel") ?? "").trim();
  const chapters = String(formData.get("chapters") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();
  const lesson = String(formData.get("lesson") ?? "").trim();
  const application = String(formData.get("application") ?? "").trim();
  const visibility = formData.get("visibility") === "private" ? "private" : "public";

  if (!themes.has(theme)) {
    return { error: "Choose a theme." };
  }

  if (subject.length < 2) {
    return { error: "Name the book, topic, or character." };
  }

  if (theme === "other" && themeLabel.length < 2) {
    return { error: "Name this theme." };
  }

  if (notes.length < 8 && lesson.length < 8) {
    return { error: "Add a few words in the notes or the lesson." };
  }

  let requested: { reference?: string; version?: string }[] = [];
  try {
    requested = JSON.parse(String(formData.get("verses") ?? "[]"));
  } catch {
    return { error: "The verses could not be read. Look them up again." };
  }

  if (!Array.isArray(requested) || requested.length === 0) {
    return { error: "Look up at least one verse before publishing." };
  }

  const verses = [];
  for (const item of requested.slice(0, 12)) {
    const found = await lookupVerse(String(item.reference ?? ""), String(item.version ?? ""));
    if ("error" in found) {
      return { error: found.error };
    }
    verses.push(found);
  }

  const supabase = await createClient();
  const { data: study, error } = await supabase
    .from("studies")
    .insert({
      user_id: user.id,
      theme,
      theme_label: theme === "other" ? themeLabel : null,
      subject,
      chapters: theme === "book" && chapters ? chapters : null,
      notes: notes || null,
      lesson: lesson || null,
      application: application || null,
      visibility,
    })
    .select("id")
    .single();

  if (error || !study) {
    if (error?.message.includes("chapters")) {
      return { error: "Run supabase/migrate-study-chapters.sql in the Supabase SQL editor, then save again." };
    }
    if (error?.message.includes("visibility")) {
      return { error: "Run supabase/migrate-study-visibility.sql in the Supabase SQL editor, then save again." };
    }
    if (error?.message.includes("studies")) {
      return { error: "Run supabase/migrate-studies.sql in the Supabase SQL editor, then save again." };
    }
    return { error: error?.message ?? "The study could not be saved." };
  }

  const { error: verseError } = await supabase.from("study_verses").insert(
    verses.map((verse, position) => ({
      study_id: study.id,
      reference: verse.reference,
      version: verse.version,
      text: verse.text,
      attribution: verse.attribution,
      position,
    })),
  );

  if (verseError) {
    return { error: verseError.message };
  }

  revalidatePath("/study");
  const params = new URLSearchParams({ theme, q: subject });
  redirect(`/study?${params.toString()}`);
}
