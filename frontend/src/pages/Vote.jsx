import { useEffect, useState } from "react";
import API from "../api/axios";
import { useNavigate } from "react-router-dom";

function Vote() {
  const [candidates, setCandidates] = useState([]);
  const navigate = useNavigate();
  const handleLogout = () => {
  localStorage.removeItem("token");
  navigate("/login");
};

  useEffect(() => {
    API.get("candidates/")
      .then((res) => setCandidates(res.data))
      .catch((err) => console.log(err));
  }, []);

  const handleVote = async (id) => {
    const token = localStorage.getItem("token");

    if (!token) {
      alert("Please login first!");
      return;
    }

    try {
      await API.post(
        `vote/${id}/`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      alert("Vote successful!");
    } catch (error) {
      alert("You already voted or error occurred.");
    }
  };

  return (
  <div className="container">
    <button onClick={handleLogout} style={{ float: "right" }}>
    Logout
  </button>
    <h2>Vote for Your Candidate</h2>

    {candidates.map((candidate) => (
      <div key={candidate.id} className="card">
        <h3>{candidate.name}</h3>
        <p>{candidate.description}</p>
        <p>Votes: {candidate.vote_count}</p>

        <button onClick={() => handleVote(candidate.id)}>
          Vote
        </button>
      </div>
    ))}
  </div>
);
}

export default Vote;
