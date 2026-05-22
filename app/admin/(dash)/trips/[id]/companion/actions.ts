"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { TripCompanion } from "@/lib/supabase/types";

export async function saveTripCompanion(
  tripId: string,
  content: TripCompanion,
): Promise<{ error?: string }> {
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from("trips")
    .update({ companion_content: content })
    .eq("id", tripId);

  if (error) return { error: error.message };

  revalidatePath(`/admin/trips/${tripId}/companion`);
  revalidatePath(`/admin/trips/${tripId}`);
  revalidatePath("/admin/trips");
  revalidatePath("/account/trips", "page");
  revalidatePath("/account", "page");
  return {};
}
