
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

  // Confirm this is an active coach.
  const { data: coach, error: coachError } = await supabase
    .from('coaches')
    .select('id')
    .eq('id', user.id)
    .eq('is_active', true)
    .maybeSingle();

  if (coachError || !coach) {
    return {
      success: false,
      message: 'Coach access required.',
    };
  }

  // Confirm the player is assigned to this coach.
  const { data: assignment, error: assignmentError } =
    await supabase
      .from('coach_players')
      .select('player_id')
      .eq('coach_id', user.id)
      .eq('player_id', playerId)
      .maybeSingle();

  if (assignmentError || !assignment) {
    return {
      success: false,
      message: 'This player is not assigned to you.',
    };
  }

  // Load the official criteria, rather than trusting
  // criterion names supplied by the browser.
  const { data: criteria, error: criteriaError } = await supabase
    .from('assessment_criteria')
    .select('category, criterion');

  if (criteriaError || !criteria || criteria.length === 0) {
    return {
      success: false,
      message: 'Unable to load assessment criteria.',
    };
  }

  const scores: {
    category: string;
    criterion: string;
    score: number;
  }[] = [];

  for (const item of criteria) {
    const key = `score:${item.category}:${item.criterion}`;
    const rawValue = formData.get(key);

    if (typeof rawValue !== 'string') {
      continue;
    }

    if (rawValue === 'not-observed' || rawValue === '') {
      continue;
    }

    const score = Number(rawValue);

    if (!Number.isInteger(score) || score < 1 || score > 5) {
      return {
        success: false,
        message: 'An invalid assessment score was submitted.',
      };
    }

    scores.push({
      category: item.category,
      criterion: item.criterion,
      score,
    });
  }

  // Look for an existing assessment for this period.
  const { data: existing, error: existingError } = await supabase
    .from('assessments')
    .select('id, status')
    .eq('player_id', playerId)
    .eq('period_label', PERIOD_LABEL)
    .maybeSingle();

  if (existingError) {
    return {
      success: false,
      message: 'Unable to check existing assessments.',
    };
  }

  if (existing && existing.status !== 'draft') {
    return {
      success: false,
      message: 'This assessment has already been published.',
    };
  }

  let assessmentId: number;

  if (existing) {
    assessmentId = existing.id;
  } else {
    const { data: created, error: createError } = await supabase
      .from('assessments')
      .insert({
        player_id: playerId,
        period_label: PERIOD_LABEL,
        status: 'draft',
        published_at: null,
      })
      .select('id')
      .single();

    if (createError || !created) {
      return {
        success: false,
        message: 'Unable to create the draft assessment.',
      };
    }

    assessmentId = created.id;
  }


const { data: existingScores, error: readError } =
  await supabase
    .from('assessment_scores')
    .select('id, category, criterion, score')
    .eq('assessment_id', assessmentId);

if (readError) {
  return {
    success: false,
    message: 'Unable to load previously saved scores.',
  };
}

// Save new scores and update scores that have changed.
for (const item of scores) {
  const previous = (existingScores || []).find(
    (saved) =>
      saved.category === item.category &&
      saved.criterion === item.criterion
  );

  if (previous) {
    if (previous.score !== item.score) {
      const { error } = await supabase
        .from('assessment_scores')
        .update({ score: item.score })
        .eq('id', previous.id);

      if (error) {
        return {
          success: false,
          message: 'Unable to update an existing score.',
        };
      }
    }
  } else {
    const { error } = await supabase
      .from('assessment_scores')
      .insert({
        assessment_id: assessmentId,
        category: item.category,
        criterion: item.criterion,
        score: item.score,
      });

    if (error) {
      return {
        success: false,
        message: 'Unable to save a new score.',
      };
    }
  }
}

// Remove previously saved scores that are now
// Not Observed or have been cleared.
for (const previous of existingScores || []) {
  const stillScored = scores.some(
    (item) =>
      item.category === previous.category &&
      item.criterion === previous.criterion
  );

  if (!stillScored) {
    const { error } = await supabase
      .from('assessment_scores')
      .delete()
      .eq('id', previous.id);

    if (error) {
      return {
        success: false,
        message: 'Unable to remove a cleared score.',
      };
    }
  }
}


  revalidatePath(`/coach/new-assessment/${playerId}`);

  return {
    success: true,
    message: 'Draft assessment saved successfully.',
  };
}
