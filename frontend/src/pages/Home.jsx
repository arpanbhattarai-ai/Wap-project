import { useEffect, useState } from "react";
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

  if (loading) return <section className="container"><p className="muted">Loading election overview...</p></section>;
  if (error) return <section className="container"><p className="status error">{error}</p></section>;

  return (
    <section className="container">
      <div className="section-header">
        <h2>Election Homepage</h2>
        <p className="muted">Current election status and quick actions.</p>
      </div>

      <div className="card">
        <h3>{election?.title || "Election"}</h3>
        {election?.status === "upcoming" ? <p className="muted">Starts in: {counter}</p> : null}
        {election?.status === "ongoing" ? <p className="muted">Ends in: {counter}</p> : null}
        {election?.status === "ended" ? <p className="muted">Election has ended.</p> : null}
        {election?.status === "paused" ? <p className="muted">Election is paused.</p> : null}

        <div className="home-actions">
          <Link to="/vote">Go to Vote</Link>
          <Link to="/results">View Results</Link>
        </div>
      </div>

      <div className="card">
        <h3>Candidates ({candidates.length})</h3>
        {candidates.length === 0 ? (
          <p className="muted">No candidates added yet.</p>
        ) : (
          <ul className="candidate-list">
            {candidates.map((candidate) => (
              <li key={candidate.id}>
                <strong>{candidate.name}</strong> — {candidate.description}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

export default Home;
