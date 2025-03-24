import React from 'react';
import { Link } from 'react-router-dom';
import './Regist.css';

const Regist = () => {

  function handleRegister() {
    fetch('/signup', {
      method: 'POST'
    })
    .catch((err) => {
      console.error(`Error Fetching the api: ${err.message}`);
    });
  }

  return (
    <div>
      <header>
        <div className="logo">UBlock</div>
        <nav>
          <ul>
            <li><Link to="/">Home</Link></li>
            <li><Link to="/login">Login</Link></li>
          </ul>
        </nav>
      </header>

      <section className="register-container">
        <div className="register-box">
          <h2>Create an Account</h2>
          <form action="/signup" method="POST">
            <label htmlFor="fullname">Full Name</label>
            <input type="text" id="fullname" name="fullname" required />

            <label htmlFor="email">Email</label>
            <input type="email" id="email" name="email" required />

            <label htmlFor="password">Password</label>
            <input type="password" id="password" name="password" required />

            <label htmlFor="confirm-password">Confirm Password</label>
            <input type="password" id="confirm-password" name="confirm-password" required />

            <label htmlFor="role">Role</label>
            <select id="role" name="role" required>
              <option value="forensic">Forensic</option>
              <option value="staff">Staff</option>
              <option value="police">Police</option>
            </select>

            <button type="submit" className="btn" onClick={handleRegister}>Register</button>
            <p className="login-link">Already have an account? <Link to="/login">Login</Link></p> {/* React Router Link */}
          </form>
        </div>
      </section>

      <footer>
        <p>&copy; 2025 DecentraEvidence. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Regist;