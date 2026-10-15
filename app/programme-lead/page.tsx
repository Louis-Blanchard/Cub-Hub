
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { supabaseServer } from '../../lib/supabase';
import AssessmentTable from "./AssessmentTable";

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
  const { data: ageGroupPlayers, error: ageGroupError } =
  await supabase
    .from('players')
    .select('age_group');

const ageGroups = ['U9', 'U10', 'U11', 'U12'];

const ageGroupCounts = ageGroups.map((group) => ({
  group,
  count: (ageGroupPlayers || []).filter(
    (player) => player.age_group === group
  ).length,
}));
  const assessmentPeriods = [
  ...new Set(
    assessments.map((assessment) => assessment.period_label)
  ),
];

const assessmentProgress = assessmentPeriods.map((period) => {
  const periodAssessments = assessments.filter(
    (assessment) => assessment.period_label === period
  );

  const assessedPlayers = new Set(
    periodAssessments.map((assessment) => assessment.player_id)
  );

  const publishedPlayers = new Set(
    periodAssessments
      .filter((assessment) => assessment.status === 'published')
      .map((assessment) => assessment.player_id)
  );

  const completed = assessedPlayers.size;
  const published = publishedPlayers.size;
  const total = totalPlayers ?? 0;

  return {
    period,
    completed,
    published,
    awaiting: Math.max(total - completed, 0),
    percentage:
      total > 0
        ? Math.round((completed / total) * 100)
        : 0,
  };
});
  
const {
  data: coachAssignments,
  error: coachAssignmentsError,
} = await supabase
  .from("coach_players")
  .select("coach_id, player_id");

const {
  data: coachDetails,
  error: coachDetailsError,
} = await supabase
  .from("coaches")
  .select("id, full_name");

const assignedCoachNames = new Map<number, string[]>();

if (!coachAssignmentsError && !coachDetailsError) {
  for (const assignment of coachAssignments || []) {
    const coach = (coachDetails || []).find(
      (c) => c.id === assignment.coach_id
    );

    if (coach) {
      const existing =
        assignedCoachNames.get(assignment.player_id) || [];

      existing.push(coach.full_name);

      assignedCoachNames.set(
        assignment.player_id,
        existing
      );
    }
  }
}

const {
  data: allPlayersData,
  error: allPlayersError,
} = await supabase
  .from("players")
  .select("id, first_name, last_name, age_group")
  .order("last_name", { ascending: true });

const missingAssessments = assessmentPeriods.map((period) => {
  const assessedPlayerIds = new Set(
    assessments
      .filter((assessment) => assessment.period_label === period)
      .map((assessment) => assessment.player_id)
  );

  const missingPlayers = (allPlayersData || [])
    .filter((player) => !assessedPlayerIds.has(player.id))
    .map((player) => ({
      id: player.id,
      name: `${player.first_name} ${player.last_name}`,
      ageGroup: player.age_group,
      coaches: [
        ...new Set(assignedCoachNames.get(player.id) || []),
      ],
    }));

  return {
    period,
    players: missingPlayers,
  };
});

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
<section className="profile" style={{ marginTop: '24px' }}>
  <h2>Players by Age Group</h2>

  {ageGroupError ? (
    <p>Unable to load age-group statistics.</p>
  ) : (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '16px',
        marginTop: '20px',
      }}
    >
      {ageGroupCounts.map(({ group, count }) => (
        <div className="report" key={group}>
          <h3>{group}</h3>
          <p style={{ fontSize: '32px', fontWeight: 700 }}>
            {count}
          </p>
        </div>
      ))}
    </div>
  )}
</section>
          
<section className="profile" style={{ marginTop: "24px" }}>
  <h2>Assessment Progress</h2>

  <p>
    Track assessment completion separately for each
    assessment period.
  </p>

  {assessmentProgress.length === 0 ? (
    <p>No assessment periods have been created yet.</p>
  ) : (
    <div style={{ display: "grid", gap: "24px", marginTop: "24px" }}>
      {assessmentProgress.map((progress) => (
        <div className="report" key={progress.period}>
          <h3>{progress.period}</h3>

          <p style={{ fontSize: "20px", fontWeight: 700 }}>
            {progress.completed} of {totalPlayers ?? 0} players assessed
            ({progress.percentage}%)
          </p>

          <div
            style={{
              width: "100%",
              height: "16px",
              backgroundColor: "#e5e7eb",
              borderRadius: "10px",
              overflow: "hidden",
              marginTop: "12px",
              marginBottom: "16px",
            }}
          >
            <div
              style={{
                width: `${progress.percentage}%`,
                height: "100%",
                backgroundColor: "#742533",
                borderRadius: "10px",
              }}
            />
          </div>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "20px",
            }}
          >
            <p><strong>Assessed:</strong> {progress.completed}</p>
            <p><strong>Published:</strong> {progress.published}</p>
            <p><strong>Awaiting:</strong> {progress.awaiting}</p>
          </div>
        </div>
      ))}
    </div>
  )}
</section>

<section className="profile" style={{ marginTop: "24px" }}>
  <h2>Missing Assessments</h2>

  <p>
    View players who have not yet received an assessment
    for each period, alongside their assigned coaches.
  </p>

  {allPlayersError || coachAssignmentsError || coachDetailsError ? (
    <p role="alert">
      Unable to load missing assessments or coach assignments.
      Please refresh the page or try again later.
    </p>
  ) : missingAssessments.length === 0 ? (
    <p>No assessment periods are available yet.</p>
  ) : (
    <div style={{ display: "grid", gap: "24px", marginTop: "24px" }}>
      {missingAssessments.map(({ period, players }) => (
        <div className="report" key={period}>
          <h3>{period}</h3>

          <p>
            <strong>{players.length}</strong> players awaiting assessment
          </p>

          {players.length === 0 ? (
            <p>All registered players have an assessment for this period.</p>
          ) : (
            <div style={{ overflowX: "auto", marginTop: "16px" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                }}
              >
                <thead>
                  <tr>
                    <th style={cellStyle}>Player</th>
                    <th style={cellStyle}>Age Group</th>
                    <th style={cellStyle}>Assigned Coaches</th>
                  </tr>
                </thead>

                <tbody>
                  {players.map((player) => (
                    <tr key={player.id}>
                      <td style={cellStyle}>{player.name}</td>
                      <td style={cellStyle}>{player.ageGroup}</td>
                      <td style={cellStyle}>
  {player.coaches.length > 0 ? (
    player.coaches.join(", ")
  ) : (
    <Link
      href="/programme-lead/assign-players"
      style={{
        color: "#742533",
        fontWeight: 600,
        textDecoration: "underline",
      }}
    >
      Assign Coach →
    </Link>
  )}
</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ))}
    </div>
  )}
</section>

          <section
            className="profile"
            style={{ marginTop: '24px' }}
          >
            <h2>All Player Assessments</h2>


<AssessmentTable
  assessments={assessments.map((assessment) => {
    const player = players.find(
      (p) => p.id === assessment.player_id
    );

    return {
      id: assessment.id,
      playerName: player
        ? `${player.first_name} ${player.last_name}`
        : "Unknown player",
      ageGroup: player?.age_group || "—",
      period: assessment.period_label,
      status: assessment.status,
    };
  })}
/>

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
