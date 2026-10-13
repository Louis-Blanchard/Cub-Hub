
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { supabaseServer } from '../../lib/supabase';

export const dynamic = 'force-dynamic';

type CoachPlayer = {
  player_id: number;
};

type Player = {
  id: number;
  first_name: string;
  last_name: string;
  age_group: string;
};

export default async function CoachDashboard() {
  const supabase = await supabaseServer();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/login');
  }

  const { data: coach, error: coachError } = await supabase
    .from('coaches')
    .select('full_name, is_active')
    .eq('id', user.id)
    .eq('is_active', true)
    .maybeSingle();

  if (coachError || !coach) {
    return (
      <main className="wrap section">
        <h1>Coach access required</h1>
        <p>
          Your account is not currently authorised to access
          the Cub Hub Coach Dashboard.
        </p>
        <Link href="/portal">Return to parent portal</Link>
      </main>
    );
  }

  const { data: assignments, error: assignmentError } =
    await supabase
      .from('coach_players')
      .select('player_id')
      .eq('coach_id', user.id);

  const playerIds = ((assignments || []) as CoachPlayer[])
    .map((assignment) => assignment.player_id);

  let players: Player[] = [];
  let playerError = false;

  if (playerIds.length > 0) {
    const { data, error } = await supabase
      .from('players')
      .select('id, first_name, last_name, age_group')
      .in('id', playerIds)
      .order('first_name');

    if (error) {
      playerError = true;
    } else {
      players = (data || []) as Player[];
    }
  }

  return (
    <main className="wrap section">
      <div className="portalhead">
        <div>
          <p className="eyebrow">
            SUFFOLK CRICKET · CUB HUB
          </p>
          <h1>Coach Dashboard</h1>
          <p>Welcome, {coach.full_name}</p>
        </div>

        <Link href="/">Home</Link>
      </div>

      <section className="profile">
        <h2>Your assigned players</h2>

        {assignmentError || playerError ? (
          <div className="notice">
            <p>Unable to load your assigned players.</p>
          </div>
        ) : players.length === 0 ? (
          <div className="notice">
            <p>No players have been assigned to you yet.</p>
          </div>
        ) : (
          <div className="cards">
            {players.map((player) => (
              <div className="report" key={player.id}>
                <h3>
                  {player.first_name} {player.last_name}
                </h3>
                <p>{player.age_group} · Cub Hub</p>
                <p className="muted">
                  Assessment management coming soon.
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      <p className="muted">
        Only players assigned to your coach account
        should appear here.
      </p>
    </main>
  );
}
