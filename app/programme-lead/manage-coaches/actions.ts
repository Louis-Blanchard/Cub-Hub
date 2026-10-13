
"use server";

import { revalidatePath } from "next/cache";
import { supabaseServer } from "../../../lib/supabase";

export async function updateCoach(formData: FormData) {
  const supabase = await supabaseServer();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "Please log in again." };
  }

  const { data: lead, error: leadError } = await supabase
    .from("programme_leads")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (leadError || !lead) {
    return { error: "Only Programme Leads can edit coaches." };
  }

  const coachId = String(formData.get("coach_id") ?? "");
  const fullName = String(formData.get("full_name") ?? "").trim();
  const isActive = formData.get("is_active") === "true";

  const uuidPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  if (!uuidPattern.test(coachId)) {
    return { error: "Invalid coach ID." };
  }

  if (fullName.length < 2 || fullName.length > 100) {
    return { error: "Coach name must be between 2 and 100 characters." };
  }

  if (
    formData.get("is_active") !== "true" &&
    formData.get("is_active") !== "false"
  ) {
    return { error: "Invalid coach status." };
  }

  const { data: updated, error } = await supabase
    .from("coaches")
    .update({
      full_name: fullName,
      is_active: isActive,
    })
    .eq("id", coachId)
    .select("id")
    .single();

  if (error || !updated) {
    return { error: error?.message ?? "Unable to update coach." };
  }

  revalidatePath("/programme-lead/manage-coaches");
  revalidatePath("/programme-lead/assign-players");

  return { success: "Coach updated successfully." };
}
