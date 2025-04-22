import React from "react";
import { Link, useNavigate } from "react-router-dom";
import LetterGlitch from "./LetterGlitch";
import "./Regist.css";
import axios from "axios";

const Regist = () => {
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    const userData = {
      username: document.getElementById("fullname").value,
      email: document.getElementById("email").value,
      password: document.getElementById("password").value,
      role: document.getElementById("role").value,
      contact: document.getElementById("contact").value,
    };

    try {
      const response = await axios.post(
        "http://localhost:3300/signup",
        userData
      );
      if (response.status === 200 || response.status === 201) {
        console.log("User registered:", response.data);
        navigate("/login"); // Redirect to login on success
      }
    } catch (error) {
      console.error("Error registering user:", error);
      alert("Registration failed. Please try again.");
    }
  };

  return (
    <div className="register-container">
      <div className="glitch-background">
        <LetterGlitch />
      </div>

      <div className="register-box">
        <h2>Create an Account</h2>
        <form onSubmit={handleSubmit}>
          <label htmlFor="fullname">Full Name</label>
          <input type="text" id="fullname" name="fullname" required />

          <label htmlFor="email">Email</label>
          <input type="email" id="email" name="email" required />

          <label htmlFor="password">Password</label>
          <input type="password" id="password" name="password" required />

          <label htmlFor="confirm-password">Confirm Password</label>
          <input
            type="password"
            id="confirm-password"
            name="confirm-password"
            required
          />

          <label htmlFor="role">Role</label>
          <select id="role" name="role" required>
            <option value="forensic">Forensic</option>
            <option value="staff">Staff</option>
            <option value="police">Police</option>
          </select>

          <label htmlFor="contact">Contact No</label>
          <input type="number" id="contact" name="contact" required />

          <button type="submit" className="btn">
            Register
          </button>
          <p className="login-link">
            Already have an account? <Link to="/login">Login</Link>
          </p>
        </form>
      </div>

      <footer className="footer">
        <p>&copy; 2025 DecentraEvidence. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Regist;