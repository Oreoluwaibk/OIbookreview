import { io } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export type CurrentUser = {
  id: string;
  email: string;
  displayName: string;
};

export async function getOptionalUser(): Promise<CurrentUser | null> {
  await io();

  if (!isSupabaseConfigured()) {
    return null;
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return null;
  }

  const metadataName = data.user.user_metadata?.display_name;
  const displayName =
    typeof metadataName === "string" && metadataName.trim()
      ? metadataName.trim()
      : (data.user.email?.split("@")[0] ?? "Reader");

  return {
    id: data.user.id,
    email: data.user.email ?? "",
    displayName,
  };
}
