
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { supabaseServer } from '../../../../lib/supabase';

export const dynamic = 'force-dynamic';

type PageProps = {
  params: Promise<{ playerId: string }>;
};

export default async function EditPlayerPage({
  params,
}: PageProps) {
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
    return (
      <main className="wrap section">
        <h1>Access denied</h1>
        <p>Programme Lead access is required.</p>
      </main>
    );
  }

  const { playerId } = await params;

  if (!/^[1-9]\d*$/.test(playerId)) {
    notFound();
  }

  const { data: player, error: playerError } =
    await supabase
      .from('players')
      .select('id, first_name, last_name, age_group')
      .eq('id', playerId)
      .maybeSingle();

  if (playerError) {
    return (
      <main className="wrap section">
        <h1>Unable to load player</h1>
        <p>Please try again later.</p>
      </main>
    );
  }

  if (!player) {
    notFound();
  }

  return (
    <main className="wrap section">
      <p className="eyebrow">
        SUFFOLK CRICKET · CUB HUB
      </p>

      <h1>Edit Player</h1>

      <p>
        Review the details for{' '}
        <strong>
          {player.first_name} {player.last_name}
        </strong>
        .
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
          defaultValue={player.first_name}
          disabled
        />

        <p>
          <strong>Surname</strong>
        </p>
        <input
          type="text"
          defaultValue={player.last_name}
          disabled
        />

        <p>
          <strong>Age group</strong>
        </p>
        <select
          defaultValue={player.age_group}
          disabled
        >
          <option value="U9">U9</option>
          <option value="U10">U10</option>
          <option value="U11">U11</option>
          <option value="U12">U12</option>
        </select>

        <p
          className="muted"
          style={{ marginTop: '20px' }}
        >
          Editing is currently in preview mode.
          Saving will be enabled in the next step.
        </p>
      </section>

      <p style={{ marginTop: '24px' }}>
        <Link href="/programme-lead/manage-players">
          ← Back to Manage Players
        </Link>
      </p>
    </main>
  );
}
