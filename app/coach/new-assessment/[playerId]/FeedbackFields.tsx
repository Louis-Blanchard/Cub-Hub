
'use client';

import { useState } from 'react';

type Criterion = {
  category: string;
  criterion: string;
};

type Props = {
  criteria: Criterion[];
  initialStrength: string;
  initialGoal1: string;
  initialGoal2: string;
};

export default function FeedbackFields({
  criteria,
  initialStrength,
  initialGoal1,
  initialGoal2,
}: Props) {
  const [strength, setStrength] = useState(initialStrength);
  const [goal1, setGoal1] = useState(initialGoal1);
  const [goal2, setGoal2] = useState(initialGoal2);

  const strengthSuggestions = criteria.map(
    (item) => ({
      value: `Demonstrates developing confidence and ability in ${item.criterion.toLowerCase()}.`,
      label: `${item.category}: ${item.criterion}`,
    })
  );

  const goalSuggestions = criteria.map(
    (item) => ({
      value: `Continue developing ${item.criterion.toLowerCase()} through focused practice and match experience.`,
      label: `${item.category}: ${item.criterion}`,
    })
  );

  const fieldStyle = {
    width: '100%',
    padding: '12px',
    border: '1px solid #ccc',
    borderRadius: '8px',
    boxSizing: 'border-box' as const,
    font: 'inherit',
  };

  return (
    <section style={{ marginTop: '40px' }}>
      <h2>Player Development Feedback</h2>

      <p className="muted">
        Select a suggested comment or write your own.
        You can edit any suggestion to make it personal
        to the player.
      </p>

      <div className="report" style={{ marginTop: '20px' }}>
        <h3>Player Strengths</h3>

        <label htmlFor="strength-suggestion">
          Suggested strength
        </label>

        <select
          id="strength-suggestion"
          defaultValue=""
          onChange={(event) => {
            if (event.target.value) {
              setStrength(event.target.value);
            }
          }}
          style={fieldStyle}
        >
          <option value="">Choose a suggestion...</option>

          {strengthSuggestions.map((suggestion, index) => (
            <option key={index} value={suggestion.value}>
              {suggestion.label}
            </option>
          ))}
        </select>

        <label
          htmlFor="strength"
          style={{ display: 'block', marginTop: '16px' }}
        >
          Strengths feedback
        </label>

        <textarea
          id="strength"
          name="strength"
          value={strength}
          onChange={(event) => setStrength(event.target.value)}
          maxLength={2000}
          rows={4}
          style={fieldStyle}
          placeholder="Describe what this player does well..."
        />
      </div>

      <div className="report" style={{ marginTop: '20px' }}>
        <h3>Development Goal 1</h3>

        <label htmlFor="goal1-suggestion">
          Suggested development goal
        </label>

        <select
          id="goal1-suggestion"
          defaultValue=""
          onChange={(event) => {
            if (event.target.value) {
              setGoal1(event.target.value);
            }
          }}
          style={fieldStyle}
        >
          <option value="">Choose a suggestion...</option>

          {goalSuggestions.map((suggestion, index) => (
            <option key={index} value={suggestion.value}>
              {suggestion.label}
            </option>
          ))}
        </select>

        <label
          htmlFor="next_step_1"
          style={{ display: 'block', marginTop: '16px' }}
        >
          Development goal 1 feedback
        </label>

        <textarea
          id="next_step_1"
          name="next_step_1"
          value={goal1}
          onChange={(event) => setGoal1(event.target.value)}
          maxLength={2000}
          rows={4}
          style={fieldStyle}
          placeholder="Describe the main area to improve..."
        />
      </div>

      <div className="report" style={{ marginTop: '20px' }}>
        <h3>Development Goal 2</h3>

        <label htmlFor="goal2-suggestion">
          Suggested development goal
        </label>

        <select
          id="goal2-suggestion"
          defaultValue=""
          onChange={(event) => {
            if (event.target.value) {
              setGoal2(event.target.value);
            }
          }}
          style={fieldStyle}
        >
          <option value="">Choose a suggestion...</option>

          {goalSuggestions.map((suggestion, index) => (
            <option key={index} value={suggestion.value}>
              {suggestion.label}
            </option>
          ))}
        </select>

        <label
          htmlFor="next_step_2"
          style={{ display: 'block', marginTop: '16px' }}
        >
          Development goal 2 feedback
        </label>

        <textarea
          id="next_step_2"
          name="next_step_2"
          value={goal2}
          onChange={(event) => setGoal2(event.target.value)}
          maxLength={2000}
          rows={4}
          style={fieldStyle}
          placeholder="Describe another area to develop..."
        />
      </div>
    </section>
  );
}
