
"use client";

import { useState } from "react";
import Link from "next/link";

type AssessmentRow = {
  id: number;
  playerName: string;
  ageGroup: string;
  period: string;
  status: string;
};

export default function AssessmentTable({
  assessments,
}: {
  assessments: AssessmentRow[];
}) {
  const [search, setSearch] = useState("");
  const [period, setPeriod] = useState("all");
  const [status, setStatus] = useState("all");

  const periods = [...new Set(assessments.map((a) => a.period))];

  const filtered = assessments.filter((assessment) => {
    const matchesSearch = assessment.playerName
      .toLowerCase()
      .includes(search.toLowerCase().trim());

    const matchesPeriod =
      period === "all" || assessment.period === period;

    const matchesStatus =
      status === "all" || assessment.status === status;

    return matchesSearch && matchesPeriod && matchesStatus;
  });

  return (
    <>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "12px",
          marginTop: "20px",
          marginBottom: "20px",
        }}
      >
        <input
          type="search"
          placeholder="Search player name..."
          aria-label="Search player name"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ padding: "12px", flex: "2 1 200px" }}
        />

        <select
          aria-label="Filter assessment period"
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          style={{ padding: "12px", flex: "1 1 180px" }}
        >
          <option value="all">All Assessment Periods</option>
          {periods.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        <select
          aria-label="Filter assessment status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          style={{ padding: "12px", flex: "1 1 150px" }}
        >
          <option value="all">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
        </select>
      </div>

      <p>
        Showing {filtered.length} of {assessments.length} assessments
      </p>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {["Player", "Age Group", "Assessment", "Status", "Action"].map(
                (heading) => (
                  <th key={heading} style={cellStyle}>
                    {heading}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {filtered.map((assessment) => (
              <tr key={assessment.id}>
                <td style={cellStyle}>{assessment.playerName}</td>
                <td style={cellStyle}>{assessment.ageGroup}</td>
                <td style={cellStyle}>{assessment.period}</td>
                <td style={cellStyle}>
                  <span
                    style={{
                      color:
                        assessment.status === "published"
                          ? "#287a4b"
                          : "#986b12",
                      fontWeight: 600,
                    }}
                  >
                    {assessment.status === "published"
                      ? "Published"
                      : "Draft"}
                  </span>
                </td>
                <td style={cellStyle}>
                  <Link
                    href={`/programme-lead/review/${assessment.id}`}
                    style={{
                      color: "#742533",
                      fontWeight: 600,
                      textDecoration: "underline",
                    }}
                  >
                    Review Assessment →
                  </Link>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} style={cellStyle}>
                  No assessments match your search or filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

const cellStyle: React.CSSProperties = {
  textAlign: "left",
  padding: "14px",
  borderBottom: "1px solid #ddd",
};
