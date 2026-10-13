
'use server';

import { supabaseServer } from '../../../../lib/supabase';

type PublishResult = {
  success: boolean;
  message: string;
};

export async function publishAssessment(
  assessmentId: number,
  expectedVersion: number
): Promise<PublishResult> {
  if (
    !Number.isSafeInteger(assessmentId) ||
    assessmentId <= 0 ||
    !Number.isSafeInteger(expectedVersion) ||
    expectedVersion <= 0
  ) {
    return {
      success: false,
      message: 'Invalid assessment information.',
    };
  }

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

  const { data: lead, error: leadError } =
    await supabase
      .from('programme_leads')
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle();

  if (leadError || !lead) {
    return {
      success: false,
      message: 'Programme Lead access required.',
    };
  }

  const { error } = await supabase.rpc(
    'publish_cub_hub_assessment',
    {
      p_assessment_id: assessmentId,
      p_expected_version: expectedVersion,
    }
  );

  if (error) {
    console.error('Publishing failed:', error.message);

    return {
      success: false,
      message:
        'Unable to publish. The assessment may have changed or may be incomplete. Please refresh and try again.',
    };
  }

  return {
    success: true,
    message: 'Assessment published successfully.',
  };
}
