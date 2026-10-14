
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { supabaseServer } from '../../lib/supabase';

export const dynamic = 'force-dynamic';

type Assessment = {
  id: number;
  player_id: number;
  period_label: string;
  status: string;
  created_at: string;
};

type Player = {
  id: number;
  first_name: string;
  last_name: string;
  age_group: string;
};

export default async function ProgrammeLeadPage() {
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
        <p>
          This page is only available to authorised
          Cub Hub Programme Leads.
        </p>
        <Link href="/portal">Return to Parent Portal</Link>
      </main>
    );
  }

  const {
    data: assessmentsData,
    error: assessmentsError,
  } = await supabase
    .from('assessments')
    .select(
      'id, player_id, period_label, status, created_at'
    )
    .order('created_at', { ascending: false });

  const assessments = (assessmentsData || []) as Assessment[];

  const playerIds = [
    ...new Set(assessments.map((a) => a.player_id)),
  ];

  let players: Player[] = [];
  let playersError = false;

  if (playerIds.length > 0) {
    const { data, error } = await supabase
      .from('players')
      .select('id, first_name, last_name, age_group')
      .in('id', playerIds);

    if (error) {
      playersError = true;
    } else {
      players = (data || []) as Player[];
    }
  }
const {
  count: totalPlayers,
  error: totalPlayersError,
} = await supabase
  .from('players')
  .select('*', { count: 'exact', head: true });

const {
  count: activeCoaches,
  error: activeCoachesError,
} = await supabase
  .from('coaches')
  .select('*', { count: 'exact', head: true })
  .eq('is_active', true);
  const draftCount = assessments.filter(
    (a) => a.status === 'draft'
  ).length;

  const publishedCount = assessments.filter(
    (a) => a.status === 'published'
  ).length;

  return (
    <main className="wrap section">
      <div className="portalhead">
        <div>
          <p className="eyebrow">
            SUFFOLK CRICKET · CUB HUB
          </p>
          <h1>Programme Lead Dashboard</h1>
          
<div
  style={{
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
    marginTop: '20px',
    marginBottom: '24px',
  }}
>
  <Link
    href="/programme-lead/manage-players"
    style={{
      display: 'inline-block',
      padding: '12px 20px',
      backgroundColor: '#742533',
      color: 'white',
      borderRadius: '8px',
      textDecoration: 'none',
      fontWeight: 'bold',
    }}
  >
    Manage Players
  </Link>
  <a
  href="/programme-lead/assign-players"
  style={{
    display: "inline-block",
    padding: "12px 20px",
    backgroundColor: "#d0a22a",
    color: "#172f40",
    fontWeight: "bold",
    borderRadius: 8,
    textDecoration: "none",
    margin: 8,
  }}
>
  Manage Coach Assignments
</a>
  
<Link
  href="/programme-lead/manage-coaches"
  style={{
    display: 'inline-block',
    padding: '12px 20px',
    backgroundColor: '#172f40',
    color: 'white',
    borderRadius: '8px',
    textDecoration: 'none',
    fontWeight: 'bold',
  }}
>
  Manage Coaches
</Link>


  <Link
    href="/programme-lead/add-player"
    style={{
      display: 'inline-block',
      padding: '12px 20px',
      border: '1px solid #742533',
      color: '#742533',
      borderRadius: '8px',
      textDecoration: 'none',
      fontWeight: 'bold',
    }}
  >
    + Add New Player
  </Link>
</div>

          <p>
            Review and manage player assessments
            before they are published to parents.
          </p>
        </div>

        <Link href="/coach">
          ← Coach Dashboard
        </Link>
      </div>

      {assessmentsError || playersError ? (
        <section className="profile">
          <h2>Unable to load assessments</h2>
          <p>
            Please refresh the page or try again later.
          </p>
        </section>
      ) : (
        <>
          <section className="profile">
            <h2>Assessment Overview</h2>
            <div
  style={{
    display: 'flex',
    gap: '16px',
    flexWrap: 'wrap',
    marginTop: '20px',
  }}
>
  <div className="report" style={{ flex: 1, minWidth: '180px' }}>
    <h3>Total Players</h3>
    <p style={{ fontSize: '32px', fontWeight: 700 }}>
      {totalPlayersError ? '—' : totalPlayers ?? 0}
    </p>
  </div>

  <div className="report" style={{ flex: 1, minWidth: '180px' }}>
    <h3>Active Coaches</h3>
    <p style={{ fontSize: '32px', fontWeight: 700 }}>
      {activeCoachesError ? '—' : activeCoaches ?? 0}
    </p>
  </div>
</div>

            <div
              style={{
                display: 'flex',
                gap: '16px',
                flexWrap: 'wrap',
                marginTop: '20px',
              }}
            >
              <div className="report" style={{ flex: 1 }}>
                <h3>Draft Assessments</h3>
                <p style={{ fontSize: '32px', fontWeight: 700 }}>
                  {draftCount}
                </p>
              </div>

              <div className="report" style={{ flex: 1 }}>
                <h3>Published Assessments</h3>
                <p style={{ fontSize: '32px', fontWeight: 700 }}>
                  {publishedCount}
                </p>
              </div>

              <div className="report" style={{ flex: 1 }}>
                <h3>Total Assessments</h3>
                <p style={{ fontSize: '32px', fontWeight: 700 }}>
                  {assessments.length}
                </p>
              </div>
            </div>
          </section>

          <section
            className="profile"
            style={{ marginTop: '24px' }}
          >
            <h2>All Player Assessments</h2>

            {assessments.length === 0 ? (
              <p>No assessments have been created yet.</p>
            ) : (
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
                      <th style={cellStyle}>Player</th>
                      <th style={cellStyle}>Age Group</th>
                      <th style={cellStyle}>Assessment</th>
                      <th style={cellStyle}>Status</th>
                      <th style={cellStyle}>Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {assessments.map((assessment) => {
                      const player = players.find(
                        (p) => p.id === assessment.player_id
                      );

                      return (
                        <tr key={assessment.id}>
                          <td style={cellStyle}>
                            {player
                              ? `${player.first_name} ${player.last_name}`
                              : 'Unknown player'}
                          </td>

                          <td style={cellStyle}>
                            {player?.age_group || '—'}
                          </td>

                          <td style={cellStyle}>
                            {assessment.period_label}
                          </td>

                          <td style={cellStyle}>
                            <span
                              style={{
                                fontWeight: 600,
                                color:
                                  assessment.status === 'published'
                                    ? '#287a4b'
                                    : '#986b12',
                              }}
                            >
                              {assessment.status === 'published'
                                ? 'Published'
                                : 'Draft'}
                            </span>
                          </td>
                          <td style={cellStyle}>
    <Link
  href={`/programme-lead/assessment/${assessment.id}`}
    style={{
      color: '#742533',
      fontWeight: 600,
      textDecoration: 'underline',
    }}
  >
    Review Assessment →
  </Link>
</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </main>
  );
}

const cellStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: '14px',
  borderBottom: '1px solid #ddd',
};
