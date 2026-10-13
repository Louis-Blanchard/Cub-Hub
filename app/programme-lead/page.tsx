
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { supabaseServer } from '../../lib/supabase';

export const dynamic = 'force-dynamic';

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

  return (
    <main className="wrap section">
      <div className="portalhead">
        <div>
          <p className="eyebrow">
            SUFFOLK CRICKET · CUB HUB
          </p>
          <h1>Programme Lead Dashboard</h1>
          <p>
            Review and manage player assessments
            before they are published to parents.
          </p>
        </div>

        <Link href="/coach">
          ← Coach Dashboard
        </Link>
      </div>

      <section className="profile">
        <h2>Assessment Management</h2>

        <p>
          Your Programme Lead access is active.
        </p>

        <p className="muted">
          The assessment review and publishing
          features will be added next.
        </p>
      </section>
    </main>
  );
}
