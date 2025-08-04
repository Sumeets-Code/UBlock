import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import LetterGlitch from "./LetterGlitch";
import "./Login.css";
import axios from "axios";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post("http://localhost:3300/signin", {
        email,
        password,
      });

      console.log("Backend response:", response.data); // Debug log

      const {
        profilePhoto,
        role,
        username,
        email: resEmail,
        contact,
        deparment,
        rank,
        e_id,
        dateOfJoining
      } = response.data;

      const cleanRole = role ? role.toLowerCase() : "";

      const user = {
        profilePhoto,
        role: cleanRole,
        username,
        email: resEmail || email,
        contact: contact || "",
        rank,
        deparment,
        e_id,
        dateOfJoining,
      }

      console.log("Raw role from backend:", role);
      console.log("Normalized role:", cleanRole);

      if (["admin", "forensic", "police", "staff"].includes(cleanRole)) {
        // Save to localStorage
        localStorage.setItem("user", JSON.stringify( user ));

        console.log("Navigating to:", `/${cleanRole}`);
        navigate(`/${cleanRole}`, { state: user });
      } else {
        alert("Unknown role: " + role);
      }

    } catch (error) {
      console.error("Login failed:", error);
      if (error.response && error.response.data && error.response.data.message) {
        alert(error.response.data.message);
      } else {
        alert("Login failed. Please try again.");
      }
    }
  };

  return (
    <div className="login-container">
      <div className="glitch-background">
        <LetterGlitch />
      </div>

      <div className="login-box">
        <h2>Login</h2>
        <form onSubmit={handleSubmit}>
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button type="submit" className="btn">
            Login
          </button>
          <p className="signup-link">
            Don't have an account? <Link to="/registration">Sign up</Link>
          </p>
        </form>
      </div>

      <footer>
        <p>&copy; 2025 DecentraEvidence. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Login;
