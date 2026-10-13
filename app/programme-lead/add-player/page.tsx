
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { supabaseServer } from '../../../lib/supabase';

export const dynamic = 'force-dynamic';

export default async function AddPlayerPage() {
  const supabase = await supabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: lead, error } = await supabase
    .from('programme_leads')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error || !lead) {
    return (
      <main className="wrap section">
        <h1>Access denied</h1>
        <p>Programme Lead access is required.</p>
      </main>
    );
  }

  return (
    <main className="wrap section">
      <p className="eyebrow">
        SUFFOLK CRICKET · CUB HUB
      </p>

      <h1>Add New Player</h1>

      <p>
        Enter the details of a player joining
        the Cub Hub programme.
      </p>

      <section
        className="profile"
        style={{ marginTop: '24px' }}
      >
        <h2>Player Details</h2>

        <p>
          <strong>First name</strong>
        </p>
        <input
          type="text"
          name="first_name"
          placeholder="First name"
          disabled
        />

        <p>
          <strong>Surname</strong>
        </p>
        <input
          type="text"
          name="last_name"
          placeholder="Surname"
          disabled
        />

        <p>
          <strong>Age group</strong>
        </p>
        <select name="age_group" disabled>
          <option value="">Select age group</option>
          <option value="U9">U9</option>
          <option value="U10">U10</option>
          <option value="U11">U11</option>
          <option value="U12">U12</option>
        </select>

        <p className="muted">
          The form is currently in preview mode.
          Saving will be enabled in the next step.
        </p>
      </section>

      <p style={{ marginTop: '24px' }}>
        <Link href="/programme-lead">
          ← Back to Programme Lead Dashboard
        </Link>
      </p>
    </main>
  );
}
