
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { supabaseServer } from '../../../lib/supabase';

export const dynamic = 'force-dynamic';

export default async function ManagePlayersPage() {
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

  const { data: players, error: playersError } =
    await supabase
      .from('players')
      .select('id, first_name, last_name, age_group')
      .order('last_name', { ascending: true })
      .order('first_name', { ascending: true });

  return (
    <main className="wrap section">
      <p className="eyebrow">
        SUFFOLK CRICKET · CUB HUB
      </p>

      <h1>Manage Players</h1>

      <p>
        View players registered on the
        Cub Hub programme.
      </p>

      <p style={{ marginTop: '24px' }}>
        <Link href="/programme-lead/add-player">
          + Add New Player
        </Link>
      </p>

      <section
        className="profile"
        style={{ marginTop: '24px' }}
      >
        <h2>Registered Players</h2>

        {playersError ? (
          <p>
            Unable to load players. Please try again.
          </p>
        ) : !players || players.length === 0 ? (
          <p>No players found.</p>
        ) : (
          <>
            <p>
              Total players: <strong>{players.length}</strong>
            </p>

            <div style={{ overflowX: 'auto' }}>
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  marginTop: '20px',
                }}
              >
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '12px' }}>
                      Player
                    </th>
                    <th style={{ textAlign: 'left', padding: '12px' }}>
                      Age Group
                    </th>
                    <th style={{ textAlign: 'left', padding: '12px' }}>
                      Player ID
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {players.map((player) => (
                    <tr key={player.id}>
                      <td style={{ padding: '12px', borderTop: '1px solid #ddd' }}>
                        {player.first_name} {player.last_name}
                      </td>
                      <td style={{ padding: '12px', borderTop: '1px solid #ddd' }}>
                        {player.age_group}
                      </td>
                      <td style={{ padding: '12px', borderTop: '1px solid #ddd' }}>
                        {player.id}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      <p style={{ marginTop: '24px' }}>
        <Link href="/programme-lead">
          ← Back to Programme Lead Dashboard
        </Link>
      </p>
    </main>
  );
}
