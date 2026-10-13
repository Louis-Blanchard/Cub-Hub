
"use client";

import { useState } from "react";
import { assignPlayer } from "./actions";

type Coach = {
  id: string;
  full_name: string;
};

type Player = {
  id: number;
  first_name: string;
  last_name: string;
  age_group: string;
};

export default function AssignPlayerForm({
  coaches,
  players,
}: {
  coaches: Coach[];
  players: Player[];
}) {
  const [coachId, setCoachId] = useState("");
  const [playerId, setPlayerId] = useState("");
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
      formData.set("coach_id", coachId);
      formData.set("player_id", playerId);

      const result = await assignPlayer(formData);

      if (result.error) {
        setError(result.error);
      } else if (result.success) {
        setMessage(result.success);
        setPlayerId("");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section style={{ marginTop: 30, marginBottom: 40 }}>
      <h2>Assign a Player</h2>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 16 }}>
          <label htmlFor="coach">Select Coach</label>

          <select
            id="coach"
            value={coachId}
            onChange={(event) => setCoachId(event.target.value)}
            required
            style={{
              display: "block",
              padding: 12,
              width: "100%",
              marginTop: 8,
            }}
          >
            <option value="">Choose a coach</option>
            {coaches.map((coach) => (
              <option key={coach.id} value={coach.id}>
                {coach.full_name}
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label htmlFor="player">Select Player</label>

          <select
            id="player"
            value={playerId}
            onChange={(event) => setPlayerId(event.target.value)}
            required
            style={{
              display: "block",
              padding: 12,
              width: "100%",
              marginTop: 8,
            }}
          >
            <option value="">Choose a player</option>
            {players.map((player) => (
              <option key={player.id} value={player.id}>
                {player.first_name} {player.last_name} —{" "}
                {player.age_group}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={loading || !coachId || !playerId}
        >
          {loading ? "Assigning..." : "Assign Player"}
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
    </section>
  );
}
