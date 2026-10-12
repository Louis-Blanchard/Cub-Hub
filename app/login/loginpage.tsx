
"use client";

import { useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function signIn(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo:
          `${window.location.origin}/auth/callback`,
        shouldCreateUser: false,
      },
    });

    setLoading(false);

    if (error) {
      setMessage("Unable to send sign-in link. Please contact Cub Hub.");
    } else {
      setMessage(
        "If this email has an approved account, a sign-in link will arrive shortly. Please check your inbox."
      );
    }
  }

  return (
    <main style={{
      minHeight: "100vh",
      background: "#f4f7fa",
      padding: "60px 20px"
    }}>
      <div style={{
        maxWidth: 440,
        margin: "auto",
        background: "white",
        padding: 36,
        borderRadius: 16,
        boxShadow: "0 8px 30px #00335515"
      }}>
        <p style={{ color: "#004977", fontWeight: 700 }}>
          SUFFOLK CRICKET
        </p>

        <h1 style={{ color: "#004977" }}>
          Cub Hub Parent Login
        </h1>

        <p>
          Sign in to access your child's cricket
          development reports.
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
            autoComplete="email"
            style={{
              display: "block",
              width: "100%",
              boxSizing: "border-box",
              padding: 14,
              marginTop: 8,
              marginBottom: 20,
              border: "1px solid #ccc",
              borderRadius: 8
            }}
          />

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: 14,
              background: "#004977",
              color: "white",
              border: 0,
              borderRadius: 8,
              cursor: "pointer"
            }}
          >
            {loading ? "Sending..." : "Send sign-in link"}
          </button>
        </form>

        {message && <p role="status">{message}</p>}

        <p style={{ marginTop: 24 }}>
          <Link href="/">← Back to Cub Hub</Link>
        </p>
      </div>
    </main>
  );
}
