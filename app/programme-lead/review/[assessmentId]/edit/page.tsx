
import Link from "next/link";
import { redirect } from "next/navigation";
import { supabaseServer } from "../../../../../lib/supabase";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ assessmentId: string }>;
};

export default async function EditAssessmentPage({
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
    redirect("/login");
  }

  const { data: lead, error: leadError } = await supabase
    .from("programme_leads")
    .select("user_id")
    .eq("user_id", user.id)
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
      </main>
    );
  }

  const { data: assessment, error: assessmentError } =
    await supabase
      .from("assessments")
      .select(
        "id, player_id, period_label, status, draft_version, strength, next_step_1, next_step_2"
      )
      .eq("id", id)
      .maybeSingle();

  if (assessmentError || !assessment) {
    return (
      <main className="wrap section">
        <h1>Assessment not found</h1>
      </main>
    );
  }

  if (assessment.status !== "draft") {
    return (
      <main className="wrap section">
        <h1>Assessment cannot be edited</h1>

        <p>
          This assessment has already been published.
          Published assessments are read-only.
        </p>

        <Link href={`/programme-lead/assessment/${id}`}>
          Return to Assessment Review
        </Link>
      </main>
    );
  }

  const { data: player, error: playerError } = await supabase
    .from("players")
    .select("first_name, last_name, age_group")
    .eq("id", assessment.player_id)
    .maybeSingle();

  if (playerError || !player) {
    return (
      <main className="wrap section">
        <h1>Unable to load player</h1>
      </main>
    );
  }

  return (
    <main className="wrap section">
      <div className="portalhead">
        <div>
          <p className="eyebrow">
            SUFFOLK CRICKET · CUB HUB
          </p>

          <h1>Edit Assessment</h1>

          <p>
            {player.first_name} {player.last_name}
            {" · "}
            {player.age_group}
          </p>
        </div>

        <Link href={`/programme-lead/assessment/${id}`}>
          ← Back to Assessment Review
        </Link>
      </div>

      <section className="profile">
        <h2>{assessment.period_label}</h2>

        <p>
          <strong>Status:</strong> Draft
        </p>

        <p>
          This assessment is ready for editing.
          In the next step, we'll add the score and
          development feedback fields.
        </p>
      </section>
    </main>
  );
}
