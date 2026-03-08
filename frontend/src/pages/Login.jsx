import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../api/axios";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (event) => {
    event.preventDefault();
    setError("");

    if (!username.trim() || !password.trim()) {
      setError("Please enter both username and password.");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await API.post("token/", { username, password });

      localStorage.setItem("token", res.data.access);
      navigate("/");
    } catch {
      setError("Invalid credentials. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="auth-wrap">
      <div className="card auth-card">
        <h2>Welcome Back</h2>
        <p className="muted">Log in to cast your vote.</p>

        <form onSubmit={handleLogin} className="form-stack">
          <label htmlFor="username">Username</label>
          <input
            id="username"
            value={username}
            placeholder="Enter username"
            onChange={(e) => setUsername(e.target.value)}
          />

          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            placeholder="Enter password"
            onChange={(e) => setPassword(e.target.value)}
          />

          {error ? <p className="status error">{error}</p> : null}

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="muted">
          No account yet? <Link to="/register">Register here</Link>
        </p>
      </div>
    </section>
  );
}

export default Login;
