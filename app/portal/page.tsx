
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { supabaseServer } from '../../lib/supabase';

export const dynamic = 'force-dynamic';

type Player = {
  id: number;
  first_name: string;
  last_name: string;
  age_group: string;
};

export default async function Portal() {
  const supabase = await supabaseServer();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/login');
  }

  // The players table's RLS policy restricts results
  // to players linked to the signed-in parent.
  const { data: players, error: playerError } = await supabase
    .from('players')
    .select('id, first_name, last_name, age_group')
    .order('first_name');

  return (
    <main className="wrap section">
      <div className="portalhead">
        <div>
          <p className="eyebrow">SUFFOLK CRICKET · CUB HUB</p>
          <h1>Parent dashboard</h1>
          <p>Signed in as {user.email}</p>
        </div>

        <Link href="/">Home</Link>
      </div>

      {playerError ? (
        <div className="notice">
          <h2>Unable to load player profiles</h2>
          <p>
            Please try again later or contact Suffolk Cricket.
          </p>
        </div>
      ) : !players || players.length === 0 ? (
        <div className="notice">
          <h2>No linked players yet</h2>
          <p>
            Your account has not yet been linked to a Cub Hub
            player. Please contact Suffolk Cricket if you
            believe this is incorrect.
          </p>
        </div>
      ) : (
        players.map((player: Player) => (
          <section className="profile" key={player.id}>
            <p className="eyebrow">PLAYER PROFILE</p>

            <h2>
              {player.first_name} {player.last_name}
            </h2>

            <p>{player.age_group} · Cub Hub</p>

            <div className="notice">
              <h3>Development reports</h3>
              <p>
                No reports have been published for this
                player yet.
              </p>
            </div>
          </section>
        ))
      )}

      <p className="muted">
        Only players linked to your account should appear
        here. Contact Suffolk Cricket if a player is missing.
      </p>
    </main>
  );
}
