import { useEffect, useState } from "react";
import API from "../api/axios";

function Vote() {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState({ type: "", message: "" });
  const [votingFor, setVotingFor] = useState(null);

  useEffect(() => {
    const fetchCandidates = async () => {
      try {
        const res = await API.get("candidates/");
        setCandidates(res.data);
      } catch {
        setFeedback({ type: "error", message: "Failed to load candidates." });
      } finally {
        setLoading(false);
      }
    };

    fetchCandidates();
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
            <button onClick={() => handleVote(candidate.id)} disabled={votingFor === candidate.id}>
              {votingFor === candidate.id ? "Submitting..." : "Vote"}
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}

export default Vote;
