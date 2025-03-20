import React from 'react';
import { Link } from 'react-router-dom';
import './Login.css';

const Login = () => {

  function handleLogin() {
    fetch('/signin')
    .then(response => response.json())
    .then(data => {
      console.log(data);
      if (data.success) {
        window.location.href = '/';
      }
    })
  }
    
  return (
    <div>
      <header>
        <div className="logo">UBlock</div>
        <nav>
          <ul>
            <li><Link to="/">Home</Link></li>
            <li><Link to="/registration">Sign Up</Link></li>
          </ul>
        </nav>
      </header>

      <section className="login-container">
        <div className="login-box">
          <h2>Login</h2>
          <form action="#" method="POST">
            <label htmlFor="email">Email</label>
            <input type="email" id="email" name="email" required />

            <label htmlFor="password">Password</label>
            <input type="password" id="password" name="password" required />

            <button type="submit" className="btn" onClick={handleLogin}>Login</button>
            <p className="signup-link">Don't have an account? <Link to="/registration">Sign up</Link></p>
          </form>
        </div>
      </section>

      <footer>
        <p>&copy; 2025 DecentraEvidence. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Login;