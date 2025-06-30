// client/src/pages/register/Register.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./register.scss";
import axios from "axios";

const Register = () => {
  const [inputs, setInputs] = useState({
    username: "",
    email: "",
    password: "",
    name: "",
  });
  const [err, setErr] = useState(null); // General error message state (for non-field specific errors)
  const [validationErrors, setValidationErrors] = useState({}); // Field-specific validation errors

  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setInputs((prev) => ({ ...prev, [name]: value }));

    // Clear specific validation error and general error when user starts typing
    setValidationErrors((prev) => ({ ...prev, [name]: null }));
    setErr(null);
  };

  const handleSubmit = async (e) => {
    // Renamed from handleClick to handleSubmit for clarity
    e.preventDefault(); // This is crucial to prevent default form submission and page refresh

    const newValidationErrors = {};
    let hasBasicErrors = false; // Flag for required fields/format errors

    // --- Basic Frontend Validation (Required fields, email format, password complexity, name length) ---
    if (!inputs.username.trim()) {
      newValidationErrors.username = "Username is required.";
      hasBasicErrors = true;
    }
    if (!inputs.email.trim()) {
      newValidationErrors.email = "Email is required.";
      hasBasicErrors = true;
    } else if (!/\S+@\S+\.\S+/.test(inputs.email)) {
      newValidationErrors.email = "Email address is invalid.";
      hasBasicErrors = true;
    }
    if (!inputs.password.trim()) {
      newValidationErrors.password = "Password is required.";
      hasBasicErrors = true;
    } else {
      // Password complexity validation
      const password = inputs.password;
      if (password.length < 8) {
        newValidationErrors.password =
          "Password must be at least 8 characters long.";
        hasBasicErrors = true;
      } else if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        newValidationErrors.password =
          "Password must include at least one special character.";
        hasBasicErrors = true;
      } else if (!/\d/.test(password)) {
        newValidationErrors.password =
          "Password must include at least one number.";
        hasBasicErrors = true;
      }
    }
    if (!inputs.name.trim()) {
      newValidationErrors.name = "Name is required.";
      hasBasicErrors = true;
    } else if (inputs.name.trim().length > 15) {
      // Name length validation (less than 16 characters)
      newValidationErrors.name = "Name must be less than 16 characters.";
      hasBasicErrors = true;
    }

    // If there are any basic frontend validation errors, display them and stop.
    if (hasBasicErrors) {
      setValidationErrors(newValidationErrors);
      setErr("Please correct the highlighted errors."); // General message for basic issues
      return; // Stop the function here if validation fails
    }

    // If basic validation passes, attempt registration with the backend.
    // The backend will perform uniqueness checks and send specific messages.
    try {
      await axios.post("http://localhost:8080/api/auth/register", inputs);
      navigate("/login"); // Navigate to login on successful registration
    } catch (error) {
      const backendErrorMessage = error.response?.data; // Get the specific message from the backend

      // Check for specific backend errors and map them to validationErrors
      if (backendErrorMessage === "Username already exists!") {
        newValidationErrors.username = "This username already exists.";
      } else if (backendErrorMessage === "Email already exists!") {
        newValidationErrors.email = "This email already exists.";
      }

      // If specific messages were set from backend, display them.
      // Otherwise, display the general backend error message.
      if (Object.keys(newValidationErrors).length > 0) {
        setValidationErrors(newValidationErrors);
        setErr(null); // Clear general error if specific ones are present
      } else {
        setValidationErrors({}); // Clear any old field errors if new error is general
        setErr(backendErrorMessage || "Registration failed. Please try again.");
      }
      console.error("Registration attempt failed:", error);
    }
  };

  return (
    <div className="register">
      <div className="card">
        <div className="left">
          <h1>Echo</h1>
          <p>
            Connect, share, and discover on Echo. Join our vibrant community to
            express your thoughts, amplify your connections, and explore what
            truly resonates with you.
          </p>
          <span>Already have an account?</span>
          <Link to="/login">
            <button>Login</button>
          </Link>
        </div>
        <div className="right">
          <h1>Register</h1>
          {/* Attach handleSubmit to the form's onSubmit event and add noValidate */}
          <form onSubmit={handleSubmit} noValidate>
            <input
              type="text"
              placeholder="Username"
              name="username"
              onChange={handleChange}
              value={inputs.username}
              className={validationErrors.username ? "input-error" : ""}
            />
            {/* Display validation error for username */}
            {validationErrors.username && (
              <span className="error">{validationErrors.username}</span>
            )}

            <input
              type="email"
              placeholder="Email"
              name="email"
              onChange={handleChange}
              value={inputs.email}
              className={validationErrors.email ? "input-error" : ""}
            />
            {/* Display validation error for email */}
            {validationErrors.email && (
              <span className="error">{validationErrors.email}</span>
            )}

            <input
              type="password"
              placeholder="Password"
              name="password"
              onChange={handleChange}
              value={inputs.password}
              className={validationErrors.password ? "input-error" : ""}
            />
            {/* Display validation error for password */}
            {validationErrors.password && (
              <span className="error">{validationErrors.password}</span>
            )}

            <input
              type="text"
              placeholder="Name"
              name="name"
              onChange={handleChange}
              value={inputs.name}
              className={validationErrors.name ? "input-error" : ""}
            />
            {/* Display validation error for name */}
            {validationErrors.name && (
              <span className="error">{validationErrors.name}</span>
            )}

            {/* Display general error (if any) */}
            {err && <span className="error">{err}</span>}
            {/* The button can now simply be type="submit" */}
            <button type="submit">Register</button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;
