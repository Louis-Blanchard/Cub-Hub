
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { supabaseServer } from '../../../../lib/supabase';

export const dynamic = 'force-dynamic';

type PageProps = {
  params: Promise<{ playerId: string }>;
};

type Criterion = {
  id: number;
  category: string;
  criterion: string;
  display_order: number;
  score_1: string;
  score_2: string;
  score_3: string;
  score_4: string;
  score_5: string;
};

const categories = [
  'Batting',
  'Bowling',
  'Fielding',
  'Wicketkeeping',
];

export default async function PlayerAssessmentPage({
  params,
}: PageProps) {
  const { playerId } = await params;
  const numericPlayerId = Number(playerId);

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
        <p>You are not authorised to access this page.</p>
        <Link href="/coach">Return to Coach Dashboard</Link>
      </main>
    );
  }

  if (!Number.isSafeInteger(numericPlayerId) || numericPlayerId <= 0) {
    return (
      <main className="wrap section">
        <h1>Invalid player</h1>
        <Link href="/coach/new-assessment">
          Return to player selection
        </Link>
      </main>
    );
  }

  // Check that this player is assigned to this coach.
  const { data: assignment, error: assignmentError } =
    await supabase
      .from('coach_players')
      .select('player_id')
      .eq('coach_id', user.id)
      .eq('player_id', numericPlayerId)
      .maybeSingle();

  if (assignmentError || !assignment) {
    return (
      <main className="wrap section">
        <h1>Player not available</h1>
        <p>
          This player is not assigned to your coach account.
        </p>
        <Link href="/coach/new-assessment">
          Return to player selection
        </Link>
      </main>
    );
  }

  const { data: player, error: playerError } = await supabase
    .from('players')
    .select('id, first_name, last_name, age_group')
    .eq('id', numericPlayerId)
    .maybeSingle();

  if (playerError || !player) {
    return (
      <main className="wrap section">
        <h1>Unable to load player</h1>
        <Link href="/coach/new-assessment">
          Return to player selection
        </Link>
      </main>
    );
  }

  const { data, error: criteriaError } = await supabase
    .from('assessment_criteria')
    .select(
      'id, category, criterion, display_order, score_1, score_2, score_3, score_4, score_5'
    )
    .order('display_order', { ascending: true });

  const criteria = (data || []) as Criterion[];

  return (
    <main className="wrap section">
      <div className="portalhead">
        <div>
          <p className="eyebrow">
            SUFFOLK CRICKET · CUB HUB
          </p>
          <h1>Player Assessment</h1>
          <p>
            {player.first_name} {player.last_name}
            {' · '}
            {player.age_group}
          </p>
        </div>

        <Link href="/coach/new-assessment">
          ← Back to Players
        </Link>
      </div>

      <section className="profile">
        <h2>Development Assessment</h2>

        <p>
          Select the score that best reflects the
          player's observed development.
        </p>

        <p className="muted">
          This is a preview of the assessment form.
          Scores cannot be saved yet.
        </p>

        {criteriaError ? (
          <div className="notice">
            <p>Unable to load scoring criteria.</p>
          </div>
        ) : criteria.length === 0 ? (
          <div className="notice">
            <p>No scoring criteria are available.</p>
          </div>
        ) : (
          categories.map((category) => {
            const categoryCriteria = criteria.filter(
              (item) => item.category === category
            );

            return (
              <section
                key={category}
                style={{ marginTop: '32px' }}
              >
                <h2>{category}</h2>

                {categoryCriteria.map((item) => (
                  <div
                    className="report"
                    key={item.id}
                    style={{ marginBottom: '20px' }}
                  >
                    <h3>{item.criterion}</h3>

                    {[
                      item.score_1,
                      item.score_2,
                      item.score_3,
                      item.score_4,
                      item.score_5,
                    ].map((description, index) => (
                      <label
                        key={index}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '12px',
                          padding: '12px 0',
                          cursor: 'pointer',
                        }}
                      >
                        <input
                          type="radio"
                          name={`criterion-${item.id}`}
                          value={index + 1}
                          style={{ marginTop: '5px' }}
                        />

                        <span>
                          <strong>{index + 1} — </strong>
                          {description}
                        </span>
                      </label>
                    ))}

                    <label
                      style={{
                        display: 'flex',
                        gap: '12px',
                        padding: '12px 0',
                        cursor: 'pointer',
                      }}
                    >
                      <input
                        type="radio"
                        name={`criterion-${item.id}`}
                        value="not-observed"
                      />
                      <span>Not Observed</span>
                    </label>
                  </div>
                ))}
              </section>
            );
          })
        )}
      </section>
    </main>
  );
}
