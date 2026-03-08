import { Link, useLocation, useNavigate } from "react-router-dom";

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem("token");

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar">
      <div className="nav-left">
        <h1>College Election</h1>
        <span className="subtitle">Secure digital voting portal</span>
      </div>

      <div className="nav-right">
        {!token ? (
          <>
            <Link className={isActive("/login") ? "active" : ""} to="/login">
              Login
            </Link>
            <Link className={isActive("/register") ? "active" : ""} to="/register">
              Register
            </Link>
          </>
        ) : (
          <>
            <Link className={isActive("/vote") ? "active" : ""} to="/vote">
              Vote
            </Link>
            <Link className={isActive("/results") ? "active" : ""} to="/results">
              Results
            </Link>
            <button className="danger-btn" onClick={handleLogout}>
              Logout
            </button>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
