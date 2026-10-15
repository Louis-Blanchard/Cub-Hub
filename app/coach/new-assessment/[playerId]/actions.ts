
'use server';

import { revalidatePath } from 'next/cache';
import { supabaseServer } from '../../../../lib/supabase';

const PERIOD_LABEL = 'Security Test - October 2026';

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

const rawVersion = formData.get('draft_version');

if (
  typeof rawVersion !== 'string' ||
  !/^\d+$/.test(rawVersion)
) {
  return {
    success: false,
    message: 'Invalid assessment version. Refresh the page.',
  };
}

const expectedVersion = Number(rawVersion);

if (!Number.isSafeInteger(expectedVersion)) {
  return {
    success: false,
    message: 'Invalid assessment version. Refresh the page.',
  };
}

const strength = String(formData.get('strength') ?? '');
const nextStep1 = String(formData.get('next_step_1') ?? '');
const nextStep2 = String(formData.get('next_step_2') ?? '');

if (
  strength.length > 2000 ||
  nextStep1.length > 2000 ||
  nextStep2.length > 2000
) {
  return {
    success: false,
    message: 'Each feedback field must be under 2000 characters.',
  };
}

const { error: saveError } = await supabase.rpc(
  'save_cub_hub_draft',
  {
    p_player_id: playerId,
    p_period_label: PERIOD_LABEL,
    p_responses: responses,
    p_expected_version: expectedVersion,
    p_strength: strength,
    p_next_step_1: nextStep1,
    p_next_step_2: nextStep2,
  }
);



if (saveError) {
  console.error('Draft save failed:', saveError.message);

  if (
    saveError.message.includes(
      'Assessment has changed'
    )
  ) {
    return {
      success: false,
      message:
        'This assessment has been updated by another coach. Please refresh the page to see the latest changes before saving again.',
    };
  }

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
