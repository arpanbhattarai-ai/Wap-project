import { useEffect, useState } from "react";
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

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

function Results() {
  const [candidates, setCandidates] = useState([]);
  const [election, setElection] = useState(null);
  const [timeLeft, setTimeLeft] = useState("");

  // Fetch election + candidates
  useEffect(() => {
    API.get("election/")
      .then((res) => setElection(res.data))
      .catch((err) => console.log(err));

    API.get("candidates/")
      .then((res) => setCandidates(res.data))
      .catch((err) => console.log(err));
  }, []);

  // Countdown timer
  useEffect(() => {
    if (!election) return;

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const end = new Date(election.end_time).getTime();
      const distance = end - now;

      if (distance <= 0) {
        setTimeLeft("Election Ended");
        clearInterval(interval);
      } else {
        const hours = Math.floor(distance / (1000 * 60 * 60));
        const minutes = Math.floor(
          (distance % (1000 * 60 * 60)) / (1000 * 60)
        );
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [election]);

  // If election still ongoing → hide results
  if (election) {
  const now = new Date();
  const start = new Date(election.start_time);
  const end = new Date(election.end_time);

  if (now < start) {
    return (
      <div className="container">
        <h2>Election has not started yet</h2>
      </div>
    );
  }

  if (now >= start && now < end) {
    return (
      <div className="container">
        <h2>Election is ongoing</h2>
        <h3>Time Remaining: {timeLeft}</h3>
      </div>
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
        backgroundColor: [
          "#4e73df",
          "#1cc88a",
          "#e74a3b",
          "#f6c23e",
          "#36b9cc",
        ],
      },
    ],
  };

  const winner = candidates.reduce((prev, current) =>
    prev.vote_count > current.vote_count ? prev : current
  );

  return (
    <div className="container">
      <h2>Election Results Dashboard</h2>

      <div className="card">
        <h3>🏆 Winner: {winner.name}</h3>
        <p>Total Votes: {winner.vote_count}</p>
      </div>

      <div className="card">
        <h3>Bar Chart</h3>
        <Bar data={data} />
      </div>

      <div className="card">
        <h3>Pie Chart</h3>
        <Pie data={data} />
      </div>
    </div>
  );
}

export default Results;
