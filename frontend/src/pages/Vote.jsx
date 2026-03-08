import { useEffect, useMemo, useState } from "react";
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

function Vote() {
  const [candidates, setCandidates] = useState([]);
  const [election, setElection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState({ type: "", message: "" });
  const [votingFor, setVotingFor] = useState(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [countdown, setCountdown] = useState("");
  const [baselineClientTs, setBaselineClientTs] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const electionRes = await API.get("election/");
        setElection(electionRes.data);
        setBaselineClientTs(Date.now());

        const candidatesRes = await API.get("candidates/", {
          params: { election_id: electionRes.data.id },
        });
        setCandidates(candidatesRes.data);
      } catch {
        setFeedback({ type: "error", message: "Failed to load election data." });
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

    const targetTime = election.status === "upcoming" ? election.start_time : election.end_time;
    if (!targetTime) {
      return;
    }

    const update = () => {
      setCountdown(formatDistanceFromBaseline(targetTime, election.server_time, baselineClientTs));
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [election, baselineClientTs]);

  const electionState = useMemo(() => {
    if (!election) {
      return { canVote: false, message: "Loading election details..." };
    }

    return {
      canVote: Boolean(election.can_vote),
      message: election.status_message || "",
      status: election.status,
    };
  }, [election]);

  const handleVote = async (id) => {
    if (!electionState.canVote || hasVoted) {
      return;
    }

    setFeedback({ type: "", message: "" });

    try {
      setVotingFor(id);
      await API.post(`vote/${id}/`, {});
      setCandidates((prev) =>
        prev.map((candidate) =>
          candidate.id === id ? { ...candidate, vote_count: candidate.vote_count + 1 } : candidate
        )
      );
      setHasVoted(true);
      setFeedback({ type: "success", message: "Vote submitted successfully." });
    } catch (error) {
      const message = error?.response?.data?.error || "Unable to submit vote.";
      if (message.toLowerCase().includes("already voted")) {
        setHasVoted(true);
      }
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

      {election?.title ? (
        <div className="card">
          <h3>{election.title}</h3>
          {electionState.status === "upcoming" ? <p className="muted">Starts in: {countdown}</p> : null}
          {electionState.status === "ongoing" ? <p className="muted">Ends in: {countdown}</p> : null}
          {!electionState.canVote && electionState.message ? (
            <p className="status error">{electionState.message}</p>
          ) : null}
        </div>
      ) : null}

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
            <button
              onClick={() => handleVote(candidate.id)}
              disabled={votingFor === candidate.id || !electionState.canVote || hasVoted}
            >
              {votingFor === candidate.id ? "Submitting..." : hasVoted ? "Vote Submitted" : "Vote"}
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}

export default Vote;
