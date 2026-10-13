
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { supabaseServer } from '../../../../lib/supabase';
import { saveAssessmentDraft } from './actions';
import FeedbackFields from './FeedbackFields';

export const dynamic = 'force-dynamic';

type PageProps = {
  params: Promise<{ playerId: string }>;
  searchParams: Promise<{ saved?: string; error?: string }>;
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

const PERIOD_LABEL = 'Winter 2026 - Final Assessment';

const categories = [
  'Batting',
  'Bowling',
  'Fielding',
  'Wicketkeeping',
];

export default async function PlayerAssessmentPage({
  params,
  searchParams,
}: PageProps) {
  const { playerId } = await params;
  const { saved, error: saveError } = await searchParams;
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

  if (
    !Number.isSafeInteger(numericPlayerId) ||
    numericPlayerId <= 0
  ) {
    return (
      <main className="wrap section">
        <h1>Invalid player</h1>
        <Link href="/coach/new-assessment">
          Back to players
        </Link>
      </main>
    );
  }

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
          Back to players
        </Link>
      </main>
    );
  }

  const { data: player, error: playerError } =
    await supabase
      .from('players')
      .select('first_name, last_name, age_group')
      .eq('id', numericPlayerId)
      .maybeSingle();

  if (playerError || !player) {
    return (
      <main className="wrap section">
        <h1>Unable to load player</h1>
        <Link href="/coach/new-assessment">
          Back to players
        </Link>
      </main>
    );
  }

  const { data: criteriaData, error: criteriaError } =
    await supabase
      .from('assessment_criteria')
      .select(
        'id, category, criterion, display_order, score_1, score_2, score_3, score_4, score_5'
      )
      .order('display_order', { ascending: true });

  const criteria = (criteriaData || []) as Criterion[];

  const { data: existingAssessment, error: assessmentError } =
    await supabase
      .from('assessments')
      .select(
        'id, status, draft_version, strength, next_step_1, next_step_2'
      )
      .eq('player_id', numericPlayerId)
      .eq('period_label', PERIOD_LABEL)
      .maybeSingle();

  let savedScores: {
    category: string;
    criterion: string;
    score: number;
  }[] = [];

  let savedObservations: {
    category: string;
    criterion: string;
  }[] = [];

  let scoresError = false;
  let observationsError = false;

  if (existingAssessment?.status === 'draft') {
    const { data: scores, error: scoreLoadError } =
      await supabase
        .from('assessment_scores')
        .select('category, criterion, score')
        .eq('assessment_id', existingAssessment.id);

    if (scoreLoadError) {
      scoresError = true;
    } else {
      savedScores = scores || [];
    }

    const {
      data: observations,
      error: observationLoadError,
    } = await supabase
      .from('assessment_observations')
      .select('category, criterion')
      .eq('assessment_id', existingAssessment.id);

    if (observationLoadError) {
      observationsError = true;
    } else {
      savedObservations = observations || [];
    }
  }

  const canEdit =
    !criteriaError &&
    criteria.length > 0 &&
    !assessmentError &&
    !scoresError &&
    !observationsError &&
    existingAssessment?.status !== 'published';

  async function saveDraft(formData: FormData) {
    'use server';

    const result = await saveAssessmentDraft(
      numericPlayerId,
      formData
    );

    if (result.success) {
      redirect(
        `/coach/new-assessment/${numericPlayerId}?saved=1`
      );
    }

    redirect(
      `/coach/new-assessment/${numericPlayerId}?error=${encodeURIComponent(
        result.message
      )}`
    );
  }

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
        <h2>Winter 2026 – Final Assessment</h2>

        <p>
          Select the score that best reflects the
          player's observed development.
        </p>

        <p className="muted">
          You can save a partially completed assessment
          and return later.
        </p>

        {saved === '1' && (
          <div className="notice">
            <p>
              <strong>Draft saved successfully!</strong>
            </p>
          </div>
        )}

        {saveError && (
          <div className="notice">
            <p>
              <strong>Unable to save:</strong> {saveError}
            </p>
          </div>
        )}

        {criteriaError ||
        assessmentError ||
        scoresError ||
        observationsError ? (
          <div className="notice">
            <p>
              Unable to load the assessment.
              Please try again.
            </p>
          </div>
        ) : existingAssessment?.status === 'published' ? (
          <div className="notice">
            <h3>Assessment already published</h3>
            <p>
              This assessment can no longer be edited.
            </p>
          </div>
        ) : criteria.length === 0 ? (
          <div className="notice">
            <p>No scoring criteria are available.</p>
          </div>
        ) : canEdit ? (
          <form action={saveDraft}>
            <input
              type="hidden"
              name="draft_version"
              value={existingAssessment?.draft_version ?? 0}
            />

            {categories.map((category) => {
              const categoryCriteria = criteria.filter(
                (item) => item.category === category
              );

              return (
                <section
                  key={category}
                  style={{ marginTop: '32px' }}
                >
                  <h2>{category}</h2>

                  {categoryCriteria.map((item) => {
                    const previous = savedScores.find(
                      (score) =>
                        score.category === item.category &&
                        score.criterion === item.criterion
                    );

                    const wasNotObserved =
                      savedObservations.some(
                        (observation) =>
                          observation.category ===
                            item.category &&
                          observation.criterion ===
                            item.criterion
                      );

                    const fieldName =
                      `score:${item.category}:${item.criterion}`;

                    return (
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
                        ].map((description, index) => {
                          const value = index + 1;

                          return (
                            <label
                              key={value}
                              style={{
                                display: 'flex',
                                gap: '12px',
                                padding: '12px 0',
                                cursor: 'pointer',
                              }}
                            >
                              <input
                                type="radio"
                                name={fieldName}
                                value={value}
                                defaultChecked={
                                  previous?.score === value
                                }
                                style={{ marginTop: '5px' }}
                              />

                              <span>
                                <strong>{value} — </strong>
                                {description}
                              </span>
                            </label>
                          );
                        })}

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
                            name={fieldName}
                            value="not-observed"
                            defaultChecked={wasNotObserved}
                          />

                          <span>Not Observed</span>
                        </label>
                      </div>
                    );
                  })}
                </section>
              );
            })}

            <FeedbackFields
              criteria={criteria.map((item) => ({
                category: item.category,
                criterion: item.criterion,
              }))}
              initialStrength={
                existingAssessment?.strength ?? ''
              }
              initialGoal1={
                existingAssessment?.next_step_1 ?? ''
              }
              initialGoal2={
                existingAssessment?.next_step_2 ?? ''
              }
            />

            <div
              style={{
                position: 'sticky',
                bottom: '12px',
                background: '#ffffff',
                padding: '20px',
                border: '1px solid #ddd',
                borderRadius: '12px',
                marginTop: '32px',
                zIndex: 10,
              }}
            >
              <button
                type="submit"
                style={{
                  padding: '14px 28px',
                  backgroundColor: '#742533',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Save Draft
              </button>

              <p className="muted">
                This assessment will not be visible
                to parents until published.
              </p>
            </div>
          </form>
        ) : null}
      </section>
    </main>
  );
}
