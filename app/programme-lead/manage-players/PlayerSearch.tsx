
'use client';

import { useState } from 'react';
import Link from 'next/link';

type Player = {
  id: number;
  first_name: string;
  last_name: string;
  age_group: string;
};

export default function PlayerSearch({
  players,
}: {
  players: Player[];
}) {
  const [search, setSearch] = useState('');
  const [ageGroup, setAgeGroup] = useState('All');

  const filteredPlayers = players.filter((player) => {
    const fullName =
      `${player.first_name} ${player.last_name}`.toLowerCase();

    const matchesSearch = fullName.includes(
      search.trim().toLowerCase()
    );

    const matchesAgeGroup =
      ageGroup === 'All' ||
      player.age_group === ageGroup;

    return matchesSearch && matchesAgeGroup;
  });

  return (
    <>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '16px',
          marginTop: '24px',
          marginBottom: '20px',
        }}
      >
        <div>
          <label htmlFor="player-search">
            <strong>Search players</strong>
          </label>
          <div style={{ marginTop: '8px' }}>
            <input
              id="player-search"
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search by name"
              style={{
                padding: '12px',
                fontSize: '16px',
                maxWidth: '320px',
                width: '100%',
              }}
            />
          </div>
        </div>

        <div>
          <label htmlFor="age-filter">
            <strong>Age group</strong>
          </label>
          <div style={{ marginTop: '8px' }}>
            <select
              id="age-filter"
              value={ageGroup}
              onChange={(event) =>
                setAgeGroup(event.target.value)
              }
              style={{
                padding: '12px',
                fontSize: '16px',
              }}
            >
              <option value="All">All age groups</option>
              <option value="U9">U9</option>
              <option value="U10">U10</option>
              <option value="U11">U11</option>
              <option value="U12">U12</option>
            </select>
          </div>
        </div>
      </div>

      <p>
        Showing <strong>{filteredPlayers.length}</strong> of{' '}
        <strong>{players.length}</strong> players
      </p>

      <div style={{ overflowX: 'auto' }}>
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            marginTop: '20px',
          }}
        >
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '12px' }}>
                Player
              </th>
              <th style={{ textAlign: 'left', padding: '12px' }}>
                Age Group
              </th>
              <th style={{ textAlign: 'left', padding: '12px' }}>
                Player ID
              </th>
              
<th style={{ textAlign: 'left', padding: '12px' }}>
  Action
</th>

            </tr>
          </thead>
          <tbody>
            {filteredPlayers.map((player) => (
              <tr key={player.id}>
                <td style={{ padding: '12px', borderTop: '1px solid #ddd' }}>
                  {player.first_name} {player.last_name}
                </td>
                <td style={{ padding: '12px', borderTop: '1px solid #ddd' }}>
                  {player.age_group}
                </td>
                <td style={{ padding: '12px', borderTop: '1px solid #ddd' }}>
                  {player.id}
                </td>
                
<td style={{ padding: '12px', borderTop: '1px solid #ddd' }}>
  <Link
    href={`/programme-lead/edit-player/${player.id}`}
    style={{
      color: '#742533',
      fontWeight: 'bold',
    }}
  >
    Edit Player →
  </Link>
</td>

              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredPlayers.length === 0 && (
        <p style={{ marginTop: '20px' }}>
          No players match your search.
        </p>
      )}
    </>
  );
}
