
"use server";

import { redirect } from "next/navigation";
import { supabaseServer } from "../../../lib/supabase";
import { supabaseAdmin } from "../../../lib/supabaseAdmin";

export async function createCoach(formData: FormData) {
  const supabase = await supabaseServer();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  const { data: lead, error: leadError } = await supabase
    .from("programme_leads")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (leadError || !lead) {
    throw new Error("Only Programme Leads can create coaches.");
  }

  const fullName = String(
    formData.get("full_name") || ""
  ).trim();

  const email = String(
    formData.get("email") || ""
  ).trim().toLowerCase();

  if (
    fullName.length < 2 ||
    fullName.length > 100 ||
    email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    throw new Error("Please enter a valid name and email address.");
  }

  const admin = supabaseAdmin();

  const { data, error: inviteError } =
    await admin.auth.admin.inviteUserByEmail(email, {
      redirectTo: "https://cub-hub.vercel.app/auth/invite",
      data: {
        full_name: fullName,
      },
    });

  if (inviteError || !data.user) {
    console.error("Coach invitation failed:", inviteError?.message);
    throw new Error("Unable to send coach invitation.");
  }

  const { error: coachError } = await admin
    .from("coaches")
    .upsert(
      {
        id: data.user.id,
        full_name: fullName,
        is_active: true,
      },
      { onConflict: "id" }
    );

  if (coachError) {
    console.error("Coach profile creation failed:", coachError.message);
    throw new Error(
      "Invitation sent, but the coach profile could not be created. Check Supabase before retrying."
    );
  }

  redirect("/programme-lead/manage-coaches?invited=1");
}
