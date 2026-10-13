
'use server';

import { revalidatePath } from 'next/cache';
import { supabaseServer } from '../../../../lib/supabase';

const PERIOD_LABEL = 'Winter 2026 - Final Assessment';

type SaveResult = {
  success: boolean;
  message: string;
};

export async function saveAssessmentDraft(
  playerId: number,
  formData: FormData
): Promise<SaveResult> {
  const supabase = await supabaseServer();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      success: false,
      message: 'Please sign in again.',
    };
  }

  if (!Number.isSafeInteger(playerId) || playerId <= 0) {
    return {
      success: false,
      message: 'Invalid player.',
    };
  }

  // Load the official assessment criteria.
  const { data: criteria, error: criteriaError } = await supabase
    .from('assessment_criteria')
    .select('category, criterion');

  if (criteriaError || !criteria || criteria.length === 0) {
    return {
      success: false,
      message: 'Unable to load assessment criteria.',
    };
  }

  const responses: {
    category: string;
    criterion: string;
    value: string;
  }[] = [];

  for (const item of criteria) {
    const key = `score:${item.category}:${item.criterion}`;
    const rawValue = formData.get(key);

    // No selection means the criterion is not yet assessed.
    if (rawValue === null || rawValue === '') {
      continue;
    }

    if (
      typeof rawValue !== 'string' ||
      !['1', '2', '3', '4', '5', 'not-observed'].includes(rawValue)
    ) {
      return {
        success: false,
        message: 'An invalid assessment response was submitted.',
      };
    }

    responses.push({
      category: item.category,
      criterion: item.criterion,
      value: rawValue,
    });
  }

  // Save everything through one database transaction.
  const { error: saveError } = await supabase.rpc(
    'save_cub_hub_draft',
    {
      p_player_id: playerId,
      p_period_label: PERIOD_LABEL,
      p_responses: responses,
    }
  );

  if (saveError) {
    console.error('Draft save failed:', saveError.message);

    return {
      success: false,
      message: 'Unable to save the draft. Please try again.',
    };
  }

  revalidatePath(`/coach/new-assessment/${playerId}`);

  return {
    success: true,
    message: 'Draft assessment saved successfully.',
  };
}
