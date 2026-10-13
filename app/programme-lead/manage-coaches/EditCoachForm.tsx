
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateCoach } from "./actions";

type Coach = {
  id: string;
  full_name: string;
  is_active: boolean;
};

export default function EditCoachForm({ coach }: { coach: Coach }) {
  const router = useRouter();

  const [name, setName] = useState(coach.full_name);
  const [isActive, setIsActive] = useState(coach.is_active);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSaving(true);
    setMessage("");
    setError("");

    try {
      const formData = new FormData();
      formData.set("coach_id", coach.id);
      formData.set("full_name", name);
      formData.set("is_active", String(isActive));

      const result = await updateCoach(formData);

      if (result.error) {
        setError(result.error);
      } else {
        setMessage("Coach updated successfully.");
        router.refresh();
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: 12 }}>
      <div style={{ marginBottom: 12 }}>
        <label htmlFor={`name-${coach.id}`}>Coach name</label>
        <input
          id={`name-${coach.id}`}
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          minLength={2}
          maxLength={100}
          required
          style={{
            display: "block",
            width: "100%",
            maxWidth: 400,
            padding: 10,
            marginTop: 6,
          }}
        />
      </div>

      <div style={{ marginBottom: 12 }}>
        <label htmlFor={`status-${coach.id}`}>Coach status</label>
        <select
          id={`status-${coach.id}`}
          value={String(isActive)}
          onChange={(event) => setIsActive(event.target.value === "true")}
          style={{
            display: "block",
            padding: 10,
            marginTop: 6,
          }}
        >
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
      </div>

      <button type="submit" disabled={saving}>
        {saving ? "Saving..." : "Save Changes"}
      </button>

      {message && (
        <p role="status" style={{ color: "green" }}>
          {message}
        </p>
      )}

      {error && (
        <p role="alert" style={{ color: "red" }}>
          {error}
        </p>
      )}
    </form>
  );
}
