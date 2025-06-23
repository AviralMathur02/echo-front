// client/src/pages/login/Login.jsx
import { useContext, useState } from "react";
import "./login.scss";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/authContext";

const Login = () => {
  // State for form inputs
  const [inputs, setInputs] = useState({
    username: "",
    password: "",
  });
  // State for login error messages (different from validation errors initially)
  const [err, setErr] = useState(null);
  // State for frontend validation error messages
  const [validationErrors, setValidationErrors] = useState({});

  const navigate = useNavigate();

  const { login } = useContext(AuthContext);

  // Handle input changes
  const handleChange = (e) => {
    setInputs((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    // Clear validation error for the field being typed into
    setValidationErrors((prev) => ({ ...prev, [e.target.name]: null }));
    setErr(null); // Clear backend error when user starts typing
  };

  // Handle login button click
  const handleLogin = async (e) => {
    e.preventDefault(); // Prevent default form submission

    // --- Frontend Validation Logic ---
    const newValidationErrors = {};
    if (!inputs.username.trim()) {
      newValidationErrors.username = "Username is required.";
    }
    if (!inputs.password.trim()) {
      newValidationErrors.password = "Password is required.";
    }

    // Check if there are any validation errors
    if (Object.keys(newValidationErrors).length > 0) {
      setValidationErrors(newValidationErrors);
      setErr("Please fill in all required fields."); // General message if any field is empty
      return; // Stop the login process if validation fails
    }

    // If validation passes, attempt login
    try {
      await login(inputs);
      navigate("/"); // Navigate to home page on successful login
    } catch (error) {
      // Set error message from backend response if available, otherwise a generic one
      setErr(
        error.response?.data?.message ||
          "Login failed. Please check your credentials."
      );
      console.error("Login attempt failed:", error); // Log the full error for debugging
    }
  };

  return (
    <div className="login">
      <div className="card">
        <div className="left">
          <h1>Echo Awaits.</h1>
          <p>
            Sign in to connect with your world. Your feed, your friends, and
            your thoughts are ready for you.
          </p>
          <span>New to Echo?</span>
          <Link to="/register">
            <button>Register</button>
          </Link>
        </div>
        <div className="right">
          <h1>Login</h1>
          <form>
            <input
              type="text"
              placeholder="Username"
              name="username"
              value={inputs.username} // Bind value to state
              onChange={handleChange}
            />
            {validationErrors.username && (
              <span className="error">{validationErrors.username}</span>
            )}
            <input
              type="password"
              placeholder="Password"
              name="password"
              value={inputs.password} // Bind value to state
              onChange={handleChange}
            />
            {validationErrors.password && (
              <span className="error">{validationErrors.password}</span>
            )}
            {err && <span className="error">{err}</span>}{" "}
            {/* Display backend/general errors */}
            <button onClick={handleLogin}>Login</button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
