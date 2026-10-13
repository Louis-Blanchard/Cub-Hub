
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

        <p>
          The form for entering the coach's name
          and email address will appear here next.
        </p>
      </section>
    </main>
  );
}
