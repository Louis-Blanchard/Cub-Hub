
"use server";

import { revalidatePath } from "next/cache";
import { supabaseServer } from "../../../../../lib/supabase";

type SaveResult = {
  success: boolean;
  message: string;
};

type AssessmentResponse = {
  category: string;
  criterion: string;
  value: string;
};

export async function saveLeadAssessmentEdits(
  assessmentId: number,
  expectedVersion: number,
  responses: AssessmentResponse[],
  strength: string,
  nextStep1: string,
  nextStep2: string
): Promise<SaveResult> {
  // Validate the assessment and version.
  if (
    !Number.isSafeInteger(assessmentId) ||
    assessmentId <= 0 ||
    !Number.isSafeInteger(expectedVersion) ||
    expectedVersion <= 0
  ) {
    return {
      success: false,
      message: "Invalid assessment information.",
    };
  }

  // Validate the submitted scores.
  if (
    !Array.isArray(responses) ||
    responses.length > 20 ||
    responses.some(
      (item) =>
        typeof item.category !== "string" ||
        typeof item.criterion !== "string" ||
        !["1", "2", "3", "4", "5", "not-observed"].includes(
          item.value
        )
    )
  ) {
    return {
      success: false,
      message: "Invalid assessment scores.",
    };
  }

  if (
    [strength, nextStep1, nextStep2].some(
      (value) =>
        typeof value !== "string" || value.length > 2000
    )
  ) {
    return {
      success: false,
      message: "Feedback must be under 2000 characters.",
    };
  }

  const supabase = await supabaseServer();

  // Confirm the user is signed in.
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      success: false,
      message: "Please sign in again.",
    };
  }

  // Confirm Programme Lead access.
  const { data: lead, error: leadError } = await supabase
    .from("programme_leads")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (leadError || !lead) {
    return {
      success: false,
      message: "Programme Lead access required.",
    };
  }

  // Save all changes in one database transaction.
  const { error } = await supabase.rpc(
    "save_cub_hub_lead_edits",
    {
      p_assessment_id: assessmentId,
      p_expected_version: expectedVersion,
      p_responses: responses,
      p_strength: strength,
      p_next_step_1: nextStep1,
      p_next_step_2: nextStep2,
    }
  );

  if (error) {
    console.error("Programme Lead edit failed:", error.message);

    if (error.message.includes("Assessment has changed")) {
      return {
        success: false,
        message:
          "This assessment has changed since you opened it. Refresh the page before editing again.",
      };
    }

    if (error.message.includes("Assessment is not editable")) {
      return {
        success: false,
        message:
          "This assessment can no longer be edited. It may have been published.",
      };
    }

    return {
      success: false,
      message:
        "Unable to save assessment changes. Please try again.",
    };
  }

  revalidatePath(
    `/programme-lead/review/${assessmentId}/edit`
  );
  revalidatePath(
    `/programme-lead/assessment/${assessmentId}`
  );
  revalidatePath("/programme-lead");

  return {
    success: true,
    message: "Assessment changes saved successfully.",
  };
}
