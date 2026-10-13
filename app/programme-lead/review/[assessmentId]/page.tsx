
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { supabaseServer } from '../../../../lib/supabase';

export const dynamic = 'force-dynamic';

type PageProps = {
  params: Promise<{ assessmentId: string }>;
};

type Score = {
  category: string;
  criterion: string;
  score: number;
};

type Observation = {
  category: string;
  criterion: string;
};

const categories = [
  'Batting',
  'Bowling',
  'Fielding',
  'Wicketkeeping',
];

export default async function AssessmentReviewPage({
  params,
}: PageProps) {
  const { assessmentId } = await params;
  const id = Number(assessmentId);

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

  if (!Number.isSafeInteger(id) || id <= 0) {
    return (
      <main className="wrap section">
        <h1>Invalid assessment</h1>
        <Link href="/programme-lead">
          Back to Dashboard
        </Link>
      </main>
    );
  }

  const { data: assessment, error: assessmentError } =
    await supabase
      .from('assessments')
      .select(
        'id, player_id, period_label, status, strength, next_step_1, next_step_2'
      )
      .eq('id', id)
      .maybeSingle();

  if (assessmentError || !assessment) {
    return (
      <main className="wrap section">
        <h1>Assessment not found</h1>
        <Link href="/programme-lead">
          Back to Dashboard
        </Link>
      </main>
    );
  }

  const [
    playerResult,
    scoresResult,
    observationsResult,
    criteriaResult,
  ] = await Promise.all([
    supabase
      .from('players')
      .select('first_name, last_name, age_group')
      .eq('id', assessment.player_id)
      .maybeSingle(),
    supabase
      .from('assessment_scores')
      .select('category, criterion, score')
      .eq('assessment_id', id),
    supabase
      .from('assessment_observations')
      .select('category, criterion')
      .eq('assessment_id', id),
    supabase
      .from('assessment_criteria')
      .select('category, criterion, display_order')
      .order('display_order', { ascending: true }),
  ]);

  if (
    playerResult.error ||
    !playerResult.data ||
    scoresResult.error ||
    observationsResult.error ||
    criteriaResult.error
  ) {
    return (
      <main className="wrap section">
        <h1>Unable to load assessment details</h1>
        <Link href="/programme-lead">
          Back to Dashboard
        </Link>
      </main>
    );
  }

  const player = playerResult.data;
  const scores = (scoresResult.data || []) as Score[];
  const observations =
    (observationsResult.data || []) as Observation[];
  const criteria = criteriaResult.data || [];

  const categoryAverage = (category: string) => {
    const values = scores
      .filter((item) => item.category === category)
      .map((item) => item.score);

    if (values.length === 0) return null;

    return (
      values.reduce((sum, score) => sum + score, 0) /
      values.length
    ).toFixed(1);
  };

  return (
    <main className="wrap section">
      <div className="portalhead">
        <div>
          <p className="eyebrow">
            SUFFOLK CRICKET · CUB HUB
          </p>
          <h1>Assessment Review</h1>
          <p>
            {player.first_name} {player.last_name}
            {' · '}
            {player.age_group}
          </p>
        </div>

        <Link href="/programme-lead">
          ← Programme Lead Dashboard
        </Link>
      </div>

      <section className="profile">
        <h2>{assessment.period_label}</h2>

        <p>
          <strong>Status:</strong>{' '}
          {assessment.status === 'published'
            ? 'Published'
            : 'Draft'}
        </p>

        <p className="muted">
          Review the assessment scores and development
          feedback before publishing.
        </p>
      </section>

      <section
        className="profile"
        style={{ marginTop: '24px' }}
      >
        <h2>Assessment Scores</h2>

        {categories.map((category) => {
          const categoryCriteria = criteria.filter(
            (item) => item.category === category
          );

          return (
            <div
              key={category}
              style={{ marginTop: '28px' }}
            >
              <h3>{category}</h3>

              <p>
                <strong>Average score: </strong>
                {categoryAverage(category) ?? 'Not assessed'}
              </p>

              {categoryCriteria.map((item) => {
                const score = scores.find(
                  (saved) =>
                    saved.category === item.category &&
                    saved.criterion === item.criterion
                );

                const notObserved = observations.some(
                  (saved) =>
                    saved.category === item.category &&
                    saved.criterion === item.criterion
                );

                return (
                  <div
                    key={`${item.category}-${item.criterion}`}
                    style={{
                      padding: '12px 0',
                      borderBottom: '1px solid #ddd',
                    }}
                  >
                    <strong>{item.criterion}</strong>

                    <p>
                      {score
                        ? `Score: ${score.score} / 5`
                        : notObserved
                          ? 'Not Observed'
                          : 'Not yet assessed'}
                    </p>
                  </div>
                );
              })}
            </div>
          );
        })}
      </section>

      <section
        className="profile"
        style={{ marginTop: '24px' }}
      >
        <h2>Player Development Feedback</h2>

        <div className="report">
          <h3>Player Strengths</h3>
          <p>
            {assessment.strength ||
              'No strengths feedback entered.'}
          </p>
        </div>

        <div
          className="report"
          style={{ marginTop: '16px' }}
        >
          <h3>Development Goal 1</h3>
          <p>
            {assessment.next_step_1 ||
              'No development goal entered.'}
          </p>
        </div>

        <div
          className="report"
          style={{ marginTop: '16px' }}
        >
          <h3>Development Goal 2</h3>
          <p>
            {assessment.next_step_2 ||
              'No development goal entered.'}
          </p>
        </div>
      </section>

      <section
        className="profile"
        style={{ marginTop: '24px' }}
      >
        <h2>Publishing</h2>

        <p className="muted">
          This page is currently read-only.
          Publishing controls will be added after
          the review page has been tested.
        </p>
      </section>
    </main>
  );
}
