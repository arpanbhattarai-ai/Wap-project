import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import API from "../api/axios";

function formatDistanceFromBaseline(targetTime, serverNow, baselineClientTs) {
  const target = new Date(targetTime).getTime();
  const serverStart = new Date(serverNow).getTime();
  const elapsedClientMs = Date.now() - baselineClientTs;
  const distance = target - (serverStart + elapsedClientMs);

  if (Number.isNaN(distance) || distance <= 0) {
    return "0h 0m 0s";
  }

  const totalSeconds = Math.floor(distance / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `${hours}h ${minutes}m ${seconds}s`;
}

function Home() {
  const [election, setElection] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [counter, setCounter] = useState("");
  const [baselineClientTs, setBaselineClientTs] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const electionRes = await API.get("election/");
        setElection(electionRes.data);

        const candidatesRes = await API.get("candidates/", {
          params: { election_id: electionRes.data.id },
        });
        setCandidates(candidatesRes.data);
        setBaselineClientTs(Date.now());
      } catch {
        setError("Could not load election overview.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (!election?.server_time || baselineClientTs === null) {
      return;
    }

    const target = election.status === "upcoming" ? election.start_time : election.end_time;
    if (!target) {
      return;
    }

    const update = () => {
      setCounter(formatDistanceFromBaseline(target, election.server_time, baselineClientTs));
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [election, baselineClientTs]);

  const statusLabel = useMemo(() => {
    switch (election?.status) {
      case "upcoming":
        return "Upcoming";
      case "ongoing":
        return "Live now";
      case "ended":
        return "Ended";
      case "paused":
        return "Paused";
      default:
        return "Unknown";
    }
  }, [election?.status]);

  const statusDescription = useMemo(() => {
    switch (election?.status) {
      case "upcoming":
        return `Voting starts in ${counter}`;
      case "ongoing":
        return `Voting ends in ${counter}`;
      case "ended":
        return "Voting has ended. View the final results.";
      case "paused":
        return "Voting is temporarily paused.";
      default:
        return "Election state is unavailable.";
    }
  }, [election?.status, counter]);

  if (loading) return <section className="container"><p className="muted">Loading election overview...</p></section>;
  if (error) return <section className="container"><p className="status error">{error}</p></section>;

  return (
    <section className="container home-page">
      <div className="hero card">
        <div className="hero-content">
          <p className="muted">Welcome to the voting portal</p>
          <h2>{election?.title || "Election Dashboard"}</h2>
          <p className="hero-description">{statusDescription}</p>
          <span className={`status-pill status-${election?.status || "unknown"}`}>{statusLabel}</span>
          <div className="home-actions">
            <Link className="btn-link" to="/vote">Cast Vote</Link>
            <Link className="btn-link btn-link-secondary" to="/results">See Results</Link>
          </div>
        </div>
        <div className="hero-stats">
          <div className="stat-box">
            <span className="muted">Candidates</span>
            <strong>{candidates.length}</strong>
          </div>
          <div className="stat-box">
            <span className="muted">Election state</span>
            <strong>{statusLabel}</strong>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="section-header">
          <h3>Candidate spotlight</h3>
          <p className="muted">Meet the participants in this election.</p>
        </div>
        {candidates.length === 0 ? (
          <p className="muted">No candidates added yet.</p>
        ) : (
          <ul className="candidate-list enhanced-list">
            {candidates.map((candidate) => (
              <li key={candidate.id}>
                <strong>{candidate.name}</strong>
                <p className="muted">{candidate.description}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

export default Home;
