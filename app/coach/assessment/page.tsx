
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { supabaseServer } from '../../../lib/supabase';

export const dynamic = 'force-dynamic';

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

export default async function CoachAssessmentPage() {
  const supabase = await supabaseServer();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/login');
  }

  // Check that the signed-in user is an active coach.
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
          Your account is not authorised to view
          Cub Hub assessment guidance.
        </p>
        <Link href="/coach">Return to Coach Dashboard</Link>
      </main>
    );
  }

  // Load the scoring guidance from Supabase.
  const { data, error } = await supabase
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
          <h1>Coach Assessment Guidance</h1>
          <p>Welcome, {coach.full_name}</p>
        </div>

        <Link href="/coach">← Coach Dashboard</Link>
      </div>

      <section className="profile">
        <h2>Assessment scoring framework</h2>

        <p>
          Use these descriptions to assess players
          consistently across Cub Hub sessions.
          Scores should reflect observed development,
          not a ranking of children.
        </p>

        <p className="muted">
          This page is read-only. Assessment entry
          and draft saving will be added next.
        </p>

        {error ? (
          <div className="notice">
            <p>Unable to load assessment criteria.</p>
          </div>
        ) : criteria.length === 0 ? (
          <div className="notice">
            <p>No assessment criteria are available.</p>
          </div>
        ) : (
          categories.map((category) => {
            const categoryCriteria = criteria.filter(
              (item) => item.category === category
            );

            if (categoryCriteria.length === 0) {
              return null;
            }

            return (
              <section key={category} style={{ marginTop: '32px' }}>
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
                      <div
                        key={index}
                        style={{
                          display: 'flex',
                          gap: '16px',
                          padding: '12px 0',
                          borderBottom: '1px solid #eee',
                        }}
                      >
                        <strong
                          style={{
                            minWidth: '24px',
                            color: '#742533',
                          }}
                        >
                          {index + 1}
                        </strong>

                        <span>{description}</span>
                      </div>
                    ))}
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
