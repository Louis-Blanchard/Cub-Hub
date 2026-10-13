
import Link from "next/link";
import { redirect } from "next/navigation";
import { supabaseServer } from "../../../lib/supabase";
import AssignPlayerForm from "./AssignPlayerForm";
import RemoveAssignmentButton from "./RemoveAssignmentButton";

export default async function AssignPlayersPage() {
  const supabase = await supabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: lead, error: leadError } = await supabase
    .from("programme_leads")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (leadError || !lead) {
    redirect("/portal");
  }

  const { data: coaches, error: coachesError } = await supabase
    .from("coaches")
    .select("id, full_name, is_active")
    .eq("is_active", true)
    .order("full_name");

  const { data: players, error: playersError } = await supabase
    .from("players")
    .select("id, first_name, last_name, age_group")
    .order("last_name")
    .order("first_name");

  const { data: assignments, error: assignmentsError } =
  await supabase
    .from("coach_players")
    .select("coach_id, player_id");
  if (coachesError || playersError || assignmentsError) {
    return (
      <main style={{ padding: 30 }}>
        <h1>Coach Assignments</h1>
        <p>Unable to load coaches or players.</p>
      </main>
    );
  }

  return (
    <main
      style={{
        maxWidth: 900,
        margin: "40px auto",
        padding: 24,
      }}
    >
      <Link href="/programme-lead">
        ← Back to Programme Lead Dashboard
      </Link>

      <h1>Assign Players to Coaches</h1>

      <p>
        Manage which Cub Hub players are assigned to each coach.
      </p>
<AssignPlayerForm
  coaches={coaches ?? []}
  players={players ?? []}
/>
      <h2>Active Coaches ({coaches?.length ?? 0})</h2>

      <ul>
  {coaches?.map((coach) => {
    const assignedPlayers = players?.filter((player) =>
      assignments?.some(
        (assignment) =>
          assignment.coach_id === coach.id &&
          assignment.player_id === player.id
      )
    );

    return (
      <li key={coach.id} style={{ marginBottom: 20 }}>
        <strong>{coach.full_name}</strong>

        {assignedPlayers?.length ? (
          <ul>
            {assignedPlayers.map((player) => (
  <li key={player.id} style={{ marginBottom: 10 }}>
    {player.first_name} {player.last_name}
    {" — "}
    {player.age_group}

    <RemoveAssignmentButton
      coachId={coach.id}
      playerId={player.id}
      playerName={`${player.first_name} ${player.last_name}`}
    />
  </li>
))}
          </ul>
        ) : (
          <p>No players assigned yet.</p>
        )}
      </li>
    );
  })}
</ul>

      <h2>Registered Players ({players?.length ?? 0})</h2>

      <ul>
        {players?.map((player) => (
          <li key={player.id}>
            {player.first_name} {player.last_name}
            {" — "}
            {player.age_group}
          </li>
        ))}
      </ul>

  
    </main>
  );
}
