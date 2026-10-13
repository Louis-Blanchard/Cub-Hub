
'use client';

import { createBrowserClient } from '@supabase/ssr';
import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Login() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [method, setMethod] = useState<'password' | 'email'>('password');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function signIn(e: FormEvent<HTMLFormElement>) {
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
        auth: {
          flowType: 'pkce',
        },
      });

      if (method === 'password') {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) {
          setMessage(`Sign-in failed: ${error.message}`);
          return;
        }

        router.replace('/portal');
        router.refresh();
      } else {
        const { error } = await supabase.auth.signInWithOtp({
          email: email.trim(),
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
            shouldCreateUser: false,
          },
        });

        if (error) {
          setMessage(`Sign-in failed: ${error.message}`);
          return;
        }

        setMessage(
          'If this email belongs to an existing account, check your inbox for a sign-in link.'
        );
      }
    } catch (error) {
      console.error('Login error:', error);
      setMessage('An unexpected error occurred. Please try again.');
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

        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <button
            type="button"
            className="button"
            onClick={() => {
              setMethod('password');
              setMessage('');
            }}
            aria-pressed={method === 'password'}
          >
            Password
          </button>

          <button
            type="button"
            className="button"
            onClick={() => {
              setMethod('email');
              setMessage('');
            }}
            aria-pressed={method === 'email'}
          >
            Email link
          </button>
        </div>

        <form onSubmit={signIn}>
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

          {method === 'password' && (
            <>
              <label htmlFor="password">Password</label>

              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
              />
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="button"
          >
            {loading
              ? 'Signing in...'
              : method === 'password'
                ? 'Sign in'
                : 'Email me a sign-in link'}
          </button>
        </form>

        <p aria-live="polite" role="status">
          {message}
        </p>
      </div>
    </main>
  );
}
