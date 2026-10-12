
'use client';

import { createBrowserClient } from '@supabase/ssr';
import { useState, type FormEvent } from 'react';
import Link from 'next/link';

export default function Login() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function signIn(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage('Sending your sign-in link...');

    try {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!url || !key) {
        setMessage(
          'Supabase is not configured. Check your Vercel environment variables.'
        );
        return;
      }

      const supabase = createBrowserClient(url, key, {
  auth: {
    flowType: 'pkce',
  },
});

      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          shouldCreateUser: false,
        },
      });

      if (error) {
        console.error('Supabase login error:', error.message);
        setMessage(`Sign-in error: ${error.message}`);
        return;
      }

      setMessage(
        'If this email belongs to an existing account, check your inbox for a sign-in link.'
      );
    } catch (error) {
      console.error('Login error:', error);
      setMessage(
        error instanceof Error
          ? `Login error: ${error.message}`
          : 'An unexpected error occurred.'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login">
      <div className="loginbox">
        <Link href="/">← Cub Hub homepage</Link>

        <p className="eyebrow">SUFFOLK CRICKET</p>
        <h1>Parent portal</h1>

        <p>
          Sign in using your registered email address.
          Parent access is only granted after Suffolk Cricket
          verifies your link to a child.
        </p>

        <form onSubmit={signIn}>
          <label htmlFor="email">Email address</label>

          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="parent@example.com"
          />

          <button
            type="submit"
            disabled={loading}
            className="button"
          >
            {loading ? 'Sending...' : 'Email me a sign-in link'}
          </button>
        </form>

        <p aria-live="polite" role="status">
          {message}
        </p>
      </div>
    </main>
  );
}
