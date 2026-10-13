
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { supabaseServer } from '../../../lib/supabase';

export const dynamic = 'force-dynamic';

type Player = {
  id: number;
  first_name: string;
  last_name: string;
  age_group: string;
};

export default async function NewAssessmentPage() {
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
    .select('full_name')
    .eq('id', user.id)
    .eq('is_active', true)
    .maybeSingle();

  if (coachError || !coach) {
    return (
      <main className="wrap section">
        <h1>Coach access required</h1>
        <p>
          Your account is not authorised to create
          Cub Hub assessments.
        </p>
        <Link href="/coach">Return to Coach Dashboard</Link>
      </main>
    );
  }

  const { data: assignments, error: assignmentError } =
    await supabase
      .from('coach_players')
      .select('player_id')
      .eq('coach_id', user.id);

  const playerIds = (assignments || []).map(
    (assignment) => assignment.player_id as number
  );

  let players: Player[] = [];
  let playerError = Boolean(assignmentError);

  if (!playerError && playerIds.length > 0) {
    const { data, error } = await supabase
      .from('players')
      .select('id, first_name, last_name, age_group')
      .in('id', playerIds)
      .order('first_name');

    if (error) {
      playerError = true;
      console.error('Unable to load assigned players:', error.message);
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
          <h1>New Player Assessment</h1>
          <p>Welcome, {coach.full_name}</p>
        </div>

        <Link href="/coach">← Coach Dashboard</Link>
      </div>

      <section className="profile">
        <h2>Select a player</h2>

        <p>
          Choose a player assigned to you to begin
          their Cub Hub development assessment.
        </p>

        {playerError ? (
          <div className="notice">
            <p>Unable to load your assigned players.</p>
          </div>
        ) : players.length === 0 ? (
          <div className="notice">
            <p>
              You do not currently have any players
              assigned to you.
            </p>
          </div>
        ) : (
          players.map((player) => (
            <div
              className="report"
              key={player.id}
              style={{ marginBottom: '16px' }}
            >
              <h3>
                {player.first_name} {player.last_name}
              </h3>

              <p>{player.age_group} · Cub Hub</p>

              <p className="muted">
                Assessment entry form coming next.
              </p>
            </div>
          ))
        )}
      </section>
    </main>
  );
}
