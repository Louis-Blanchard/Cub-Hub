
import Link from "next/link";
import { redirect } from "next/navigation";
import { supabaseServer } from "../../../lib/supabase";

export default async function ManageCoachesPage() {
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
    redirect("/coach");
  }

  const { data: coaches, error } = await supabase
    .from("coaches")
    .select("id, full_name, is_active")
    .order("full_name");

  return (
    <main style={{ maxWidth: 1000, margin: "40px auto", padding: 20 }}>
      <Link href="/programme-lead">
        ← Back to Programme Lead Dashboard
      </Link>

      <h1>Manage Coaches</h1>

      <p>
        View and manage the coaches registered on the Suffolk Cricket
        Cub Hub programme.
      </p>

      {error ? (
        <p role="alert">Unable to load coaches: {error.message}</p>
      ) : (
        <>
          <h2>Registered Coaches ({coaches?.length ?? 0})</h2>

          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              marginTop: 20,
            }}
          >
            <thead>
              <tr>
                <th style={{ textAlign: "left", padding: 12 }}>Coach Name</th>
                <th style={{ textAlign: "left", padding: 12 }}>Status</th>
              </tr>
            </thead>

            <tbody>
              {(coaches ?? []).map((coach) => (
                <tr key={coach.id}>
                  <td style={{ padding: 12, borderTop: "1px solid #ddd" }}>
                    {coach.full_name}
                  </td>
                  <td style={{ padding: 12, borderTop: "1px solid #ddd" }}>
                    {coach.is_active ? "Active" : "Inactive"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {!coaches?.length && <p>No coaches registered yet.</p>}
        </>
      )}
    </main>
  );
}
