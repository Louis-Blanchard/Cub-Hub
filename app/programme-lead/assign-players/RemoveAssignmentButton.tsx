
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { removeAssignment } from "./actions";

export default function RemoveAssignmentButton({
  coachId,
  playerId,
  playerName,
}: {
  coachId: string;
  playerId: number;
  playerName: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleRemove() {
    const confirmed = window.confirm(
      `Remove ${playerName} from this coach? The player and their assessments will not be deleted.`
    );

    if (!confirmed) return;

    setLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.set("coach_id", coachId);
      formData.set("player_id", String(playerId));

      const result = await removeAssignment(formData);

      if (result.error) {
        setError(result.error);
      } else {
        router.refresh();
      }
    } catch {
      setError("Unable to remove assignment. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <span style={{ marginLeft: 12 }}>
      <button
        type="button"
        onClick={handleRemove}
        disabled={loading}
        style={{
          padding: "4px 10px",
          fontSize: 14,
          cursor: loading ? "wait" : "pointer",
        }}
      >
        {loading ? "Removing..." : "Remove"}
      </button>

      {error && (
        <span role="alert" style={{ color: "red", marginLeft: 8 }}>
          {error}
        </span>
      )}
    </span>
  );
}
