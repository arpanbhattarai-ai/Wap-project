import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";


function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

    const handleLogin = async () => {
    try {
        const res = await axios.post(
        "http://127.0.0.1:8000/api/token/",
        { username, password }
        );

        localStorage.setItem("token", res.data.access);
        navigate("/vote");
    } catch (error) {
        alert("Invalid credentials");
    }
    };

    return (
    <div className="container">
        <h2>Login</h2>

        <div className="card">
        <input
            placeholder="Username"
            onChange={(e) => setUsername(e.target.value)}
        />

        <input
            type="password"
            placeholder="Password"
            onChange={(e) => setPassword(e.target.value)}
        />

        <button onClick={handleLogin}>Login</button>
        </div>
    </div>
    );
}

export default Login;
