import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Homee.css';

const Homee = () => {
    const navigate = useNavigate();

    const handleSignUpClick = () => {
        navigate('/registration');
    };

    return (
        <div>
            <header>
                <div className="logo">UBlock</div>
                <nav>
                    <ul>
                        <li><a href="#features">Features</a></li>
                        <li><a href="#about">About</a></li>
                    </ul>
                </nav>
            </header>

            <section className="hero">
                <h1>Secure & Decentralized Evidence Management</h1>
                <p>Ensuring transparency, security, and trust in digital evidence storage.</p>
                <a href="#features" className="btn" onClick={handleSignUpClick}>Sign Up</a>
            </section>

            <section id="features" className="features">
                <h2>Key Features</h2>
                <div className="feature-grid">
                    <div className="feature">
                        <h3>Blockchain Security</h3>
                        <p>Immutable records stored securely on a blockchain network.</p>
                    </div>
                    <div className="feature">
                        <h3>Access Control</h3>
                        <p>Only authorized users can access and verify evidence.</p>
                    </div>
                    <div className="feature">
                        <h3>Transparency</h3>
                        <p>Every action is recorded, ensuring full auditability.</p>
                    </div>
                </div>
            </section>

            <section id="about" className="about">
                <h2>About Us</h2>
                <p>DecentraEvidence is dedicated to providing secure and decentralized evidence management solutions. Our platform leverages blockchain technology to ensure integrity and transparency.</p>
            </section>

            <footer>
                <p>&copy; 2025 DecentraEvidence. All rights reserved.</p>
            </footer>
        </div>
    );
};

export default Homee;