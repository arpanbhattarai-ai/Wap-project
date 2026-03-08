import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../api/axios";

function Register() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState({ type: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (event) => {
    event.preventDefault();
    setStatus({ type: "", message: "" });

    if (!username.trim() || !password.trim()) {
      setStatus({ type: "error", message: "All fields are required." });
      return;
    }

    try {
      setIsSubmitting(true);
      await API.post("register/", {
        username,
        password,
      });

      setStatus({ type: "success", message: "Registration successful! Redirecting..." });
      setTimeout(() => navigate("/login"), 800);
    } catch {
      setStatus({ type: "error", message: "Registration failed. Try a different username." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="auth-wrap">
      <div className="card auth-card">
        <h2>Create Account</h2>
        <p className="muted">Register to participate in elections.</p>

        <form onSubmit={handleRegister} className="form-stack">
          <label htmlFor="username">Username</label>
          <input
            id="username"
            value={username}
            placeholder="Choose username"
            onChange={(e) => setUsername(e.target.value)}
          />

          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            placeholder="Choose password"
            onChange={(e) => setPassword(e.target.value)}
          />

          {status.message ? (
            <p className={`status ${status.type === "success" ? "success" : "error"}`}>
              {status.message}
            </p>
          ) : null}

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Register"}
          </button>
        </form>

        <p className="muted">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </section>
  );
}

export default Register;
