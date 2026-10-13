
"use server";

import { revalidatePath } from "next/cache";
import { supabaseServer } from "../../../lib/supabase";

export async function assignPlayer(formData: FormData) {
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
    return { error: "Only Programme Leads can assign players." };
  }

  const coachId = String(formData.get("coach_id") ?? "");
  const playerId = Number(formData.get("player_id"));

  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(coachId) ||
    !Number.isSafeInteger(playerId) ||
    playerId <= 0
  ) {
    return { error: "Please select a valid coach and player." };
  }

  const { data: coach, error: coachError } = await supabase
    .from("coaches")
    .select("id")
    .eq("id", coachId)
    .eq("is_active", true)
    .maybeSingle();

  if (coachError || !coach) {
    return { error: "This coach is not active or cannot be found." };
  }

  const { data: player, error: playerError } = await supabase
    .from("players")
    .select("id")
    .eq("id", playerId)
    .maybeSingle();

  if (playerError || !player) {
    return { error: "This player cannot be found." };
  }

  const { data: existing, error: existingError } = await supabase
    .from("coach_players")
    .select("id")
    .eq("coach_id", coachId)
    .eq("player_id", playerId)
    .maybeSingle();

  if (existingError) {
    return { error: "Unable to check existing assignments." };
  }

  if (existing) {
    return { error: "This player is already assigned to that coach." };
  }

  const { error: insertError } = await supabase
    .from("coach_players")
    .insert({
      coach_id: coachId,
      player_id: playerId,
    });

  if (insertError) {
    return { error: "Unable to assign player: " + insertError.message };
  }

  revalidatePath("/programme-lead/assign-players");

  return { success: "Player assigned successfully." };
}
