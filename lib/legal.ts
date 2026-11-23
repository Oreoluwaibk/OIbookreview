import { readFile } from "node:fs/promises";
import path from "node:path";
import { connection } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export const legalSlugs = ["privacy", "terms", "delete"] as const;

export type LegalSlug = (typeof legalSlugs)[number];

export type LegalDocument = {
  slug: LegalSlug;
  title: string;
  body: string;
  updatedAt: string | null;
};

const fallbackCopy: Record<LegalSlug, { title: string; body: string }> = {
  privacy: {
    title: "Privacy",
    body: "The privacy notice has not been written yet.",
  },
  terms: {
    title: "Terms of use",
    body: "The terms of use have not been written yet.",
  },
  delete: {
    title: "Delete account",
    body: "The deletion notice has not been written yet.",
  },
};

export function isLegalSlug(value: string): value is LegalSlug {
  return (legalSlugs as readonly string[]).includes(value);
}

async function readJsonFile(filePath: string) {
  try {
    const raw = await readFile(filePath, "utf8");
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export async function defaultLegalDocument(slug: LegalSlug): Promise<LegalDocument> {
  const parsed = await readJsonFile(path.join(process.cwd(), "content", "legal-defaults.json"));
  return asDocument(slug, parsed?.[slug]) ?? { slug, ...fallbackCopy[slug], updatedAt: null };
}

function asDocument(slug: LegalSlug, value: unknown): LegalDocument | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const row = value as Record<string, unknown>;
  const title = typeof row.title === "string" ? row.title.trim() : "";
  const body = typeof row.body === "string" ? row.body.trim() : "";
  const updatedAt = typeof row.updatedAt === "string" ? row.updatedAt : typeof row.updated_at === "string" ? row.updated_at : null;

  if (!title || !body) {
    return null;
  }

  return { slug, title, body, updatedAt };
}

async function readLocalDocument(slug: LegalSlug) {
  const parsed = await readJsonFile(path.join(process.cwd(), "content", "legal.json"));
  return parsed ? asDocument(slug, parsed[slug]) : null;
}

async function readSupabaseDocument(slug: LegalSlug) {
  if (!isSupabaseConfigured()) {
    return null;
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from("site_pages").select("title, body, updated_at").eq("slug", slug).maybeSingle();
    if (error || !data) {
      return null;
    }

    return asDocument(slug, data);
  } catch {
    return null;
  }
}

export async function loadLegalDocument(slug: LegalSlug): Promise<LegalDocument> {
  await connection();
  const stored = (await readSupabaseDocument(slug)) ?? (await readLocalDocument(slug));
  return stored ?? (await defaultLegalDocument(slug));
}
