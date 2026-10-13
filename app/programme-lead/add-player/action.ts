
'use server';

import { redirect } from 'next/navigation';
import { supabaseServer } from '../../../lib/supabase';

export async function addPlayer(formData: FormData) {
  const supabase = await supabaseServer();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/login');
  }

  const { data: lead, error: leadError } = await supabase
    .from('programme_leads')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (leadError || !lead) {
    throw new Error('Programme Lead access required.');
  }

  const firstName = String(
    formData.get('first_name') ?? ''
  ).trim();

  const lastName = String(
    formData.get('last_name') ?? ''
  ).trim();

  const ageGroup = String(
    formData.get('age_group') ?? ''
  ).trim();

  if (
    !firstName ||
    !lastName ||
    firstName.length > 100 ||
    lastName.length > 100 ||
    !['U9', 'U10', 'U11', 'U12'].includes(ageGroup)
  ) {
    throw new Error('Please enter valid player details.');
  }

  const { error: insertError } = await supabase
    .from('players')
    .insert({
      first_name: firstName,
      last_name: lastName,
      age_group: ageGroup,
    });

  if (insertError) {
    throw new Error(
      'Unable to save player: ' + insertError.message
    );
  }

  redirect('/programme-lead/add-player?saved=1');
}
