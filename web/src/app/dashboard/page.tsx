"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createCheckoutSession, getTeams } from "@/lib/api";

type TeamItem = { _id: string; name: string };

export default function DashboardPage() {
  const router = useRouter();
  const [teams, setTeams] = useState<TeamItem[]>([]);
  const [error, setError] = useState("");
  const [upgrading, setUpgrading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    getTeams(token).then((data) => {
      if (Array.isArray(data)) {
        setTeams(data);
      } else if (data && typeof data === "object" && "error" in data) {
        setError(String((data as { error: unknown }).error));
      }
    });
  }, [router]);

  const handleUpgrade = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    setError("");
    setUpgrading(true);
    const session = (await createCheckoutSession(token)) as {
      url?: string;
      error?: string;
    };
    if (session.url) {
      window.location.href = session.url;
      return;
    }
    setError(session.error || "Checkout did not return a payment link.");
    setUpgrading(false);
  };

  return (
    <div className="container mt-5">
      <div className="d-flex justify-content-between align-items-center">
        <h1>Dashboard</h1>
        <button
          type="button"
          className="btn btn-warning"
          onClick={handleUpgrade}
          disabled={upgrading}
        >
          {upgrading ? "Starting checkout..." : "Upgrade to Pro"}
        </button>
      </div>
      <p className="lead">Welcome to your TaskHive dashboard.</p>
      {error && <div className="alert alert-danger">{error}</div>}
      <h2 className="mt-4">Your Teams</h2>
      {teams.length === 0 ? (
        <p>
          No teams yet. <Link href="/teams">Create your first team</Link>.
        </p>
      ) : (
        <div className="list-group">
          {teams.map((team) => (
            <Link
              key={team._id}
              href={`/teams/${team._id}`}
              className="list-group-item list-group-item-action"
            >
              {team.name}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
