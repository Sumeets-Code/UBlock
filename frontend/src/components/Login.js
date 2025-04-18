import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom'; // ← Import useNavigate
import LetterGlitch from './LetterGlitch';
import './Login.css';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate(); // ← Initialize navigator

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log('Email:', email);
        console.log('Password:', password);

        // Example check (replace with actual auth logic if needed)
        if (email && password) {
            navigate('/police'); // ← Navigate to Admin Page
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

                    <button type="submit" className="btn">Login</button>
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