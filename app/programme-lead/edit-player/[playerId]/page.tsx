
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { supabaseServer } from '../../../../lib/supabase';
import { updatePlayer } from './actions';

export const dynamic = 'force-dynamic';

type PageProps = {
  params: Promise<{ playerId: string }>;
  searchParams: Promise<{ saved?: string }>;
};

export default async function EditPlayerPage({
  params,
  searchParams,
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
  const { saved } = await searchParams;

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

  const inputStyle = {
    padding: '12px',
    width: '100%',
    maxWidth: '420px',
    fontSize: '16px',
  };

  return (
    <main className="wrap section">
      <p className="eyebrow">
        SUFFOLK CRICKET · CUB HUB
      </p>

      <h1>Edit Player</h1>

      <p>
        Update the details for{' '}
        <strong>
          {player.first_name} {player.last_name}
        </strong>
        .
      </p>

      {saved === '1' && (
        <section
          className="profile"
          style={{
            marginTop: '24px',
            borderColor: '#2e7d32',
          }}
        >
          <h2>Changes saved successfully!</h2>
          <p>
            The player's details have been updated
            in the Cub Hub database.
          </p>
        </section>
      )}

      <section
        className="profile"
        style={{ marginTop: '24px' }}
      >
        <h2>Player Details</h2>

        <form action={updatePlayer}>
          <input
            type="hidden"
            name="player_id"
            value={player.id}
          />

          <div style={{ marginTop: '20px' }}>
            <label htmlFor="first_name">
              <strong>First name</strong>
            </label>

            <div style={{ marginTop: '8px' }}>
              <input
                id="first_name"
                type="text"
                name="first_name"
                defaultValue={player.first_name}
                maxLength={100}
                required
                style={inputStyle}
              />
            </div>
          </div>

          <div style={{ marginTop: '20px' }}>
            <label htmlFor="last_name">
              <strong>Surname</strong>
            </label>

            <div style={{ marginTop: '8px' }}>
              <input
                id="last_name"
                type="text"
                name="last_name"
                defaultValue={player.last_name}
                maxLength={100}
                required
                style={inputStyle}
              />
            </div>
          </div>

          <div style={{ marginTop: '20px' }}>
            <label htmlFor="age_group">
              <strong>Age group</strong>
            </label>

            <div style={{ marginTop: '8px' }}>
              <select
                id="age_group"
                name="age_group"
                defaultValue={player.age_group}
                required
                style={inputStyle}
              >
                <option value="U9">U9</option>
                <option value="U10">U10</option>
                <option value="U11">U11</option>
                <option value="U12">U12</option>
              </select>
            </div>
          </div>

          <div style={{ marginTop: '30px' }}>
            <button
              type="submit"
              style={{
                backgroundColor: '#742533',
                color: 'white',
                padding: '14px 28px',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer',
              }}
            >
              Save Changes
            </button>
          </div>
        </form>
      </section>

      <p style={{ marginTop: '24px' }}>
        <Link href="/programme-lead/manage-players">
          ← Back to Manage Players
        </Link>
      </p>
    </main>
  );
}
