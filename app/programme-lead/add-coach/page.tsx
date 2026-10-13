
import Link from "next/link";
import { redirect } from "next/navigation";
import { supabaseServer } from "../../../lib/supabase";

export const dynamic = "force-dynamic";

export default async function AddCoachPage() {
  const supabase = await supabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: lead, error } = await supabase
    .from("programme_leads")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !lead) {
    return (
      <main className="wrap section">
        <h1>Access denied</h1>
        <p>Only Programme Leads can add coaches.</p>
      </main>
    );
  }

  return (
    <main className="wrap section">
      <Link href="/programme-lead/manage-coaches">
        ← Back to Manage Coaches
      </Link>

      <h1>Add New Coach</h1>

      <p>
        Create a new coach account for the
        Suffolk Cricket Cub Hub programme.
      </p>

      
<section className="profile">
  <h2>Coach Details</h2>

  <form>
    <div style={{ marginBottom: "20px" }}>
      <label htmlFor="full_name">
        Coach Full Name
      </label>

      <input
        id="full_name"
        name="full_name"
        type="text"
        placeholder="e.g. John Smith"
        required
        maxLength={100}
        style={{
          display: "block",
          width: "100%",
          padding: "12px",
          marginTop: "8px",
        }}
      />
    </div>

    <div style={{ marginBottom: "20px" }}>
      <label htmlFor="email">
        Coach Email Address
      </label>

      <input
        id="email"
        name="email"
        type="email"
        placeholder="e.g. coach@example.com"
        required
        style={{
          display: "block",
          width: "100%",
          padding: "12px",
          marginTop: "8px",
        }}
      />
    </div>

    <p>
      A secure invitation will be sent to the
      coach so they can set up their own password.
    </p>

    <button type="button" disabled>
      Create Coach Account
    </button>

    <p>
      Account creation will be enabled in the next step.
    </p>
  </form>
</section>

    </main>
  );
}
