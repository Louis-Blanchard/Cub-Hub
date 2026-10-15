
"use client";

import { useState } from "react";

type Criterion = {
  category: string;
  criterion: string;
};

type Score = {
  category: string;
  criterion: string;
  score: number;
};

type Observation = {
  category: string;
  criterion: string;
};

type Props = {
  criteria: Criterion[];
  scores: Score[];
  observations: Observation[];
  strength: string;
  nextStep1: string;
  nextStep2: string;
};

const categories = [
  "Batting",
  "Bowling",
  "Fielding",
  "Wicketkeeping",
];

export default function AssessmentEditForm({
  criteria,
  scores,
  observations,
  strength,
  nextStep1,
  nextStep2,
}: Props) {
  const [values, setValues] = useState<Record<string, string>>(
    () => {
      const initial: Record<string, string> = {};

      for (const item of criteria) {
        const key = `${item.category}::${item.criterion}`;

        const savedScore = scores.find(
          (score) =>
            score.category === item.category &&
            score.criterion === item.criterion
        );

        const notObserved = observations.some(
          (observation) =>
            observation.category === item.category &&
            observation.criterion === item.criterion
        );

        initial[key] = savedScore
          ? String(savedScore.score)
          : notObserved
            ? "not_observed"
            : "";
      }

      return initial;
    }
  );

  const [strengthValue, setStrengthValue] = useState(strength);
  const [nextStep1Value, setNextStep1Value] =
    useState(nextStep1);
  const [nextStep2Value, setNextStep2Value] =
    useState(nextStep2);

  return (
    <div>
      <section className="profile" style={{ marginTop: "24px" }}>
        <h2>Assessment Scores</h2>

        <p>
          Select a score from 1 to 5, or mark the
          criterion as Not Observed.
        </p>

        {categories.map((category) => {
          const categoryCriteria = criteria.filter(
            (item) => item.category === category
          );

          return (
            <div key={category} style={{ marginTop: "28px" }}>
              <h3>{category}</h3>

              {categoryCriteria.map((item) => {
                const key =
                  `${item.category}::${item.criterion}`;

                return (
                  <div
                    key={key}
                    style={{
                      padding: "14px 0",
                      borderBottom: "1px solid #ddd",
                    }}
                  >
                    <label
                      htmlFor={key}
                      style={{
                        display: "block",
                        fontWeight: 600,
                        marginBottom: "8px",
                      }}
                    >
                      {item.criterion}
                    </label>

                    <select
                      id={key}
                      value={values[key] || ""}
                      onChange={(event) =>
                        setValues((previous) => ({
                          ...previous,
                          [key]: event.target.value,
                        }))
                      }
                      style={{
                        padding: "12px",
                        width: "100%",
                        maxWidth: "320px",
                        borderRadius: "6px",
                        border: "1px solid #ccc",
                      }}
                    >
                      <option value="">Not yet assessed</option>
                      <option value="1">1 / 5</option>
                      <option value="2">2 / 5</option>
                      <option value="3">3 / 5</option>
                      <option value="4">4 / 5</option>
                      <option value="5">5 / 5</option>
                      <option value="not_observed">
                        Not Observed
                      </option>
                    </select>
                  </div>
                );
              })}
            </div>
          );
        })}
      </section>

      <section className="profile" style={{ marginTop: "24px" }}>
        <h2>Player Development Feedback</h2>

        <div style={{ marginTop: "20px" }}>
          <label
            htmlFor="strength"
            style={{ display: "block", fontWeight: 600 }}
          >
            Player Strengths
          </label>

          <textarea
            id="strength"
            value={strengthValue}
            onChange={(event) =>
              setStrengthValue(event.target.value)
            }
            rows={4}
            style={{ width: "100%", padding: "12px" }}
          />
        </div>

        <div style={{ marginTop: "20px" }}>
          <label
            htmlFor="nextStep1"
            style={{ display: "block", fontWeight: 600 }}
          >
            Development Goal 1
          </label>

          <textarea
            id="nextStep1"
            value={nextStep1Value}
            onChange={(event) =>
              setNextStep1Value(event.target.value)
            }
            rows={4}
            style={{ width: "100%", padding: "12px" }}
          />
        </div>

        <div style={{ marginTop: "20px" }}>
          <label
            htmlFor="nextStep2"
            style={{ display: "block", fontWeight: 600 }}
          >
            Development Goal 2
          </label>

          <textarea
            id="nextStep2"
            value={nextStep2Value}
            onChange={(event) =>
              setNextStep2Value(event.target.value)
            }
            rows={4}
            style={{ width: "100%", padding: "12px" }}
          />
        </div>
      </section>

      <section className="profile" style={{ marginTop: "24px" }}>
        <h2>Save Changes</h2>

        <p>
          Your edits are not saved yet. We will connect
          the secure saving functionality next.
        </p>

        <button
          type="button"
          disabled
          style={{
            padding: "14px 24px",
            backgroundColor: "#999",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            fontWeight: 600,
          }}
        >
          Save Changes (Coming Next)
        </button>
      </section>
    </div>
  );
}
