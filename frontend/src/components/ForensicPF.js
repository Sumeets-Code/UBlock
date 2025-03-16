import React from 'react';
import { Link } from 'react-router-dom';
import './ForensicPF.css';

const ForensicPF = () => {
    return (
        <div>
            <header>
                <div className="logo">UBlock</div>
                <nav>
                    <ul>
                        <li><Link to="/home" className="btn">Logout</Link></li>
                    </ul>
                </nav>
            </header>

            <section className="profile-header">
                <div className="profile-avatar">
                    <img src="https://via.placeholder.com/150" alt="User Avatar" />
                </div>
                <div className="profile-info">
                    <h2>Forensic Team</h2>
                    <p>Name: John Doe</p>
                    <p>Role: Senior Forensic Analyst</p>
                    <p>Email: john.doe@example.com</p>
                </div>
            </section>

            <section className="profile-details">
                <h3>Assigned Evidence</h3>
                <div className="evidence-list">
                    <div className="evidence-item">
                        <h4>Case #001 - Evidence A</h4>
                        <p>Status: Verified</p>
                    </div>
                    <div className="evidence-item">
                        <h4>Case #002 - Evidence B</h4>
                        <p>Status: Pending Review</p>
                    </div>
                    <div className="evidence-item">
                        <h4>Case #003 - Evidence C</h4>
                        <p>Status: Verified</p>
                    </div>
                </div>
            </section>

            <footer>
                <p>&copy; 2025 DecentraEvidence. All rights reserved.</p>
            </footer>
        </div>
    );
};

export default ForensicPF;