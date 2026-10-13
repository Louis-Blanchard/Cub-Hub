
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { supabaseServer } from '../../../lib/supabase';
import { addPlayer } from './actions';

export const dynamic = 'force-dynamic';

type PageProps = {
  searchParams: Promise<{ saved?: string }>;
};

export default async function AddPlayerPage({
  searchParams,
}: PageProps) {
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
        <p>Programme Lead access is required.</p>
      </main>
    );
  }

  const { saved } = await searchParams;

  return (
    <main className="wrap section">
      <p className="eyebrow">
        SUFFOLK CRICKET · CUB HUB
      </p>

      <h1>Add New Player</h1>

      <p>
        Enter the details of a player joining
        the Cub Hub programme.
      </p>

      {saved === '1' && (
        <section
          className="profile"
          style={{
            marginTop: '24px',
            borderColor: '#2e7d32',
          }}
        >
          <h2>Player added successfully!</h2>
          <p>
            The player has been saved to the
            Cub Hub database.
          </p>
          <p>
            You can now add another player.
          </p>
        </section>
      )}

      <section
        className="profile"
        style={{ marginTop: '24px' }}
      >
        <h2>Player Details</h2>

        <form action={addPlayer}>
          <div style={{ marginTop: '20px' }}>
            <label htmlFor="first_name">
              <strong>First name</strong>
            </label>

            <div style={{ marginTop: '8px' }}>
              <input
                id="first_name"
                type="text"
                name="first_name"
                placeholder="First name"
                maxLength={100}
                required
                style={{
                  padding: '12px',
                  width: '100%',
                  maxWidth: '420px',
                  fontSize: '16px',
                }}
              />
            </div>
          </div>

          <div style={{ marginTop: '20px' }}>
            <label htmlFor="last_name">
              <strong>Surname</strong>
            </label>

            <div style={{ marginTop: '8px' }}>
              <input
                id="last_name"
                type="text"
                name="last_name"
                placeholder="Surname"
                maxLength={100}
                required
                style={{
                  padding: '12px',
                  width: '100%',
                  maxWidth: '420px',
                  fontSize: '16px',
                }}
              />
            </div>
          </div>

          <div style={{ marginTop: '20px' }}>
            <label htmlFor="age_group">
              <strong>Age group</strong>
            </label>

            <div style={{ marginTop: '8px' }}>
              <select
                id="age_group"
                name="age_group"
                required
                defaultValue=""
                style={{
                  padding: '12px',
                  width: '100%',
                  maxWidth: '420px',
                  fontSize: '16px',
                }}
              >
                <option value="" disabled>
                  Select age group
                </option>
                <option value="U9">U9</option>
                <option value="U10">U10</option>
                <option value="U11">U11</option>
                <option value="U12">U12</option>
              </select>
            </div>
          </div>

          <div style={{ marginTop: '30px' }}>
            <button
              type="submit"
              style={{
                backgroundColor: '#742533',
                color: 'white',
                padding: '14px 28px',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer',
              }}
            >
              Save Player
            </button>
          </div>
        </form>
      </section>

      <p style={{ marginTop: '24px' }}>
        <Link href="/programme-lead">
          ← Back to Programme Lead Dashboard
        </Link>
      </p>
    </main>
  );
}
