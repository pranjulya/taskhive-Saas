"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createTeam, getTeams } from "../../lib/api";

export default function TeamsPage() {
  const [teamName, setTeamName] = useState("");
  const [error, setError] = useState("");
  const [teams, setTeams] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("You must be logged in to view teams.");
      return;
    }

    const fetchTeams = async () => {
      try {
        const teamsData = await getTeams(token);
        if (Array.isArray(teamsData)) {
          setTeams(teamsData);
        } else {
          setError(teamsData.message || "Failed to fetch teams.");
        }
      } catch (err) {
        setError("An error occurred while fetching teams.");
      }
    };

    fetchTeams();
  }, []);

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) {
      setError("You must be logged in to create a team.");
      return;
    }

    try {
      const newTeam = await createTeam(teamName, token);
      if (newTeam._id) {
        setTeams([...teams, newTeam]);
        setTeamName("");
      } else {
        setError(newTeam.message || "Failed to create team.");
      }
    } catch (err) {
      setError("An error occurred while creating the team.");
    }
  };

  return (
    <div className="container">
      <h1>Teams</h1>
      {error && <div className="alert alert-danger">{error}</div>}
      <div className="card">
        <div className="card-body">
          <h5 className="card-title">Create a new team</h5>
          <form onSubmit={handleCreateTeam}>
            <div className="mb-3">
              <label htmlFor="teamName">Team Name</label>
              <input
                type="text"
                className="form-control"
                id="teamName"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary">
              Create Team
            </button>
          </form>
        </div>
      </div>
      <div className="mt-4">
        <h2>Your Teams</h2>
        <ul className="list-group">
          {teams.map((team) => (
            <li key={team._id} className="list-group-item">
              <Link href={`/teams/${team._id}`}>{team.name}</Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
