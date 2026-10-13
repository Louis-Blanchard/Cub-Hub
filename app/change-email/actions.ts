
"use server";

import { supabaseServer } from "../../lib/supabase";

export async function requestEmailChange(formData: FormData) {
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
    return { error: "Only Programme Leads can use this page." };
  }

  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();

  if (
    email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    return { error: "Please enter a valid email address." };
  }

  if (email === user.email?.toLowerCase()) {
    return { error: "This is already your login email." };
  }

  const { error } = await supabase.auth.updateUser({
    email,
  });

  if (error) {
    return { error: error.message };
  }

  return {
    success:
      "Email change requested. Check both your current and new email inboxes for confirmation links.",
  };
}
