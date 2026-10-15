
'use client';

import { createBrowserClient } from '@supabase/ssr';
import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const supabase =
    url && key
      ? createBrowserClient(url, key, {
          auth: { flowType: 'pkce' },
        })
      : null;

  useEffect(() => {
    if (!supabase) return;

    supabase.auth.getSession().then(({ data }) => {
      setReady(Boolean(data.session));
    });
  }, [supabase]);

  async function resetPassword(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage('');

    if (!supabase) {
      setMessage('Supabase is not configured.');
      return;
    }

    if (password.length < 12) {
      setMessage('Please use at least 12 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setMessage('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) {
        setMessage(`Password reset failed: ${error.message}`);
        return;
      }

      await supabase.auth.signOut();
      setMessage('Password updated successfully. You can now sign in.');
      setReady(false);
      setPassword('');
      setConfirmPassword('');
    } catch {
      setMessage('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login">
      <div className="loginbox">
        <Link href="/login">← Back to login</Link>

        <p className="eyebrow">SUFFOLK CRICKET</p>
        <h1>Choose a new password</h1>

        {ready ? (
          <form onSubmit={resetPassword}>
            <label htmlFor="password">New password</label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={12}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <label htmlFor="confirmPassword">Confirm new password</label>
            <input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              minLength={12}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />

            <button type="submit" className="button" disabled={loading}>
              {loading ? 'Updating...' : 'Update password'}
            </button>
          </form>
        ) : (
          <p>
            No active recovery session was found. Please use the
            password reset link sent to your email.
          </p>
        )}

        <p aria-live="polite" role="status">
          {message}
        </p>
      </div>
    </main>
  );
}
