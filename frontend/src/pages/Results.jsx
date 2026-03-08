import { useEffect, useMemo, useState } from "react";
import API from "../api/axios";
import { Bar, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

function Results() {
  const [candidates, setCandidates] = useState([]);
  const [election, setElection] = useState(null);
  const [timeLeft, setTimeLeft] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [electionRes, candidatesRes] = await Promise.all([
          API.get("election/"),
          API.get("candidates/"),
        ]);
        setElection(electionRes.data);
        setCandidates(candidatesRes.data);
      } catch {
        setError("Unable to load results right now.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (!election?.end_time) return;

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const end = new Date(election.end_time).getTime();
      const distance = end - now;

      if (distance <= 0) {
        setTimeLeft("Election Ended");
        clearInterval(interval);
      } else {
        const hours = Math.floor(distance / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
      }

      if (now < end) {
        setTimeLeft(`Time Remaining: ${formatDistance(election.end_time)}`);
        return;
      }

      setTimeLeft("Election Ended");
      clearInterval(interval);
    }, 1000);

    return () => clearInterval(interval);
  }, [election]);

  const winner = useMemo(() => {
    if (candidates.length === 0) return null;
    return candidates.reduce((prev, current) =>
      prev.vote_count >= current.vote_count ? prev : current
    );
  }, [candidates]);

  if (loading) {
    return (
      <section className="container">
        <p className="muted">Loading results...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="container">
        <p className="status error">{error}</p>
      </section>
    );
  }

  if (election?.start_time && election?.end_time) {
    const now = new Date();
    const start = new Date(election.start_time);
    const end = new Date(election.end_time);

    if (now < start) {
      return (
        <section className="container">
          <div className="card">
            <h2>Election has not started yet</h2>
          </div>
        </section>
      );
    }

    if (now >= start && now < end) {
      return (
        <section className="container">
          <div className="card">
            <h2>Election is ongoing</h2>
            <p className="muted">Time Remaining: {timeLeft}</p>
          </div>
        </section>
      );
    }
  }

  const labels = candidates.map((c) => c.name);
  const votes = candidates.map((c) => c.vote_count);

  const data = {
    labels,
    datasets: [
      {
        label: "Votes",
        data: votes,
        backgroundColor: ["#7c8eff", "#52d1a6", "#f78989", "#ffd166", "#69d2e7"],
      },
    ],
  };

  return (
    <section className="container">
      <div className="section-header">
        <h2>Election Results Dashboard</h2>
        <p className="muted">Final vote counts after election close.</p>
      </div>

      {winner ? (
        <div className="card">
          <h3>🏆 Winner: {winner.name}</h3>
          <p className="muted">Total Votes: {winner.vote_count}</p>
        </div>
      ) : (
        <div className="card">
          <p>No votes have been cast yet.</p>
        </div>
      )}

      <div className="card chart-card">
        <h3>Bar Chart</h3>
        <Bar data={data} />
      </div>

      <div className="card chart-card">
        <h3>Pie Chart</h3>
        <Pie data={data} />
      </div>
    </section>
  );
}

export default Results;
