"use server";

import { revalidatePath } from "next/cache";
import { getOptionalUser } from "@/lib/auth";
import { recordGrowth } from "@/lib/growth";
import { createClient } from "@/lib/supabase/server";

export type ProfileState = {
  error?: string;
  message?: string;
};

const imageTypes: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

function migrationHint(message: string) {
  if (/avatar_url|bio|updated_at|reader_growth|avatars|schema cache/i.test(message)) {
    return "Run supabase/migrate-profile-growth.sql in the Supabase SQL editor, then save again.";
  }

  return message;
}

export async function updateProfile(_state: ProfileState, formData: FormData): Promise<ProfileState> {
  const user = await getOptionalUser();
  if (!user) {
    return { error: "Sign in before changing your profile." };
  }

  const displayName = String(formData.get("displayName") ?? "").trim();
  const bioRaw = String(formData.get("bio") ?? "").trim();

  if (displayName.length < 2) {
    return { error: "Add the name you want on your shelf." };
  }

  if (displayName.length > 80) {
    return { error: "Keep your name under 80 characters." };
  }

  if (bioRaw.length > 280) {
    return { error: "Keep the short note under 280 characters." };
  }

  const supabase = await createClient();
  const { error: authError } = await supabase.auth.updateUser({
    data: { display_name: displayName },
  });

  if (authError) {
    return { error: authError.message };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: displayName,
      bio: bioRaw || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    return { error: migrationHint(error.message) };
  }

  revalidatePath("/profile");
  revalidatePath("/");
  return { message: "Profile saved." };
}

export async function updateAvatar(_state: ProfileState, formData: FormData): Promise<ProfileState> {
  const user = await getOptionalUser();
  if (!user) {
    return { error: "Sign in before adding a picture." };
  }

  const file = formData.get("avatar");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose a picture." };
  }

  if (file.size > 1024 * 1024) {
    return { error: "Use a picture under 1 MB." };
  }

  const extension = imageTypes[file.type];
  if (!extension) {
    return { error: "Use a JPEG, PNG, WebP, or GIF." };
  }

  const supabase = await createClient();
  const path = `${user.id}/avatar.${extension}`;
  const bytes = new Uint8Array(await file.arrayBuffer());
  const { error: uploadError } = await supabase.storage.from("avatars").upload(path, bytes, {
    upsert: true,
    contentType: file.type,
    cacheControl: "3600",
  });

  if (uploadError) {
    return { error: migrationHint(uploadError.message) };
  }

  const { data } = supabase.storage.from("avatars").getPublicUrl(path);
  const avatarUrl = `${data.publicUrl}?v=${Date.now()}`;
  const { error } = await supabase
    .from("profiles")
    .update({ avatar_url: avatarUrl, updated_at: new Date().toISOString() })
    .eq("id", user.id);

  if (error) {
    return { error: migrationHint(error.message) };
  }

  revalidatePath("/profile");
  return { message: "Picture saved." };
}

export async function removeAvatar(): Promise<ProfileState> {
  const user = await getOptionalUser();
  if (!user) {
    return { error: "Sign in before removing a picture." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ avatar_url: null, updated_at: new Date().toISOString() })
    .eq("id", user.id);

  if (error) {
    return { error: migrationHint(error.message) };
  }

  revalidatePath("/profile");
  return { message: "Picture removed." };
}

export async function saveGrowthSnapshot(): Promise<ProfileState> {
  const user = await getOptionalUser();
  if (!user) {
    return {};
  }

  const supabase = await createClient();
  const { error } = await recordGrowth(supabase, user.id);
  if (!error) {
    return {};
  }

  return { error: migrationHint(error) };
}
