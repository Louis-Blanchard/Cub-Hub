
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

type Assessment = {
  id: number;
  player_id: number;
  period_label: string;
  batting_average: number | null;
  bowling_average: number | null;
  fielding_average: number | null;
  strength: string | null;
  next_step_1: string | null;
  next_step_2: string | null;
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

  const { data: players, error: playerError } = await supabase
    .from('players')
    .select('id, first_name, last_name, age_group')
    .order('first_name');

  const safePlayers = (players || []) as Player[];
  const playerIds = safePlayers.map((player) => player.id);

  let assessments: Assessment[] = [];
  let assessmentErrorMessage = false;

  if (playerIds.length > 0) {
    const { data, error } = await supabase
      .from('assessments')
      .select(
        'id, player_id, period_label, batting_average, bowling_average, fielding_average, strength, next_step_1, next_step_2'
      )
      .in('player_id', playerIds)
      .eq('status', 'published')
      .order('published_at', { ascending: false });

    if (error) {
      console.error('Assessment query failed:', error.message);
      assessmentErrorMessage = true;
    } else {
      assessments = (data || []) as Assessment[];
    }
  }

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
          <p>Please contact Suffolk Cricket.</p>
        </div>
      ) : safePlayers.length === 0 ? (
        <div className="notice">
          <h2>No linked players yet</h2>
          <p>
            Your account has not yet been linked to a Cub Hub player.
          </p>
        </div>
      ) : (
        safePlayers.map((player) => {
          const reports = assessments.filter(
            (report) => report.player_id === player.id
          );

          return (
            <section className="profile" key={player.id}>
              <p className="eyebrow">PLAYER PROFILE</p>

              <h2>
                {player.first_name} {player.last_name}
              </h2>

              <p>{player.age_group} · Cub Hub</p>

              {assessmentErrorMessage ? (
                <div className="notice">
                  <p>Unable to load development reports.</p>
                </div>
              ) : reports.length === 0 ? (
                <div className="notice">
                  <h3>Development reports</h3>
                  <p>No reports have been published for this player yet.</p>
                </div>
              ) : (
                reports.map((report) => (
                  <div className="report" key={report.id}>
                    <h3>{report.period_label}</h3>

                    <div className="cards scores">
                      {[
                        ['Batting', report.batting_average],
                        ['Bowling', report.bowling_average],
                        ['Fielding', report.fielding_average],
                      ].map(([label, value]) => (
                        <div key={String(label)}>
                          <small>{label}</small>
                          <strong>
                            {typeof value === 'number'
                              ? `${value.toFixed(1)} / 5`
                              : 'Not observed'}
                          </strong>
                        </div>
                      ))}
                    </div>

                    {report.strength && (
                      <p><b>Strength:</b> {report.strength}</p>
                    )}

                    {report.next_step_1 && (
                      <p><b>Next step:</b> {report.next_step_1}</p>
                    )}

                    {report.next_step_2 && (
                      <p><b>Another goal:</b> {report.next_step_2}</p>
                    )}

                    <p className="muted">
                      Scores reflect observed development, not a
                      ranking of children.
                    </p>
                  </div>
                ))
              )}
            </section>
          );
        })
      )}

      <p className="muted">
        Only players linked to your account should appear here.
        Contact Suffolk Cricket if a player is missing.
      </p>
    </main>
  );
}
