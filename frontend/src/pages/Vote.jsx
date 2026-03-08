import { useEffect, useState } from "react";
import API from "../api/axios";

function Vote() {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState({ type: "", message: "" });
  const [votingFor, setVotingFor] = useState(null);
  const [election, setElection] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const electionRes = await API.get("election/");
        setElection(electionRes.data);

        const candidatesRes = await API.get("candidates/", {
          params: { election_id: electionRes.data.id },
        });
        setCandidates(candidatesRes.data);
      } catch (err) {
        if (err?.response?.status === 404) {
          setFeedback({ type: "error", message: "No active election configured yet." });
        } else {
          setFeedback({ type: "error", message: "Failed to load candidates." });
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleVote = async (id) => {
    setFeedback({ type: "", message: "" });

    try {
      setVotingFor(id);
      await API.post(`vote/${id}/`, {});
      setCandidates((prev) =>
        prev.map((c) => (c.id === id ? { ...c, vote_count: c.vote_count + 1 } : c))
      );
      setFeedback({ type: "success", message: "Vote submitted successfully." });
    } catch (error) {
      const message = error?.response?.data?.error || "You may have already voted.";
      setFeedback({ type: "error", message });
    } finally {
      setVotingFor(null);
    }
  };

  const now = new Date();
  const hasElectionWindow = election?.start_time && election?.end_time;
  const electionNotStarted = hasElectionWindow && now < new Date(election.start_time);
  const electionEnded = hasElectionWindow && now >= new Date(election.end_time);

  return (
    <section className="container">
      <div className="section-header">
        <h2>Cast Your Vote</h2>
        <p className="muted">Select one candidate carefully. Your vote is final.</p>
      </div>

      {feedback.message ? (
        <p className={`status ${feedback.type === "success" ? "success" : "error"}`}>
          {feedback.message}
        </p>
      ) : null}

      {loading ? <p className="muted">Loading candidates...</p> : null}

      {!loading && electionNotStarted ? (
        <div className="card">
          <p>Election has not started yet. Voting will open at the configured start time.</p>
        </div>
      ) : null}

      {!loading && electionEnded ? (
        <div className="card">
          <p>Election has ended. Voting is closed.</p>
        </div>
      ) : null}

      {!loading && candidates.length === 0 ? (
        <div className="card">
          <p>No candidates available right now.</p>
        </div>
      ) : null}

      <div className="candidate-grid">
        {candidates.map((candidate) => (
          <article key={candidate.id} className="card candidate-card">
            <h3>{candidate.name}</h3>
            <p>{candidate.description}</p>
            <p className="muted">Current votes: {candidate.vote_count}</p>
            <button
              onClick={() => handleVote(candidate.id)}
              disabled={votingFor === candidate.id || electionNotStarted || electionEnded}
            >
              {votingFor === candidate.id ? "Submitting..." : "Vote"}
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}

export default Vote;
