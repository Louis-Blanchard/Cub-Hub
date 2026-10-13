
"use client";

import { useState } from "react";
import { requestEmailChange } from "./actions";

export default function ChangeEmailPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setLoading(true);
    setMessage("");
    setError("");

    try {
      const formData = new FormData();
      formData.set("email", email);

      const result = await requestEmailChange(formData);

      if (result.error) {
        setError(result.error);
      } else if (result.success) {
        setMessage(result.success);
        setEmail("");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      style={{
        maxWidth: 520,
        margin: "50px auto",
        padding: 24,
      }}
    >
      <h1>Change Login Email</h1>

      <p>
        Update the email address used to log in to your
        Cub Hub Programme Lead account.
      </p>

      <form onSubmit={handleSubmit}>
        <label htmlFor="email">
          New email address
        </label>

        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(event) =>
            setEmail(event.target.value)
          }
          placeholder="Your Suffolk Cricket work email"
          style={{
            display: "block",
            width: "100%",
            padding: 12,
            marginTop: 8,
            marginBottom: 20,
            boxSizing: "border-box",
          }}
        />

        <button type="submit" disabled={loading}>
          {loading
            ? "Sending confirmation..."
            : "Request Email Change"}
        </button>
      </form>

      {error && (
        <p role="alert" style={{ color: "red" }}>
          {error}
        </p>
      )}

      {message && (
        <p role="status" style={{ color: "green" }}>
          {message}
        </p>
      )}
    </main>
  );
}
