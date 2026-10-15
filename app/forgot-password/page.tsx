
'use client';

import { createBrowserClient } from '@supabase/ssr';
import { useState, type FormEvent } from 'react';
import Link from 'next/link';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function sendResetEmail(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!url || !key) {
        setMessage('Supabase is not configured.');
        return;
      }

      const supabase = createBrowserClient(url, key, {
        auth: { flowType: 'pkce' },
      });

      const { error } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        {
          redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
        }
      );

      if (error) {
        setMessage('Unable to send the reset email. Please try again later.');
        return;
      }

      setMessage(
        'If this email belongs to an existing account, you will receive a password reset link.'
      );
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
        <h1>Reset your password</h1>

        <p>
          Enter your registered email address and we will send
          you a link to reset your password.
        </p>

        <form onSubmit={sendResetEmail}>
          <label htmlFor="email">Email address</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="parent@example.com"
          />

          <button type="submit" className="button" disabled={loading}>
            {loading ? 'Sending...' : 'Send reset link'}
          </button>
        </form>

        <p aria-live="polite" role="status">
          {message}
        </p>
      </div>
    </main>
  );
}
