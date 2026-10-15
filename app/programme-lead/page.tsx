
import Link from "next/link";
import { redirect } from "next/navigation";
import { supabaseServer } from "../../lib/supabase";
import AssessmentTable from "./AssessmentTable";

export const dynamic = "force-dynamic";

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

type Coach = {
  id: string;
  full_name: string;
};

type CoachAssignment = {
  coach_id: string;
  player_id: number;
};

const cellStyle: React.CSSProperties = {
  textAlign: "left",
  padding: "14px",
  borderBottom: "1px solid #ddd",
};

const statNumberStyle: React.CSSProperties = {
  fontSize: "32px",
  fontWeight: 700,
};

const buttonStyle: React.CSSProperties = {
  display: "inline-block",
  padding: "12px 20px",
  borderRadius: "8px",
  textDecoration: "none",
  fontWeight: "bold",
};

export default async function ProgrammeLeadPage() {
  const supabase = await supabaseServer();

  // Check the signed-in user.
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  // Only Programme Leads can access this page.
  const { data: lead, error: leadError } = await supabase
    .from("programme_leads")
    .select("user_id")
    .eq("user_id", user.id)
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

  // Load all registered players.
  const {
    data: playersData,
    error: playersError,
  } = await supabase
    .from("players")
    .select("id, first_name, last_name, age_group")
    .order("last_name", { ascending: true });

  const players = (playersData || []) as Player[];

  // Load all assessments.
  const {
    data: assessmentsData,
    error: assessmentsError,
  } = await supabase
    .from("assessments")
    .select("id, player_id, period_label, status, created_at")
    .order("created_at", { ascending: false });

  const assessments = (assessmentsData || []) as Assessment[];

  // Load coaches.
  const {
    data: coachesData,
    error: coachesError,
  } = await supabase
    .from("coaches")
    .select("id, full_name, is_active");

  const coaches = coachesData || [];

  // Load coach-player assignments.
  const {
    data: assignmentsData,
    error: assignmentsError,
  } = await supabase
    .from("coach_players")
    .select("coach_id, player_id");

  const assignments = (assignmentsData || []) as CoachAssignment[];

  const hasDataError =
    !!playersError ||
    !!assessmentsError ||
    !!coachesError ||
    !!assignmentsError;

  // Dashboard totals.
  const totalPlayers = players.length;

  const activeCoaches = coaches.filter(
    (coach) => coach.is_active === true
  ).length;

  const draftCount = assessments.filter(
    (assessment) => assessment.status === "draft"
  ).length;

  const publishedCount = assessments.filter(
    (assessment) => assessment.status === "published"
  ).length;

  // Players by age group.
  const ageGroups = ["U9", "U10", "U11", "U12"];

  const ageGroupCounts = ageGroups.map((group) => ({
    group,
    count: players.filter(
      (player) => player.age_group === group
    ).length,
  }));

  // Match each player with their assigned coaches.
  const assignedCoachNames = new Map<number, string[]>();

  for (const assignment of assignments) {
    const coach = coaches.find(
      (item) => item.id === assignment.coach_id
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

  // Discover assessment periods automatically.
  const assessmentPeriods = [
    ...new Set(
      assessments.map((assessment) => assessment.period_label)
    ),
  ];

  // Calculate assessment progress for each period.
  const assessmentProgress = assessmentPeriods.map((period) => {
    const periodAssessments = assessments.filter(
      (assessment) => assessment.period_label === period
    );

    const assessedPlayerIds = new Set(
      periodAssessments.map(
        (assessment) => assessment.player_id
      )
    );

    const publishedPlayerIds = new Set(
      periodAssessments
        .filter(
          (assessment) => assessment.status === "published"
        )
        .map((assessment) => assessment.player_id)
    );

    const completed = players.filter(
      (player) => assessedPlayerIds.has(player.id)
    ).length;

    const published = players.filter(
      (player) => publishedPlayerIds.has(player.id)
    ).length;

    return {
      period,
      completed,
      published,
      awaiting: Math.max(totalPlayers - completed, 0),
      percentage:
        totalPlayers > 0
          ? Math.round((completed / totalPlayers) * 100)
          : 0,
    };
  });

  // Find players missing assessments for each period.
  const missingAssessments = assessmentPeriods.map((period) => {
    const assessedPlayerIds = new Set(
      assessments
        .filter(
          (assessment) => assessment.period_label === period
        )
        .map((assessment) => assessment.player_id)
    );

    const missingPlayers = players
      .filter(
        (player) => !assessedPlayerIds.has(player.id)
      )
      .map((player) => ({
        id: player.id,
        name: `${player.first_name} ${player.last_name}`,
        ageGroup: player.age_group,
        coaches: [
          ...new Set(
            assignedCoachNames.get(player.id) || []
          ),
        ],
      }));

    return {
      period,
      players: missingPlayers,
    };
  });

  // Prepare assessment data for the searchable table.
  const assessmentRows = assessments.map((assessment) => {
    const player = players.find(
      (item) => item.id === assessment.player_id
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
  });

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
              display: "flex",
              gap: "12px",
              flexWrap: "wrap",
              marginTop: "20px",
              marginBottom: "24px",
            }}
          >
            <Link
              href="/programme-lead/manage-players"
              style={{
                ...buttonStyle,
                backgroundColor: "#742533",
                color: "white",
              }}
            >
              Manage Players
            </Link>

            <Link
              href="/programme-lead/assign-players"
              style={{
                ...buttonStyle,
                backgroundColor: "#d0a22a",
                color: "#172f40",
              }}
            >
              Manage Coach Assignments
            </Link>

            <Link
              href="/programme-lead/manage-coaches"
              style={{
                ...buttonStyle,
                backgroundColor: "#172f40",
                color: "white",
              }}
            >
              Manage Coaches
            </Link>

            <Link
              href="/programme-lead/add-player"
              style={{
                ...buttonStyle,
                border: "1px solid #742533",
                color: "#742533",
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

      {hasDataError ? (
        <section className="profile">
          <h2>Unable to load dashboard information</h2>
          <p>
            Some information could not be retrieved from
            Supabase. Please refresh or try again later.
          </p>
        </section>
      ) : (
        <>
          {/* ASSESSMENT OVERVIEW */}
          <section className="profile">
            <h2>Assessment Overview</h2>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(180px, 1fr))",
                gap: "16px",
                marginTop: "20px",
              }}
            >
              <div className="report">
                <h3>Total Players</h3>
                <p style={statNumberStyle}>
                  {totalPlayers}
                </p>
              </div>

              <div className="report">
                <h3>Active Coaches</h3>
                <p style={statNumberStyle}>
                  {activeCoaches}
                </p>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(180px, 1fr))",
                gap: "16px",
                marginTop: "20px",
              }}
            >
              <div className="report">
                <h3>Draft Assessments</h3>
                <p style={statNumberStyle}>
                  {draftCount}
                </p>
              </div>

              <div className="report">
                <h3>Published Assessments</h3>
                <p style={statNumberStyle}>
                  {publishedCount}
                </p>
              </div>

              <div className="report">
                <h3>Total Assessments</h3>
                <p style={statNumberStyle}>
                  {assessments.length}
                </p>
              </div>
            </div>
          </section>

          {/* AGE GROUP STATISTICS */}
          <section
            className="profile"
            style={{ marginTop: "24px" }}
          >
            <h2>Players by Age Group</h2>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(150px, 1fr))",
                gap: "16px",
                marginTop: "20px",
              }}
            >
              {ageGroupCounts.map(({ group, count }) => (
                <div className="report" key={group}>
                  <h3>{group}</h3>
                  <p style={statNumberStyle}>
                    {count}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* ASSESSMENT PROGRESS */}
          <section
            className="profile"
            style={{ marginTop: "24px" }}
          >
            <h2>Assessment Progress</h2>

            <p>
              Track assessment completion separately
              for each assessment period.
            </p>

            {assessmentProgress.length === 0 ? (
              <p>No assessment periods are available yet.</p>
            ) : (
              <div
                style={{
                  display: "grid",
                  gap: "24px",
                  marginTop: "24px",
                }}
              >
                {assessmentProgress.map((progress) => (
                  <div
                    className="report"
                    key={progress.period}
                  >
                    <h3>{progress.period}</h3>

                    <p
                      style={{
                        fontSize: "20px",
                        fontWeight: 700,
                      }}
                    >
                      {progress.completed} of {totalPlayers} players
                      assessed ({progress.percentage}%)
                    </p>

                    <div
                      role="progressbar"
                      aria-label={`${progress.period} assessment progress`}
                      aria-valuenow={progress.completed}
                      aria-valuemin={0}
                      aria-valuemax={totalPlayers}
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
                      <p>
                        <strong>Assessed:</strong>{" "}
                        {progress.completed}
                      </p>

                      <p>
                        <strong>Published:</strong>{" "}
                        {progress.published}
                      </p>

                      <p>
                        <strong>Awaiting:</strong>{" "}
                        {progress.awaiting}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* MISSING ASSESSMENTS */}
          <section
            className="profile"
            style={{ marginTop: "24px" }}
          >
            <h2>Missing Assessments</h2>

            <p>
              View players who have not yet received an
              assessment for each period, alongside their
              assigned coaches.
            </p>

            {missingAssessments.length === 0 ? (
              <p>No assessment periods are available yet.</p>
            ) : (
              <div
                style={{
                  display: "grid",
                  gap: "24px",
                  marginTop: "24px",
                }}
              >
                {missingAssessments.map(
                  ({ period, players: missingPlayers }) => (
                    <div className="report" key={period}>
                      <h3>{period}</h3>

                      <p>
                        <strong>{missingPlayers.length}</strong>{" "}
                        {missingPlayers.length === 1
                          ? "player"
                          : "players"}{" "}
                        awaiting assessment
                      </p>

                      {missingPlayers.length === 0 ? (
                        <p>
                          All registered players have an
                          assessment for this period.
                        </p>
                      ) : (
                        <div
                          style={{
                            overflowX: "auto",
                            marginTop: "16px",
                          }}
                        >
                          <table
                            style={{
                              width: "100%",
                              borderCollapse: "collapse",
                            }}
                          >
                            <thead>
                              <tr>
                                <th style={cellStyle}>
                                  Player
                                </th>
                                <th style={cellStyle}>
                                  Age Group
                                </th>
                                <th style={cellStyle}>
                                  Assigned Coaches
                                </th>
                              </tr>
                            </thead>

                            <tbody>
                              {missingPlayers.map((player) => (
                                <tr key={player.id}>
                                  <td style={cellStyle}>
                                    {player.name}
                                  </td>

                                  <td style={cellStyle}>
                                    {player.ageGroup}
                                  </td>

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
                  )
                )}
              </div>
            )}
          </section>

          {/* SEARCHABLE ASSESSMENT TABLE */}
          <section
            className="profile"
            style={{ marginTop: "24px" }}
          >
            <h2>All Player Assessments</h2>

            <AssessmentTable
              assessments={assessmentRows}
            />
          </section>
        </>
      )}
    </main>
  );
}
